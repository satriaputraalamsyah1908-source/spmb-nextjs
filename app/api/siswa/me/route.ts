import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPool } from "../../../lib/db";
import { getSessionId } from "../../../lib/session";
import { fail, serverFail } from "../../../lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const id = await getSessionId();
    if (!id) return fail("Belum login.", 401);

    const pool = await getPool();
    const [akun] = await pool.query<RowDataPacket[]>(
      "SELECT id, nama, email FROM akun_siswa WHERE id = ?",
      [id]
    );
    if (!akun[0]) return fail("Akun tidak ditemukan.", 401);

    const [bio] = await pool.query<RowDataPacket[]>(
      "SELECT nama_lengkap, jurusan, nik, nisn, ijazah_file, ijazah_nama_asli FROM biodata_siswa WHERE akun_id = ?",
      [id]
    );
    return NextResponse.json({ akun: akun[0], biodata: bio[0] ?? null });
  } catch (e) {
    return serverFail(e);
  }
}
