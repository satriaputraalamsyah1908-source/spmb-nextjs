-- Struktur database SPMB (referensi).
-- Tidak perlu dijalankan manual: aplikasi membuat database & tabel ini otomatis
-- saat pertama kali ada yang daftar/login. File ini hanya untuk dokumentasi.

CREATE DATABASE IF NOT EXISTS `spmb` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `spmb`;

-- Akun calon siswa (email + password yang dibuat di halaman Daftar)
CREATE TABLE IF NOT EXISTS akun_siswa (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,          -- password disimpan ter-hash (bcrypt), bukan teks asli
  dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_akun_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data diri calon siswa (halaman Data Diri)
CREATE TABLE IF NOT EXISTS biodata_siswa (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  akun_id INT UNSIGNED NOT NULL,
  nama_lengkap VARCHAR(100) NOT NULL,
  jurusan VARCHAR(100) NOT NULL,
  nik CHAR(16) NOT NULL,
  nisn CHAR(10) NOT NULL,
  ijazah_file VARCHAR(255) NOT NULL,            -- nama file di folder uploads/ijazah
  ijazah_nama_asli VARCHAR(255) NOT NULL,
  status ENUM('terdaftar','terverifikasi','lolos') NOT NULL DEFAULT 'terdaftar', -- diatur admin
  dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  diubah_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bio_akun (akun_id),
  UNIQUE KEY uq_bio_nik (nik),
  UNIQUE KEY uq_bio_nisn (nisn),
  CONSTRAINT fk_bio_akun FOREIGN KEY (akun_id) REFERENCES akun_siswa (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
