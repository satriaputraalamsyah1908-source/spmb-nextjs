import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { dbError, getPool } from "../../lib/server/db";
import { getSiswaId, getStaffRole } from "../../lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daftar pengumuman (terbaru di atas). Bisa dibaca calon siswa & admin yang sudah login.
export async function GET() {
  if (!(await getSiswaId()) && !(await getStaffRole())) {
    return NextResponse.json({ error: "Sesi habis. Silahkan masuk lagi." }, { status: 401 });
  }
  try {
    const pool = await getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, judul, isi, penulis, DATE_FORMAT(tanggal, '%Y-%m-%d') AS tanggal
         FROM pengumuman ORDER BY pengumuman.tanggal DESC, id DESC`
    );
    return NextResponse.json({ daftar: rows });
  } catch (e) {
    return dbError(e);
  }
}
