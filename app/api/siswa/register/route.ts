import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { cekEmail, cekNama, cekPassword } from "../../../lib/validasi";
import { dbError, getPool } from "../../../lib/server/db";
import { setSiswaCookie } from "../../../lib/server/session";

export const runtime = "nodejs";

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Data tidak valid.");
  }

  const nama = String(body.nama ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const konfirmasi = String(body.konfirmasi ?? "");

  const err = cekNama(nama) || cekEmail(email) || cekPassword(password);
  if (err) return bad(err);
  if (konfirmasi !== password) return bad("Konfirmasi password tidak sama.");

  try {
    const pool = await getPool();
    const passwordHash = await hash(password, 10);
    const [res] = await pool.execute<ResultSetHeader>(
      "INSERT INTO akun_siswa (nama, email, password_hash) VALUES (?, ?, ?)",
      [nama, email, passwordHash]
    );
    await setSiswaCookie(res.insertId);
    return NextResponse.json({ nama, email });
  } catch (e) {
    return dbError(e);
  }
}
