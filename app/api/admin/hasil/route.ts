import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { dbError, getPool } from "../../../lib/server/db";
import { getStaffRole } from "../../../lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Data hasil seleksi semua pendaftar + ringkasan (halaman admin "Hasil Seleksi").
export async function GET() {
  if ((await getStaffRole()) !== "admin") {
    return NextResponse.json({ error: "Sesi admin habis. Silahkan masuk lagi." }, { status: 401 });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT b.id, b.nama_lengkap AS nama, a.email, b.nik, b.nisn, b.jurusan, b.status, b.nilai,
              b.hasil, b.keterangan, DATE_FORMAT(b.tanggal_seleksi, '%Y-%m-%d') AS tanggal_seleksi,
              b.dibuat_pada, u.selesai_ms, u.benar, u.total
         FROM biodata_siswa b
         JOIN akun_siswa a ON a.id = b.akun_id
         LEFT JOIN ujian_siswa u ON u.akun_id = b.akun_id
        ORDER BY b.nilai IS NULL, b.nilai DESC, b.id`
    );
    const daftar = rows.map((r) => ({
      ...r,
      selesai_ms: r.selesai_ms === null ? null : Number(r.selesai_ms),
    }));
    const hitung = (h: string | null) => daftar.filter((r) => r.hasil === h).length;
    return NextResponse.json({
      ringkasan: {
        total: daftar.length,
        lulus: hitung("lulus"),
        tidakLulus: hitung("tidak_lulus"),
        menunggu: hitung(null),
      },
      daftar,
    });
  } catch (e) {
    return dbError(e);
  }
}
