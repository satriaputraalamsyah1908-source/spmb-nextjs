import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { dbError, getPool } from "../../../lib/server/db";
import { getStaffRole } from "../../../lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daftar semua pembayaran yang masuk + ringkasan, untuk halaman Verifikasi > Pembayaran.
export async function GET() {
  if ((await getStaffRole()) !== "admin") {
    return NextResponse.json({ error: "Sesi admin habis. Silahkan masuk lagi." }, { status: 401 });
  }

  try {
    const pool = await getPool();
    const [daftar] = await pool.query<RowDataPacket[]>(
      `SELECT p.id, p.akun_id, b.id AS biodata_id, a.nama AS akun_nama,
              COALESCE(b.nama_lengkap, a.nama) AS nama, b.nisn, b.nik, b.jurusan, a.email,
              p.metode, p.tipe, p.nominal, p.nama_pengirim, p.no_pengirim, p.no_referensi,
              DATE_FORMAT(p.tanggal_bayar, '%Y-%m-%d') AS tanggal_bayar,
              p.dibuat_pada, p.bukti_nama_asli, p.status
         FROM pembayaran p
         JOIN akun_siswa a ON a.id = p.akun_id
         LEFT JOIN biodata_siswa b ON b.akun_id = p.akun_id
        ORDER BY FIELD(p.status, 'menunggu', 'ditolak', 'terverifikasi'), p.dibuat_pada DESC, p.id DESC`
    );
    const hitung = (s: string) => daftar.filter((r) => r.status === s).length;
    return NextResponse.json({
      ringkasan: {
        total: daftar.length,
        menunggu: hitung("menunggu"),
        terverifikasi: hitung("terverifikasi"),
        ditolak: hitung("ditolak"),
      },
      daftar,
    });
  } catch (e) {
    return dbError(e);
  }
}
