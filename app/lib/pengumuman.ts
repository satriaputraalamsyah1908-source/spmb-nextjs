// Aturan pengumuman (dipakai di browser DAN server).
export type PengumumanInput = { judul: string; isi: string; tanggal: string };

export function cekPengumuman(v: PengumumanInput): string | null {
  const judul = v.judul.trim();
  const isi = v.isi.trim();
  if (judul.length < 3) return "Judul minimal 3 karakter.";
  if (judul.length > 150) return "Judul maksimal 150 karakter.";
  if (isi.length < 5) return "Isi pengumuman minimal 5 karakter.";
  if (isi.length > 2000) return "Isi pengumuman maksimal 2000 karakter.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.tanggal) || Number.isNaN(new Date(v.tanggal).getTime())) {
    return "Tanggal tidak valid.";
  }
  return null;
}
