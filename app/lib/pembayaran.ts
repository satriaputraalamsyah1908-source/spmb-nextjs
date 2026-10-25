// Data & aturan pembayaran formulir (dipakai di browser DAN server).
import { cekNama } from "./validasi";

export const BIAYA = 200000;
export const JENIS_PENDAFTARAN = "SMK REGULER";
export const BUKTI_MAX = 2 * 1024 * 1024; // 2 MB
export const BUKTI_EXT = ["pdf", "jpg", "jpeg", "png"];

export type Tipe = "bank" | "ewallet";
export type Metode = {
  id: string;
  nama: string;
  tipe: Tipe;
  warna: string; // warna tulisan kalau gambar logo belum ada di public/images/bank
  tujuan: string; // nomor rekening / nomor e-wallet sekolah
  atasNama: string;
};

// GANTI nomor di bawah ini dengan rekening / e-wallet resmi sekolah.
export const METODE: Metode[] = [
  { id: "bca", nama: "BCA", tipe: "bank", warna: "#0b4ea2", tujuan: "1234567890", atasNama: "SMA Citra Negara" },
  { id: "bri", nama: "BRI", tipe: "bank", warna: "#0a58b5", tujuan: "012345678901234", atasNama: "SMA Citra Negara" },
  { id: "bni", nama: "BNI", tipe: "bank", warna: "#d4572a", tujuan: "0123456789", atasNama: "SMA Citra Negara" },
  { id: "mandiri", nama: "Mandiri", tipe: "bank", warna: "#12285e", tujuan: "1230001234567", atasNama: "SMA Citra Negara" },
  { id: "bsi", nama: "BSI", tipe: "bank", warna: "#12a89d", tujuan: "7012345678", atasNama: "SMA Citra Negara" },
  { id: "gopay", nama: "GoPay", tipe: "ewallet", warna: "#00a5cf", tujuan: "081234567890", atasNama: "SMA Citra Negara" },
  { id: "ovo", nama: "OVO", tipe: "ewallet", warna: "#4c2a86", tujuan: "081234567891", atasNama: "SMA Citra Negara" },
  { id: "dana", nama: "DANA", tipe: "ewallet", warna: "#118eea", tujuan: "081234567892", atasNama: "SMA Citra Negara" },
  { id: "shopeepay", nama: "ShopeePay", tipe: "ewallet", warna: "#ee4d2d", tujuan: "081234567893", atasNama: "SMA Citra Negara" },
  { id: "linkaja", nama: "LinkAja", tipe: "ewallet", warna: "#e82529", tujuan: "081234567894", atasNama: "SMA Citra Negara" },
];

export const rupiah = (n: number) => "Rp " + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/* ---------- Validasi ---------- */
export const cekNamaPengirim = (v: string) => cekNama(v);

export function cekNoPengirim(tipe: Tipe, v: string): string | null {
  const s = v.trim();
  if (!s) return tipe === "bank" ? "Nomor rekening pengirim wajib diisi." : "Nomor HP e-wallet wajib diisi.";
  if (tipe === "bank") {
    if (!/^\d{6,20}$/.test(s)) return "Nomor rekening harus 6-20 digit angka.";
  } else if (!/^08\d{8,12}$/.test(s)) {
    return "Nomor HP harus diawali 08 dan terdiri dari 10-14 digit.";
  }
  return null;
}

export function cekRef(v: string): string | null {
  const s = v.trim();
  if (s.length > 40) return "Maksimal 40 karakter.";
  if (s && !/^[\w\-./ ]+$/.test(s)) return "Hanya huruf, angka, spasi, titik, garis, dan garis miring.";
  return null;
}

const p2 = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const geser = (hari: number) => {
  const d = new Date();
  d.setDate(d.getDate() + hari);
  return iso(d);
};
export const TANGGAL_MAX = () => geser(1);
export const TANGGAL_MIN = () => geser(-30);

export function cekTanggal(v: string): string | null {
  if (!v) return "Tanggal pembayaran wajib diisi.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(new Date(v).getTime())) return "Tanggal tidak valid.";
  if (v > TANGGAL_MAX()) return "Tanggal tidak boleh di masa depan.";
  if (v < TANGGAL_MIN()) return "Tanggal pembayaran maksimal 30 hari yang lalu.";
  return null;
}

export function cekBukti(nama: string, ukuran: number): string | null {
  const ext = nama.split(".").pop()?.toLowerCase() ?? "";
  if (!BUKTI_EXT.includes(ext)) return "Bukti harus berupa file PDF, JPG, atau PNG.";
  if (ukuran > BUKTI_MAX) return `Ukuran bukti maksimal ${BUKTI_MAX / 1024 / 1024} MB.`;
  if (ukuran === 0) return "File kosong.";
  return null;
}
