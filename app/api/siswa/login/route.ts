import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { cekEmail } from "../../../lib/validasi";
import { dbError, getPool } from "../../../lib/server/db";
import { setSiswaCookie } from "../../../lib/server/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
  }
  const e = cekEmail(email);
  if (e) return NextResponse.json({ error: e }, { status: 400 });

  try {
    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, nama, email, password_hash FROM akun_siswa WHERE email = ?",
      [email]
    );
    const akun = rows[0];
    const ok = akun ? await compare(password, akun.password_hash as string) : false;
    if (!akun || !ok) {
      return NextResponse.json(
        { error: "Email atau password salah, atau akun belum terdaftar." },
        { status: 401 }
      );
    }
    await setSiswaCookie(akun.id as number);
    return NextResponse.json({ nama: akun.nama, email: akun.email });
  } catch (err) {
    return dbError(err);
  }
}
