import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { dbError, getPool } from "../../../lib/server/db";
import { getStaffRole } from "../../../lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NAMA_BULAN = ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"];
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Angka ringkasan untuk dashboard Kepala Sekolah (data asli dari database).
export async function GET() {
  const role = await getStaffRole();
  if (role !== "kepsek" && role !== "admin") {
    return NextResponse.json({ error: "Sesi habis. Silahkan masuk lagi." }, { status: 401 });
  }

  try {
    const pool = await getPool();
    const n = (v: unknown) => Number(v ?? 0);

    const [st] = await pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'terdaftar') AS terdaftar,
         SUM(status = 'terverifikasi') AS terverifikasi,
         SUM(status = 'lolos') AS lolos,
         SUM(dibuat_pada >= NOW() - INTERVAL 7 DAY) AS total_now,
         SUM(dibuat_pada < NOW() - INTERVAL 7 DAY AND dibuat_pada >= NOW() - INTERVAL 14 DAY) AS total_prev,
         SUM(status <> 'terdaftar' AND dibuat_pada >= NOW() - INTERVAL 7 DAY) AS ver_now,
         SUM(status <> 'terdaftar' AND dibuat_pada < NOW() - INTERVAL 7 DAY AND dibuat_pada >= NOW() - INTERVAL 14 DAY) AS ver_prev,
         SUM(status = 'terdaftar' AND dibuat_pada >= NOW() - INTERVAL 7 DAY) AS proses_now,
         SUM(status = 'terdaftar' AND dibuat_pada < NOW() - INTERVAL 7 DAY AND dibuat_pada >= NOW() - INTERVAL 14 DAY) AS proses_prev
       FROM biodata_siswa`
    );
    const [tl] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(dibuat_pada >= NOW() - INTERVAL 7 DAY) AS now_,
              SUM(dibuat_pada < NOW() - INTERVAL 7 DAY AND dibuat_pada >= NOW() - INTERVAL 14 DAY) AS prev_
         FROM pembayaran WHERE status = 'ditolak'`
    );
    const [hr] = await pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(dibuat_pada, '%Y-%m-%d') AS tgl, COUNT(*) AS jml
         FROM biodata_siswa
        WHERE dibuat_pada >= CURDATE() - INTERVAL 5 DAY
        GROUP BY tgl`
    );

    const perHari = new Map(hr.map((r) => [String(r.tgl), n(r.jml)]));
    const harian = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      harian.push({ label: `${d.getDate()} ${NAMA_BULAN[d.getMonth()]}`, value: perHari.get(ymd(d)) ?? 0 });
    }

    const s = st[0];
    const t = tl[0];
    return NextResponse.json({
      total: n(s.total),
      terdaftar: n(s.terdaftar),
      terverifikasi: n(s.terverifikasi),
      lolos: n(s.lolos),
      ditolak: n(t.total),
      periode: {
        total: { now: n(s.total_now), prev: n(s.total_prev) },
        terverifikasi: { now: n(s.ver_now), prev: n(s.ver_prev) },
        proses: { now: n(s.proses_now), prev: n(s.proses_prev) },
        ditolak: { now: n(t.now_), prev: n(t.prev_) },
      },
      harian,
    });
  } catch (e) {
    return dbError(e);
  }
}
