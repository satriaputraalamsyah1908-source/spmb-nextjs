import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { cekPengumuman } from "../../../lib/pengumuman";
import { dbError, getPool } from "../../../lib/server/db";
import { getStaffRole } from "../../../lib/server/session";

export const runtime = "nodejs";

// Admin menambah pengumuman baru.
export async function POST(req: Request) {
  if ((await getStaffRole()) !== "admin") {
    return NextResponse.json({ error: "Sesi admin habis. Silahkan masuk lagi." }, { status: 401 });
  }
  let body: { judul?: unknown; isi?: unknown; tanggal?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const input = { judul: String(body.judul ?? ""), isi: String(body.isi ?? ""), tanggal: String(body.tanggal ?? "") };
  const err = cekPengumuman(input);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  try {
    const pool = await getPool();
    const [res] = await pool.execute<ResultSetHeader>(
      "INSERT INTO pengumuman (judul, isi, penulis, tanggal) VALUES (?, ?, 'Admin', ?)",
      [input.judul.trim(), input.isi.trim(), input.tanggal]
    );
    return NextResponse.json({ ok: true, id: res.insertId });
  } catch (e) {
    return dbError(e);
  }
}
