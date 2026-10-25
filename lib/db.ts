import mysql from "mysql2/promise";

// Default Laragon: user root, tanpa password, port 3306.
// Bisa diganti lewat file .env.local (lihat PETUNJUK.md).
const cfg = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
};
const DB_NAME = process.env.DB_NAME || "spmb_citra_negara";

const g = globalThis as unknown as { _spmbPool?: Promise<mysql.Pool> };

async function init(): Promise<mysql.Pool> {
  // 1. buat database kalau belum ada
  const conn = await mysql.createConnection(cfg);
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();

  const pool = mysql.createPool({
    ...cfg,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  });

  // 2. buat tabel kalau belum ada (tabel akun dan tabel biodata dipisah)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS akun_siswa (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      nama VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
      ijazah_file VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_biodata_akun (akun_id),
      CONSTRAINT fk_biodata_akun FOREIGN KEY (akun_id)
        REFERENCES akun_siswa (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  return pool;
}

export function getDb(): Promise<mysql.Pool> {
  if (!g._spmbPool) {
    g._spmbPool = init().catch((e) => {
      g._spmbPool = undefined;
      throw e;
    });
  }
  return g._spmbPool;
}
