// Aturan validasi yang dipakai di browser DAN di server (satu sumber, supaya sama).

export const JURUSAN = [
  "Pengembangan Perangkat Lunak dan Gim",
  "Desain Komunikasi dan Visual",
  "Manajemen Perkantoran dan Layanan Bisnis",
  "Teknik Komputer dan Jaringan Telekomunikasi",
  "Perhotelan",
] as const;

export const IJAZAH_MAX = 5 * 1024 * 1024; // 5 MB
export const IJAZAH_EXT = ["pdf", "jpg", "jpeg", "png"];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function cekNama(v: string): string | null {
  const n = v.trim();
  if (!n) return "Nama lengkap wajib diisi.";
  if (n.length < 3) return "Nama minimal 3 karakter.";
  if (!/^[\p{L}\s.'-]+$/u.test(n)) return "Nama hanya boleh berisi huruf.";
  return null;
}

export function cekEmail(v: string): string | null {
  if (!v.trim()) return "Email wajib diisi.";
  if (!EMAIL_RE.test(v.trim())) return "Format email tidak valid.";
  return null;
}

export function cekPassword(v: string): string | null {
  if (!v) return "Password wajib diisi.";
  if (v.length < 8) return "Password minimal 8 karakter.";
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return "Password harus mengandung huruf dan angka.";
  return null;
}

export function cekJurusan(v: string): string | null {
  if (!v) return "Jurusan wajib dipilih.";
  if (!(JURUSAN as readonly string[]).includes(v)) return "Jurusan tidak valid.";
  return null;
}

export function cekNik(v: string): string | null {
  if (!v) return "NIK wajib diisi.";
  if (!/^\d{16}$/.test(v)) return "NIK harus 16 digit angka.";
  return null;
}

export function cekNisn(v: string): string | null {
  if (!v) return "NISN wajib diisi.";
  if (!/^\d{10}$/.test(v)) return "NISN harus 10 digit angka.";
  return null;
}

export function cekIjazah(name: string, size: number): string | null {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  if (!IJAZAH_EXT.includes(ext)) return "File ijazah harus PDF, JPG, atau PNG.";
  if (size > IJAZAH_MAX) return "Ukuran file ijazah maksimal 5 MB.";
  return null;
}
