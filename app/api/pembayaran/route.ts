import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import {
  BIAYA,
  JENIS_PENDAFTARAN,
  METODE,
  cekBukti,
  cekNamaPengirim,
  cekNoPengirim,
  cekRef,
  cekTanggal,
} from "../../lib/pembayaran";
import { dbError, getPool } from "../../lib/server/db";
import { getSiswaId } from "../../lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIR = path.join(process.cwd(), "uploads", "bukti");
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const noSession = () => bad("Sesi habis. Silahkan masuk lagi.", 401);

/* ---------- Status & ringkasan pembayaran ---------- */
export async function GET() {
  const akunId = await getSiswaId();
  if (!akunId) return noSession();

  try {
    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT b.nama_lengkap, b.nisn, b.jurusan,
              p.metode, p.tipe, p.nominal, p.status AS bayar_status,
              DATE_FORMAT(p.tanggal_bayar, '%Y-%m-%d') AS tanggal_bayar,
              p.dibuat_pada
         FROM akun_siswa a
         LEFT JOIN biodata_siswa b ON b.akun_id = a.id
         LEFT JOIN pembayaran p ON p.akun_id = a.id
        WHERE a.id = ?`,
      [akunId]
    );
    const r = rows[0];
    if (!r) return noSession();

    return NextResponse.json({
      biaya: BIAYA,
      jenis: JENIS_PENDAFTARAN,
      biodata: r.nama_lengkap ? { nama: r.nama_lengkap, nisn: r.nisn, jurusan: r.jurusan } : null,
      status: r.metode ? r.bayar_status : "belum",
      lunas: r.bayar_status === "terverifikasi",
      pembayaran: r.metode
        ? { metode: r.metode, tipe: r.tipe, nominal: r.nominal, status: r.bayar_status, tanggal_bayar: r.tanggal_bayar, dibuat_pada: r.dibuat_pada }
        : null,
    });
  } catch (e) {
    return dbError(e);
  }
}

/* ---------- Konfirmasi pembayaran ---------- */
export async function POST(req: Request) {
  const akunId = await getSiswaId();
  if (!akunId) return noSession();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Data tidak valid.");
  }

  const m = METODE.find((x) => x.id === String(form.get("metode") ?? ""));
  if (!m) return bad("Metode pembayaran tidak valid.");

  const nama = String(form.get("nama_pengirim") ?? "").trim();
  const noPengirim = String(form.get("no_pengirim") ?? "").trim();
  const ref = String(form.get("no_referensi") ?? "").trim();
  const tanggal = String(form.get("tanggal") ?? "");

  const err = cekNamaPengirim(nama) || cekNoPengirim(m.tipe, noPengirim) || cekRef(ref) || cekTanggal(tanggal);
  if (err) return bad(err);

  const raw = form.get("bukti");
  const file = raw instanceof File && raw.size > 0 ? raw : null;
  if (!file) return bad("Bukti pembayaran wajib diunggah.");
  const eb = cekBukti(file.name, file.size);
  if (eb) return bad(eb);

  let newPath: string | null = null;
  try {
    const pool = await getPool();

    const [bio] = await pool.execute<RowDataPacket[]>("SELECT id FROM biodata_siswa WHERE akun_id = ?", [akunId]);
    if (bio.length === 0) return bad("Lengkapi Data Diri terlebih dahulu sebelum membayar.");

    const [sudah] = await pool.execute<RowDataPacket[]>(
      "SELECT id, status, bukti_file FROM pembayaran WHERE akun_id = ?",
      [akunId]
    );
    const lama = sudah[0];
    if (lama && lama.status !== "ditolak") {
      return bad(
        lama.status === "terverifikasi"
          ? "Pembayaran kamu sudah terverifikasi."
          : "Pembayaran kamu sedang menunggu verifikasi admin.",
        409
      );
    }

    const ext = file.name.split(".").pop()!.toLowerCase();
    await mkdir(DIR, { recursive: true });
    const fileName = `${akunId}-${Date.now()}.${ext}`;
    newPath = path.join(DIR, fileName);
    await writeFile(newPath, Buffer.from(await file.arrayBuffer()));

    if (lama) {
      // Pembayaran sebelumnya ditolak -> kirim ulang, kembali menunggu verifikasi
      await pool.execute(
        `UPDATE pembayaran
            SET metode = ?, tipe = ?, nominal = ?, nama_pengirim = ?, no_pengirim = ?, no_referensi = ?,
                tanggal_bayar = ?, bukti_file = ?, bukti_nama_asli = ?, status = 'menunggu',
                dibuat_pada = CURRENT_TIMESTAMP
          WHERE akun_id = ?`,
        [m.id, m.tipe, BIAYA, nama, noPengirim, ref || null, tanggal, fileName, file.name.slice(-200), akunId]
      );
      await unlink(path.join(DIR, path.basename(String(lama.bukti_file)))).catch(() => {});
    } else {
      await pool.execute(
        `INSERT INTO pembayaran
           (akun_id, metode, tipe, nominal, nama_pengirim, no_pengirim, no_referensi,
            tanggal_bayar, bukti_file, bukti_nama_asli, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'menunggu')`,
        [akunId, m.id, m.tipe, BIAYA, nama, noPengirim, ref || null, tanggal, fileName, file.name.slice(-200)]
      );
    }

    return NextResponse.json({ ok: true, status: "menunggu" });
  } catch (e) {
    if (newPath) await unlink(newPath).catch(() => {});
    if ((e as { code?: string })?.code === "ER_DUP_ENTRY") return bad("Pembayaran kamu sudah tercatat.", 409);
    return dbError(e);
  }
}
