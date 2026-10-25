import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";
import { dbError, getPool } from "../../lib/server/db";
import { getSiswaId } from "../../lib/server/session";
import { DURASI_MS, bacaJawaban, bersihkan, jumlahSoal, selesaikan, soalPublik } from "../../lib/server/ujian";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Baris = RowDataPacket & {
  mulai_ms: number | string;
  selesai_ms: number | string | null;
  jawaban: string | null;
  benar: number | null;
  nilai: string | number | null;
  total: number | null;
};

const json = (b: unknown, status = 200) => NextResponse.json(b, { status });
const noSession = () => json({ error: "Sesi habis. Silahkan masuk lagi." }, 401);

async function sudahBayar(pool: Pool, akunId: number) {
  const [r] = await pool.execute<RowDataPacket[]>("SELECT id FROM pembayaran WHERE akun_id = ? AND status = 'terverifikasi'", [akunId]);
  return r.length > 0;
}
async function ambil(pool: Pool, akunId: number) {
  const [r] = await pool.execute<Baris[]>("SELECT * FROM ujian_siswa WHERE akun_id = ?", [akunId]);
  return r[0];
}
const hasil = (b: Baris) => ({
  terkunci: false,
  mulai: true,
  selesai: true,
  nilai: Number(b.nilai ?? 0),
  benar: Number(b.benar ?? 0),
  total: Number(b.total ?? 50),
});

// Kalau waktu habis dan belum dikirim, nilai otomatis dihitung dari jawaban yang tersimpan.
async function tutupKalauHabis(pool: Pool, akunId: number, b: Baris) {
  if (b.selesai_ms === null && Date.now() >= Number(b.mulai_ms) + DURASI_MS) {
    await selesaikan(pool, akunId, bacaJawaban(b.jawaban));
    return (await ambil(pool, akunId))!;
  }
  return b;
}

/* ---------- Ambil soal (otomatis memulai waktu saat pertama dibuka) ---------- */
// GET /api/ujian?info=1 -> hanya status (tidak memulai ujian)
export async function GET(req: Request) {
  const akunId = await getSiswaId();
  if (!akunId) return noSession();
  const info = new URL(req.url).searchParams.get("info") === "1";

  try {
    const pool = await getPool();
    if (!(await sudahBayar(pool, akunId))) {
      const [p] = await pool.execute<RowDataPacket[]>("SELECT status FROM pembayaran WHERE akun_id = ?", [akunId]);
      return json({ terkunci: true, pembayaran: p[0]?.status ?? "belum", total: await jumlahSoal(pool) });
    }

    let b = await ambil(pool, akunId);
    if (!b) {
      if (info) return json({ terkunci: false, mulai: false, selesai: false });
      if ((await jumlahSoal(pool)) === 0) {
        return json({ error: "Belum ada soal tes. Silakan hubungi panitia." }, 503);
      }
      await pool.execute("INSERT IGNORE INTO ujian_siswa (akun_id, mulai_ms) VALUES (?, ?)", [akunId, Date.now()]);
      b = (await ambil(pool, akunId))!;
    }
    b = await tutupKalauHabis(pool, akunId, b);

    if (b.selesai_ms !== null) return json(hasil(b));

    const sisaMs = Math.max(0, Number(b.mulai_ms) + DURASI_MS - Date.now());
    if (info) return json({ terkunci: false, mulai: true, selesai: false, sisaMs });
    return json({
      terkunci: false,
      mulai: true,
      selesai: false,
      soal: await soalPublik(pool),
      jawaban: bacaJawaban(b.jawaban),
      sisaMs,
      durasiMs: DURASI_MS,
      total: (await jumlahSoal(pool)),
    });
  } catch (e) {
    return dbError(e);
  }
}

/* ---------- Simpan jawaban sementara ---------- */
export async function PUT(req: Request) {
  const akunId = await getSiswaId();
  if (!akunId) return noSession();

  let body: { jawaban?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Data tidak valid." }, 400);
  }

  try {
    const pool = await getPool();
    if (!(await sudahBayar(pool, akunId))) return json({ error: "Selesaikan pembayaran dulu." }, 403);
    let b = await ambil(pool, akunId);
    if (!b) return json({ error: "Ujian belum dimulai." }, 400);
    b = await tutupKalauHabis(pool, akunId, b);
    if (b.selesai_ms !== null) return json({ ...hasil(b) });

    await pool.execute("UPDATE ujian_siswa SET jawaban = ? WHERE akun_id = ? AND selesai_ms IS NULL", [
      JSON.stringify(bersihkan(body.jawaban)),
      akunId,
    ]);
    return json({ ok: true, selesai: false });
  } catch (e) {
    return dbError(e);
  }
}

/* ---------- Kirim jawaban & nilai ---------- */
export async function POST(req: Request) {
  const akunId = await getSiswaId();
  if (!akunId) return noSession();

  let body: { jawaban?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* body kosong -> pakai jawaban yang sudah tersimpan */
  }

  try {
    const pool = await getPool();
    if (!(await sudahBayar(pool, akunId))) return json({ error: "Selesaikan pembayaran dulu." }, 403);
    const b = await ambil(pool, akunId);
    if (!b) return json({ error: "Ujian belum dimulai." }, 400);
    if (b.selesai_ms !== null) return json(hasil(b));

    const expired = Date.now() >= Number(b.mulai_ms) + DURASI_MS;
    const jawaban = body.jawaban !== undefined && !expired ? bersihkan(body.jawaban) : bacaJawaban(b.jawaban);
    const { benar, nilai, total } = await selesaikan(pool, akunId, jawaban);
    return json({ terkunci: false, mulai: true, selesai: true, nilai, benar, total });
  } catch (e) {
    return dbError(e);
  }
}
