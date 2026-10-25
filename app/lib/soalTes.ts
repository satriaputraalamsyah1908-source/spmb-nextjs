// Aturan soal tes (dipakai di browser DAN server).
export const HURUF = ["A", "B", "C", "D"] as const;

export type SoalInput = { pertanyaan: string; opsi: string[]; kunci: number };

export function cekSoal(v: SoalInput): string | null {
  const q = v.pertanyaan.trim();
  if (q.length < 5) return "Pertanyaan minimal 5 karakter.";
  if (q.length > 1000) return "Pertanyaan maksimal 1000 karakter.";
  if (!Array.isArray(v.opsi) || v.opsi.length !== 4) return "Pilihan jawaban harus 4 (A-D).";
  for (let i = 0; i < 4; i++) {
    const o = String(v.opsi[i] ?? "").trim();
    if (!o) return `Pilihan ${HURUF[i]} wajib diisi.`;
    if (o.length > 255) return `Pilihan ${HURUF[i]} maksimal 255 karakter.`;
  }
  const unik = new Set(v.opsi.map((o) => o.trim().toLowerCase()));
  if (unik.size !== 4) return "Pilihan jawaban tidak boleh sama satu sama lain.";
  if (!Number.isInteger(v.kunci) || v.kunci < 0 || v.kunci > 3) return "Pilih salah satu jawaban yang benar.";
  return null;
}
