import type { RowDataPacket } from "mysql2";
import mysql, { type Pool } from "mysql2/promise";
import { NextResponse } from "next/server";
import { SEED_SOAL } from "./soal";

// Pengaturan default = bawaan Laragon (user root, tanpa password).
// Kalau MySQL-mu pakai password, buat file .env.local lalu isi DB_PASSWORD=...
const DB_NAME = process.env.DB_NAME || "spmb";
const base = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
};

async function init(): Promise<Pool> {
  // 1. Buat database kalau belum ada
  const conn = await mysql.createConnection(base);
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();

  // 2. Buat koneksi pool ke database tsb
  const pool = mysql.createPool({
    ...base,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  });

  // 3. Buat tabel kalau belum ada
  await pool.query(`
    CREATE TABLE IF NOT EXISTS akun_siswa (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      nama VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_akun_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS biodata_siswa (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      akun_id INT UNSIGNED NOT NULL,
      nama_lengkap VARCHAR(100) NOT NULL,
      jurusan VARCHAR(100) NOT NULL,
      nik CHAR(16) NOT NULL,
      nisn CHAR(10) NOT NULL,
      ijazah_file VARCHAR(255) NOT NULL,
      ijazah_nama_asli VARCHAR(255) NOT NULL,
      status ENUM('terdaftar','terverifikasi','lolos') NOT NULL DEFAULT 'terdaftar',
      nilai DECIMAL(5,1) NULL DEFAULT NULL,
      dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      diubah_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_bio_akun (akun_id),
      UNIQUE KEY uq_bio_nik (nik),
      UNIQUE KEY uq_bio_nisn (nisn),
      CONSTRAINT fk_bio_akun FOREIGN KEY (akun_id) REFERENCES akun_siswa (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pembayaran (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      akun_id INT UNSIGNED NOT NULL,
      metode VARCHAR(20) NOT NULL,
      tipe ENUM('bank','ewallet') NOT NULL,
      nominal INT UNSIGNED NOT NULL,
      nama_pengirim VARCHAR(100) NOT NULL,
      no_pengirim VARCHAR(30) NOT NULL,
      no_referensi VARCHAR(50) NULL,
      tanggal_bayar DATE NOT NULL,
      bukti_file VARCHAR(255) NOT NULL,
      bukti_nama_asli VARCHAR(255) NOT NULL,
      status ENUM('menunggu','terverifikasi','ditolak') NOT NULL DEFAULT 'menunggu',
      dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_bayar_akun (akun_id),
      CONSTRAINT fk_bayar_akun FOREIGN KEY (akun_id) REFERENCES akun_siswa (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ujian_siswa (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      akun_id INT UNSIGNED NOT NULL,
      mulai_ms BIGINT NOT NULL,
      selesai_ms BIGINT NULL,
      jawaban TEXT NULL,
      benar INT NULL,
      nilai DECIMAL(5,1) NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_ujian_akun (akun_id),
      CONSTRAINT fk_ujian_akun FOREIGN KEY (akun_id) REFERENCES akun_siswa (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS soal_tes (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      urutan INT NOT NULL DEFAULT 0,
      pertanyaan TEXT NOT NULL,
      opsi_a VARCHAR(255) NOT NULL,
      opsi_b VARCHAR(255) NOT NULL,
      opsi_c VARCHAR(255) NOT NULL,
      opsi_d VARCHAR(255) NOT NULL,
      kunci TINYINT UNSIGNED NOT NULL,
      dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pengumuman (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      judul VARCHAR(150) NOT NULL,
      isi TEXT NOT NULL,
      penulis VARCHAR(60) NOT NULL DEFAULT 'Admin',
      tanggal DATE NOT NULL,
      dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  // Soal awal dimasukkan sekali saja kalau tabelnya masih kosong
  const [jmlSoal] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM soal_tes");
  if (Number(jmlSoal[0].n) === 0) {
    for (let i = 0; i < SEED_SOAL.length; i++) {
      const q = SEED_SOAL[i];
      await pool.execute(
        "INSERT INTO soal_tes (urutan, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, kunci) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [i + 1, q.teks, q.opsi[0], q.opsi[1], q.opsi[2], q.opsi[3], q.kunci]
      );
    }
  }
  const [kolTotal] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM ujian_siswa LIKE 'total'");
  if (kolTotal.length === 0) {
    await pool.query("ALTER TABLE ujian_siswa ADD COLUMN total INT NULL");
  }

  // Tabel dari versi sebelumnya bisa kekurangan kolom -> tambahkan otomatis
  const tambah: [string, string][] = [
    ["status", "ENUM('terdaftar','terverifikasi','lolos') NOT NULL DEFAULT 'terdaftar'"],
    ["nilai", "DECIMAL(5,1) NULL DEFAULT NULL"],
    ["hasil", "ENUM('lulus','tidak_lulus') NULL DEFAULT NULL"],
    ["keterangan", "VARCHAR(255) NULL DEFAULT NULL"],
    ["tanggal_seleksi", "DATE NULL DEFAULT NULL"],
    ["dibuat_pada", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    ["diubah_pada", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],
  ];
  for (const [nama, definisi] of tambah) {
    const [kolom] = await pool.query<RowDataPacket[]>(
      "SHOW COLUMNS FROM biodata_siswa LIKE ?",
      [nama]
    );
    if (kolom.length === 0) {
      await pool.query(`ALTER TABLE biodata_siswa ADD COLUMN ${nama} ${definisi}`);
    }
  }

  // Tabel pembayaran versi sebelumnya (status 'lunas' otomatis) -> ubah ke alur verifikasi admin
  const [stKol] = await pool.query<RowDataPacket[]>("SHOW COLUMNS FROM pembayaran LIKE 'status'");
  if (!String(stKol[0]?.Type ?? "").includes("menunggu")) {
    await pool.query(
      "ALTER TABLE pembayaran MODIFY status ENUM('menunggu','terverifikasi','ditolak','lunas') NOT NULL DEFAULT 'menunggu'"
    );
    await pool.query("UPDATE pembayaran SET status = 'terverifikasi' WHERE status = 'lunas'");
    await pool.query(
      "ALTER TABLE pembayaran MODIFY status ENUM('menunggu','terverifikasi','ditolak') NOT NULL DEFAULT 'menunggu'"
    );
  }

  return pool;
}

// Disimpan di globalThis supaya tidak bikin koneksi baru tiap file di-reload (mode dev).
const g = globalThis as unknown as { __spmbPool9?: Promise<Pool> };

export function getPool(): Promise<Pool> {
  if (!g.__spmbPool9) {
    g.__spmbPool9 = init().catch((e) => {
      g.__spmbPool9 = undefined; // supaya dicoba lagi di request berikutnya
      throw e;
    });
  }
  return g.__spmbPool9;
}

// Ubah error database jadi pesan yang gampang dipahami.
export function dbError(e: unknown) {
  const err = e as { code?: string; sqlMessage?: string; message?: string };
  console.error("[DB]", err?.code, err?.sqlMessage || err?.message);

  if (err?.code === "ER_DUP_ENTRY") {
    const m = err.sqlMessage ?? "";
    if (m.includes("uq_akun_email"))
      return NextResponse.json({ error: "Email sudah terdaftar. Silahkan masuk." }, { status: 409 });
    return NextResponse.json({ error: "NIK atau NISN sudah dipakai pendaftar lain." }, { status: 409 });
  }
  if (err?.code === "ECONNREFUSED" || err?.code === "ER_ACCESS_DENIED_ERROR" || err?.code === "ENOTFOUND") {
    return NextResponse.json(
      {
        error:
          "Tidak bisa terhubung ke database. Pastikan MySQL di Laragon sudah Start (dan password-nya sesuai).",
      },
      { status: 500 }
    );
  }
  // Saat development, tampilkan penyebab aslinya supaya mudah dicari.
  const detail =
    process.env.NODE_ENV !== "production"
      ? ` (${err?.code ?? "?"}: ${err?.sqlMessage || err?.message || ""})`
      : "";
  return NextResponse.json({ error: `Terjadi kesalahan di server.${detail}` }, { status: 500 });
}
