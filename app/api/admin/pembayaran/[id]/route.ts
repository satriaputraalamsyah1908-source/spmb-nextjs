import { NextResponse } from "next/server";
import type { ResultSetHeader } from "mysql2";
import { dbError, getPool } from "../../../../lib/server/db";
import { getStaffRole } from "../../../../lib/server/session";

export const runtime = "nodejs";

const STATUS = ["menunggu", "terverifikasi", "ditolak"];

// Admin memverifikasi / menolak pembayaran. Setelah "terverifikasi", siswa bisa membuka soal seleksi.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if ((await getStaffRole()) !== "admin") {
    return NextResponse.json({ error: "Sesi admin habis. Silahkan masuk lagi." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const idNum = Number(id);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }
  const status = String(body.status ?? "");
  if (!STATUS.includes(status)) {
    return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  }

  try {
    const pool = await getPool();
    const [res] = await pool.execute<ResultSetHeader>("UPDATE pembayaran SET status = ? WHERE id = ?", [
      status,
      idNum,
    ]);
    if (res.affectedRows === 0) {
      return NextResponse.json({ error: "Pembayaran tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    return dbError(e);
  }
}
