import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { cekPengumuman } from "../../../../lib/pengumuman";
import { dbError, getPool } from "../../../../lib/server/db";
import { getStaffRole } from "../../../../lib/server/session";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

async function cek(ctx: Ctx) {
  if ((await getStaffRole()) !== "admin") {
    return { error: NextResponse.json({ error: "Sesi admin habis. Silahkan masuk lagi." }, { status: 401 }) };
  }
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return { error: NextResponse.json({ error: "ID tidak valid." }, { status: 400 }) };
  }
  return { id };
}

export async function PUT(req: Request, ctx: Ctx) {
  const c = await cek(ctx);
  if (c.error) return c.error;

  let body: { judul?: unknown; isi?: unknown; tanggal?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const input = { judul: String(body.judul ?? ""), isi: String(body.isi ?? ""), tanggal: String(body.tanggal ?? "") };
  const err = cekPengumuman(input);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  try {
    const pool = await getPool();
    const [res] = await pool.execute<ResultSetHeader>(
      "UPDATE pengumuman SET judul = ?, isi = ?, tanggal = ? WHERE id = ?",
      [input.judul.trim(), input.isi.trim(), input.tanggal, c.id]
    );
    if (res.affectedRows === 0) return NextResponse.json({ error: "Pengumuman tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const c = await cek(ctx);
  if (c.error) return c.error;
  try {
    const pool = await getPool();
    const [res] = await pool.execute<ResultSetHeader>("DELETE FROM pengumuman WHERE id = ?", [c.id]);
    if (res.affectedRows === 0) return NextResponse.json({ error: "Pengumuman tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
