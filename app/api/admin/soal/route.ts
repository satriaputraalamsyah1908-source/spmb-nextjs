import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { cekSoal } from "../../../lib/soalTes";
import { dbError, getPool } from "../../../lib/server/db";
import { getStaffRole } from "../../../lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noAdmin = () => NextResponse.json({ error: "Sesi admin habis. Silahkan masuk lagi." }, { status: 401 });

// Daftar semua soal (beserta kunci jawaban) - hanya admin.
export async function GET() {
  if ((await getStaffRole()) !== "admin") return noAdmin();
  try {
    const pool = await getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, urutan, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, kunci FROM soal_tes ORDER BY urutan, id"
    );
    return NextResponse.json({
      daftar: rows.map((r) => ({
        id: Number(r.id),
        pertanyaan: String(r.pertanyaan),
        opsi: [r.opsi_a, r.opsi_b, r.opsi_c, r.opsi_d].map(String),
        kunci: Number(r.kunci),
      })),
    });
  } catch (e) {
    return dbError(e);
  }
}

// Tambah soal baru (otomatis di urutan paling akhir).
export async function POST(req: Request) {
  if ((await getStaffRole()) !== "admin") return noAdmin();

  let body: { pertanyaan?: unknown; opsi?: unknown; kunci?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const input = {
    pertanyaan: String(body.pertanyaan ?? ""),
    opsi: Array.isArray(body.opsi) ? body.opsi.map((o) => String(o ?? "")) : [],
    kunci: Number(body.kunci),
  };
  const err = cekSoal(input);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  try {
    const pool = await getPool();
    const [mx] = await pool.query<RowDataPacket[]>("SELECT COALESCE(MAX(urutan), 0) AS m FROM soal_tes");
    const [res] = await pool.execute<ResultSetHeader>(
      "INSERT INTO soal_tes (urutan, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, kunci) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [Number(mx[0].m) + 1, input.pertanyaan.trim(), ...input.opsi.map((o) => o.trim()), input.kunci]
    );
    return NextResponse.json({ ok: true, id: res.insertId });
  } catch (e) {
    return dbError(e);
  }
}
