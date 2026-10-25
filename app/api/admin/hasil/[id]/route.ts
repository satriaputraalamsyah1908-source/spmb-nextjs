import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { dbError, getPool } from "../../../../lib/server/db";
import { getStaffRole } from "../../../../lib/server/session";

export const runtime = "nodejs";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// Admin menetapkan hasil seleksi: lulus / tidak_lulus / menunggu (+ keterangan & tanggal).
// "lulus" otomatis membuat status pendaftar menjadi "lolos" (Diterima) di halaman lain.
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if ((await getStaffRole()) !== "admin") return bad("Sesi admin habis. Silahkan masuk lagi.", 401);

  const idNum = Number((await ctx.params).id);
  if (!Number.isInteger(idNum) || idNum <= 0) return bad("ID tidak valid.");

  let body: { hasil?: unknown; keterangan?: unknown; tanggal?: unknown };
  try {
    body = await req.json();
  } catch {
    return bad("Data tidak valid.");
  }

  const h = String(body.hasil ?? "");
  if (!["lulus", "tidak_lulus", "menunggu"].includes(h)) return bad("Status hasil tidak valid.");
  const hasil = h === "menunggu" ? null : h;

  const ket = String(body.keterangan ?? "").trim();
  if (ket.length > 255) return bad("Keterangan maksimal 255 karakter.");

  let tanggal: string | null = String(body.tanggal ?? "").trim() || null;
  if (tanggal) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || Number.isNaN(new Date(tanggal).getTime())) {
      return bad("Tanggal seleksi tidak valid.");
    }
  } else if (hasil) {
    const d = new Date();
    tanggal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>("SELECT status FROM biodata_siswa WHERE id = ?", [idNum]);
    if (!rows[0]) return bad("Pendaftar tidak ditemukan.", 404);

    // Sinkron dengan status pendaftar di halaman lain
    let status = String(rows[0].status);
    if (hasil === "lulus") status = "lolos";
    else if (status === "lolos") status = "terverifikasi";

    await pool.execute(
      "UPDATE biodata_siswa SET hasil = ?, keterangan = ?, tanggal_seleksi = ?, status = ? WHERE id = ?",
      [hasil, ket || null, hasil ? tanggal : null, status, idNum]
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
