import mysql, { Pool } from "mysql2/promise";

const cfg = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
};
const DB_NAME = process.env.DB_NAME || "spmb_citra_negara";

const g = globalThis as unknown as { _spmbPool?: Promise<Pool> };

async function init(): Promise<Pool> {
  const boot = await mysql.createConnection(cfg);
  await boot.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await boot.end();

  const pool = mysql.createPool({
    ...cfg,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS akun_siswa (
      id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      nama          VARCHAR(100) NOT NULL,
      email         VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS biodata_siswa (
      id               INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      akun_id          INT UNSIGNED NOT NULL UNIQUE,
      nama_lengkap     VARCHAR(100) NOT NULL,
      jurusan          VARCHAR(100) NOT NULL,
      nik              CHAR(16) NOT NULL,
      nisn             CHAR(10) NOT NULL,
      ijazah_file      VARCHAR(255) NULL,
      ijazah_nama_asli VARCHAR(255) NULL,
      created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_biodata_akun FOREIGN KEY (akun_id) REFERENCES akun_siswa(id) ON DELETE CASCADE
    )`);
  return pool;
}

export function getPool(): Promise<Pool> {
  if (!g._spmbPool) {
    g._spmbPool = init().catch((e) => {
      g._spmbPool = undefined;
      throw e;
    });
  }
  return g._spmbPool;
}
