import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "../../../lib/db";

export const runtime = "nodejs";

// POST /api/login-siswa { email, password } -> cek ke tabel akun_siswa
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const db = await getDb();
    const [rows] = await db.query(
      "SELECT id, nama, email, password_hash FROM akun_siswa WHERE email = ?",
      [String(email || "").trim().toLowerCase()]
    );
    const u = (rows as { id: number; nama: string; email: string; password_hash: string }[])[0];
    if (!u || !(await bcrypt.compare(String(password || ""), u.password_hash))) {
      return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
    }
    return NextResponse.json({ ok: true, siswa: { id: u.id, nama: u.nama, email: u.email } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal terhubung ke database." }, { status: 500 });
  }
}
