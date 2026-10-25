import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { cekIjazah, cekJurusan, cekNama, cekNik, cekNisn } from "../../../../lib/validasi";
import { dbError, getPool } from "../../../../lib/server/db";
import { getStaffRole } from "../../../../lib/server/session";

export const runtime = "nodejs";

const STATUS = ["terdaftar", "terverifikasi", "lolos"];

// Admin mengubah status pendaftar: terdaftar -> terverifikasi -> lolos.
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
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
  const sets: string[] = [];
  const vals: (string | number | null)[] = [];

  if (body.status !== undefined) {
    const status = String(body.status);
    if (!STATUS.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
    }
    sets.push("status = ?");
    vals.push(status);
  }
  if (body.nilai !== undefined) {
    if (body.nilai === null || body.nilai === "") {
      sets.push("nilai = NULL");
    } else {
      const n = Number(body.nilai);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        return NextResponse.json({ error: "Nilai harus berupa angka 0 - 100." }, { status: 400 });
      }
      sets.push("nilai = ?");
      vals.push(Math.round(n * 10) / 10);
    }
  }
  if (sets.length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diubah." }, { status: 400 });
  }

  try {
    const pool = await getPool();
    const [res] = await pool.execute<ResultSetHeader>(
      `UPDATE biodata_siswa SET ${sets.join(", ")} WHERE id = ?`,
      [...vals, idNum]
    );
    if (res.affectedRows === 0) {
      return NextResponse.json({ error: "Pendaftar tidak ditemukan." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}

/* ---------- Admin mengubah data pendaftar (status TIDAK berubah) ---------- */
const DIR = path.join(process.cwd(), "uploads", "ijazah");
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
const noAdmin = () => bad("Sesi admin habis. Silahkan masuk lagi.", 401);

async function idDari(ctx: { params: Promise<{ id: string }> }) {
  const n = Number((await ctx.params).id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if ((await getStaffRole()) !== "admin") return noAdmin();
  const idNum = await idDari(ctx);
  if (!idNum) return bad("ID tidak valid.");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Data tidak valid.");
  }
  const nama = String(form.get("nama") ?? "").trim();
  const jurusan = String(form.get("jurusan") ?? "");
  const nik = String(form.get("nik") ?? "").trim();
  const nisn = String(form.get("nisn") ?? "").trim();
  const err = cekNama(nama) || cekJurusan(jurusan) || cekNik(nik) || cekNisn(nisn);
  if (err) return bad(err);

  const raw = form.get("ijazah");
  const file = raw instanceof File && raw.size > 0 ? raw : null;
  if (file) {
    const e = cekIjazah(file.name, file.size);
    if (e) return bad(e);
  }

  let newPath: string | null = null;
  try {
    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT akun_id, ijazah_file FROM biodata_siswa WHERE id = ?",
      [idNum]
    );
    const old = rows[0];
    if (!old) return bad("Pendaftar tidak ditemukan.", 404);

    if (file) {
      const ext = file.name.split(".").pop()!.toLowerCase();
      await mkdir(DIR, { recursive: true });
      const fileName = `${old.akun_id}-${Date.now()}.${ext}`;
      newPath = path.join(DIR, fileName);
      await writeFile(newPath, Buffer.from(await file.arrayBuffer()));
      await pool.execute(
        `UPDATE biodata_siswa
            SET nama_lengkap = ?, jurusan = ?, nik = ?, nisn = ?, ijazah_file = ?, ijazah_nama_asli = ?
          WHERE id = ?`,
        [nama, jurusan, nik, nisn, fileName, file.name.slice(-200), idNum]
      );
      await unlink(path.join(DIR, path.basename(String(old.ijazah_file)))).catch(() => {});
    } else {
      await pool.execute(
        "UPDATE biodata_siswa SET nama_lengkap = ?, jurusan = ?, nik = ?, nisn = ? WHERE id = ?",
        [nama, jurusan, nik, nisn, idNum]
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (newPath) await unlink(newPath).catch(() => {});
    return dbError(e);
  }
}

/* ---------- Admin menghapus data pendaftar (akun siswa tetap ada, bisa isi Data Diri lagi) ---------- */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if ((await getStaffRole()) !== "admin") return noAdmin();
  const idNum = await idDari(ctx);
  if (!idNum) return bad("ID tidak valid.");

  try {
    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>("SELECT ijazah_file FROM biodata_siswa WHERE id = ?", [idNum]);
    if (!rows[0]) return bad("Pendaftar tidak ditemukan.", 404);
    await pool.execute("DELETE FROM biodata_siswa WHERE id = ?", [idNum]);
    await unlink(path.join(DIR, path.basename(String(rows[0].ijazah_file)))).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    return dbError(e);
  }
}
