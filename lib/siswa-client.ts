// Helper sisi browser. Dipanggil dari form /daftar SETELAH validasi lolos.
export type SiswaAktif = { id: number; nama: string; email: string };

export const KUNCI_SISWA = "spmb_siswa_aktif";

export async function daftarKeDatabase(
  nama: string,
  email: string,
  password: string
): Promise<{ ok: true; siswa: SiswaAktif } | { ok: false; error: string }> {
  try {
    const r = await fetch("/api/daftar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama, email, password }),
    });
    const data = await r.json();
    if (!r.ok) return { ok: false, error: data.error || "Gagal mendaftar." };
    localStorage.setItem(KUNCI_SISWA, JSON.stringify(data.siswa));
    return { ok: true, siswa: data.siswa };
  } catch {
    return { ok: false, error: "Tidak bisa terhubung ke server." };
  }
}

export function ambilSiswaAktif(): SiswaAktif | null {
  try {
    const s = localStorage.getItem(KUNCI_SISWA);
    return s ? (JSON.parse(s) as SiswaAktif) : null;
  } catch {
    return null;
  }
}
