import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getPool } from "../../../lib/db";
import { setSession } from "../../../lib/session";
import { fail, serverFail } from "../../../lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Data tidak valid.");

    const nama = String(body.nama ?? "").trim().replace(/\s+/g, " ");
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (nama.length < 3 || !/^[\p{L}\s]+$/u.test(nama))
      return fail("Nama minimal 3 huruf dan hanya boleh huruf.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Format email tidak valid.");
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
      return fail("Password minimal 8 karakter dan harus mengandung huruf dan angka.");

    const pool = await getPool();
    const [dup] = await pool.query<RowDataPacket[]>("SELECT id FROM akun_siswa WHERE email = ?", [email]);
    if (dup.length) return fail("Email sudah terdaftar.", 409);

    const hash = await bcrypt.hash(password, 10);
    try {
      const [r] = await pool.query<ResultSetHeader>(
        "INSERT INTO akun_siswa (nama, email, password_hash) VALUES (?, ?, ?)",
        [nama, email, hash]
      );
      await setSession(r.insertId);
    } catch (e) {
      if ((e as { code?: string })?.code === "ER_DUP_ENTRY") return fail("Email sudah terdaftar.", 409);
      throw e;
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return serverFail(e);
  }
}
