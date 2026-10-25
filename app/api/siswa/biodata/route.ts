import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { RowDataPacket } from "mysql2";
import { getPool } from "../../../lib/db";
import { getSessionId } from "../../../lib/session";
import { fail, serverFail } from "../../../lib/http";
import { JURUSAN, NIK_LEN, NISN_LEN, MAX_IJAZAH_MB } from "../../../lib/jurusan";

export const runtime = "nodejs";

const ALLOWED_EXT = ["pdf", "jpg", "jpeg", "png"];
const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];
const DIR = path.join(process.cwd(), "storage", "ijazah");

export async function POST(req: Request) {
  try {
    const akunId = await getSessionId();
    if (!akunId) return fail("Belum login.", 401);

    const form = await req.formData();
    const nama = String(form.get("namaLengkap") ?? "").trim().replace(/\s+/g, " ");
    const jurusan = String(form.get("jurusan") ?? "");
    const nik = String(form.get("nik") ?? "").trim();
    const nisn = String(form.get("nisn") ?? "").trim();
    const file = form.get("ijazah");

    if (nama.length < 3) return fail("Nama lengkap minimal 3 karakter.");
    if (!(JURUSAN as readonly string[]).includes(jurusan)) return fail("Pilih jurusan terlebih dahulu.");
    if (!new RegExp(`^\\d{${NIK_LEN}}$`).test(nik)) return fail(`NIK harus ${NIK_LEN} digit angka.`);
    if (!new RegExp(`^\\d{${NISN_LEN}}$`).test(nisn)) return fail(`NISN harus ${NISN_LEN} digit angka.`);

    const pool = await getPool();
    const [old] = await pool.query<RowDataPacket[]>(
      "SELECT ijazah_file FROM biodata_siswa WHERE akun_id = ?",
      [akunId]
    );
    const oldFile: string | null = old[0]?.ijazah_file ?? null;

    let newFile: string | null = null;
    let newOriginal: string | null = null;
    if (file instanceof File && file.size > 0) {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      if (!ALLOWED_EXT.includes(ext) || !ALLOWED_MIME.includes(file.type))
        return fail("Ijazah harus berformat PDF, JPG, atau PNG.");
      if (file.size > MAX_IJAZAH_MB * 1024 * 1024) return fail(`Ukuran ijazah maksimal ${MAX_IJAZAH_MB} MB.`);
      await fs.mkdir(DIR, { recursive: true });
      newFile = `${akunId}-${Date.now()}.${ext}`;
      newOriginal = file.name.slice(0, 250);
      await fs.writeFile(path.join(DIR, newFile), Buffer.from(await file.arrayBuffer()));
    } else if (!oldFile) {
      return fail("Ijazah / Surat Keterangan Lulus wajib diunggah.");
    }

    await pool.query(
      `INSERT INTO biodata_siswa (akun_id, nama_lengkap, jurusan, nik, nisn, ijazah_file, ijazah_nama_asli)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         nama_lengkap = VALUES(nama_lengkap),
         jurusan = VALUES(jurusan),
         nik = VALUES(nik),
         nisn = VALUES(nisn),
         ijazah_file = COALESCE(VALUES(ijazah_file), ijazah_file),
         ijazah_nama_asli = COALESCE(VALUES(ijazah_nama_asli), ijazah_nama_asli)`,
      [akunId, nama, jurusan, nik, nisn, newFile, newOriginal]
    );

    if (newFile && oldFile) await fs.unlink(path.join(DIR, oldFile)).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverFail(e);
  }
}
