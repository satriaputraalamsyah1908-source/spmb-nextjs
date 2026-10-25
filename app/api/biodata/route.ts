import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { cekIjazah, cekJurusan, cekNama, cekNik, cekNisn } from "../../lib/validasi";
import { dbError, getPool } from "../../lib/server/db";
import { getSiswaId } from "../../lib/server/session";

export const runtime = "nodejs";

// File ijazah disimpan di folder "uploads/ijazah" (di luar folder public, jadi tidak bisa dibuka lewat URL).
const DIR = path.join(process.cwd(), "uploads", "ijazah");

const bad = (error: string) => NextResponse.json({ error }, { status: 400 });
const noSession = () =>
  NextResponse.json({ error: "Sesi habis. Silahkan masuk lagi." }, { status: 401 });

/* ---------- Ambil data (untuk mengisi form) ---------- */
export async function GET() {
  const akunId = await getSiswaId();
  if (!akunId) return noSession();

  try {
    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT a.nama AS akun_nama, a.email,
              b.nama_lengkap, b.jurusan, b.nik, b.nisn, b.ijazah_nama_asli, b.status
         FROM akun_siswa a
         LEFT JOIN biodata_siswa b ON b.akun_id = a.id
        WHERE a.id = ?`,
      [akunId]
    );
    const r = rows[0];
    if (!r) return noSession();

    return NextResponse.json({
      akun: { nama: r.akun_nama, email: r.email },
      biodata: r.nama_lengkap
        ? {
            nama: r.nama_lengkap,
            jurusan: r.jurusan,
            nik: r.nik,
            nisn: r.nisn,
            ijazah_nama_asli: r.ijazah_nama_asli,
            status: r.status,
          }
        : null,
    });
  } catch (e) {
    return dbError(e);
  }
}

/* ---------- Simpan data ---------- */
export async function POST(req: Request) {
  const akunId = await getSiswaId();
  if (!akunId) return noSession();

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

  let newPath: string | null = null;
  try {
    const pool = await getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT nama_lengkap, jurusan, nik, nisn, ijazah_file, ijazah_nama_asli, status
         FROM biodata_siswa WHERE akun_id = ?`,
      [akunId]
    );
    const old = rows[0];

    if (!file && !old) return bad("Ijazah/Surat Keterangan Lulus wajib diunggah.");

    let fileName: string = old?.ijazah_file ?? "";
    let namaAsli: string = old?.ijazah_nama_asli ?? "";

    if (file) {
      const e = cekIjazah(file.name, file.size);
      if (e) return bad(e);
      const ext = file.name.split(".").pop()!.toLowerCase();
      await mkdir(DIR, { recursive: true });
      fileName = `${akunId}-${Date.now()}.${ext}`;
      newPath = path.join(DIR, fileName);
      await writeFile(newPath, Buffer.from(await file.arrayBuffer()));
      namaAsli = file.name.slice(-200);
    }

    if (old) {
      // Kalau data diubah, status kembali ke "terdaftar" supaya admin memeriksa ulang.
      const berubah =
        !!file ||
        old.nama_lengkap !== nama ||
        old.jurusan !== jurusan ||
        old.nik !== nik ||
        old.nisn !== nisn;
      const statusBaru = berubah ? "terdaftar" : (old.status as string);

      await pool.execute(
        `UPDATE biodata_siswa
            SET nama_lengkap = ?, jurusan = ?, nik = ?, nisn = ?,
                ijazah_file = ?, ijazah_nama_asli = ?, status = ?
          WHERE akun_id = ?`,
        [nama, jurusan, nik, nisn, fileName, namaAsli, statusBaru, akunId]
      );
    } else {
      await pool.execute(
        `INSERT INTO biodata_siswa
           (akun_id, nama_lengkap, jurusan, nik, nisn, ijazah_file, ijazah_nama_asli)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [akunId, nama, jurusan, nik, nisn, fileName, namaAsli]
      );
    }

    // File lama dihapus kalau diganti dengan yang baru
    if (file && old?.ijazah_file) {
      await unlink(path.join(DIR, old.ijazah_file as string)).catch(() => {});
    }

    return NextResponse.json({ ok: true, ijazah_nama_asli: namaAsli });
  } catch (e) {
    // Gagal simpan ke database -> jangan tinggalkan file yatim
    if (newPath) await unlink(newPath).catch(() => {});
    return dbError(e);
  }
}
