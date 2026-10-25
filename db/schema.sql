-- Opsional: tabel dibuat otomatis oleh aplikasi saat pertama dipakai.
-- File ini hanya untuk referensi / dijalankan manual lewat HeidiSQL.
CREATE DATABASE IF NOT EXISTS spmb_citra_negara CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE spmb_citra_negara;

CREATE TABLE IF NOT EXISTS akun_siswa (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nama          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
);
