import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { dbError, getPool } from "../../../lib/server/db";
import { getStaffRole } from "../../../lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daftar semua pendaftar + ringkasan angka untuk dashboard admin.
export async function GET() {
  if ((await getStaffRole()) !== "admin") {
    return NextResponse.json({ error: "Sesi admin habis. Silahkan masuk lagi." }, { status: 401 });
  }

  try {
    const pool = await getPool();
    const [daftar] = await pool.query<RowDataPacket[]>(
      `SELECT b.id, b.nama_lengkap AS nama, a.email, b.nik, b.nisn, b.jurusan,
              b.status, b.nilai, b.ijazah_nama_asli, b.dibuat_pada
         FROM biodata_siswa b
         JOIN akun_siswa a ON a.id = b.akun_id
        ORDER BY b.dibuat_pada DESC, b.id DESC`
    );
    const [akun] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS jumlah FROM akun_siswa");

    const hitung = (s: string) => daftar.filter((r) => r.status === s).length;
    return NextResponse.json({
      ringkasan: {
        total: daftar.length,
        terdaftar: hitung("terdaftar"),
        terverifikasi: hitung("terverifikasi"),
        lolos: hitung("lolos"),
        akunBelumLengkap: Number(akun[0].jumlah) - daftar.length,
      },
      daftar,
    });
  } catch (e) {
    return dbError(e);
  }
}
