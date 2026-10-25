import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { cekSoal } from "../../../../lib/soalTes";
import { dbError, getPool } from "../../../../lib/server/db";
import { getStaffRole } from "../../../../lib/server/session";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

async function cek(ctx: Ctx) {
  if ((await getStaffRole()) !== "admin") {
    return { error: NextResponse.json({ error: "Sesi admin habis. Silahkan masuk lagi." }, { status: 401 }) };
  }
  const idNum = Number((await ctx.params).id);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return { error: NextResponse.json({ error: "ID tidak valid." }, { status: 400 }) };
  }
  return { id: idNum };
}

// Ubah soal
export async function PUT(req: Request, ctx: Ctx) {
  const c = await cek(ctx);
  if (c.error) return c.error;

  let body: { pertanyaan?: unknown; opsi?: unknown; kunci?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const input = {
    pertanyaan: String(body.pertanyaan ?? ""),
    opsi: Array.isArray(body.opsi) ? body.opsi.map((o) => String(o ?? "")) : [],
    kunci: Number(body.kunci),
  };
  const err = cekSoal(input);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  try {
    const pool = await getPool();
    const [res] = await pool.execute<ResultSetHeader>(
      "UPDATE soal_tes SET pertanyaan = ?, opsi_a = ?, opsi_b = ?, opsi_c = ?, opsi_d = ?, kunci = ? WHERE id = ?",
      [input.pertanyaan.trim(), ...input.opsi.map((o) => o.trim()), input.kunci, c.id]
    );
    if (res.affectedRows === 0) return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}

// Hapus soal
export async function DELETE(_req: Request, ctx: Ctx) {
  const c = await cek(ctx);
  if (c.error) return c.error;
  try {
    const pool = await getPool();
    const [res] = await pool.execute<ResultSetHeader>("DELETE FROM soal_tes WHERE id = ?", [c.id]);
    if (res.affectedRows === 0) return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
