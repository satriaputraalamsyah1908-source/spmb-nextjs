import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "../../../lib/db";

export const runtime = "nodejs";

// POST /api/daftar  { nama, email, password }
// Menyimpan akun calon siswa ke tabel akun_siswa (password di-hash).
export async function POST(req: Request) {
  try {
    const { nama, email, password } = await req.json();
    if (!nama || !email || !password) {
      return NextResponse.json({ error: "Data belum lengkap." }, { status: 400 });
    }
    const emailBersih = String(email).trim().toLowerCase();
    const db = await getDb();

    const [ada] = await db.query("SELECT id FROM akun_siswa WHERE email = ?", [emailBersih]);
    if ((ada as unknown[]).length > 0) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    }

    const hash = await bcrypt.hash(String(password), 10);
    const [res] = await db.query(
      "INSERT INTO akun_siswa (nama, email, password_hash) VALUES (?, ?, ?)",
      [String(nama).trim(), emailBersih, hash]
    );
    const id = (res as { insertId: number }).insertId;
    return NextResponse.json({ ok: true, siswa: { id, nama: String(nama).trim(), email: emailBersih } });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Gagal terhubung ke database. Pastikan MySQL Laragon sudah Start." },
      { status: 500 }
    );
  }
}
