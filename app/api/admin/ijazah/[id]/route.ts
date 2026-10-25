import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { dbError, getPool } from "../../../../lib/server/db";
import { getStaffRole } from "../../../../lib/server/session";

export const runtime = "nodejs";

const DIR = path.join(process.cwd(), "uploads", "ijazah");
const TIPE: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

// Admin membuka file ijazah milik pendaftar (hanya admin yang sudah login).
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if ((await getStaffRole()) !== "admin") {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT ijazah_file, ijazah_nama_asli FROM biodata_siswa WHERE id = ?",
      [idNum]
    );
    const r = rows[0];
    if (!r) return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 });

    const nama = path.basename(String(r.ijazah_file)); // cegah path traversal
    const ext = nama.split(".").pop()?.toLowerCase() ?? "";
    const data = await readFile(path.join(DIR, nama)).catch(() => null);
    if (!data) return NextResponse.json({ error: "File ijazah tidak ditemukan." }, { status: 404 });

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": TIPE[ext] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(String(r.ijazah_nama_asli))}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return dbError(e);
  }
}
