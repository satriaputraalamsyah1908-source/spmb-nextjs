// Autentikasi sederhana (demo, tanpa backend). Data disimpan di browser.
// Nanti kalau sudah ada database/API, ganti isi fungsi-fungsi di file ini saja.

export type Role = "admin" | "siswa" | "kepsek";

// Akun admin & kepala sekolah (ubah sesuai kebutuhan)
export const STAFF_ACCOUNTS: Record<"admin" | "kepsek", { email: string; password: string; nama: string }> = {
  admin: { email: "admin@gmail.com", password: "admin12345", nama: "Admin" },
  kepsek: { email: "kepsek@gmail.com", password: "kepsek1", nama: "Kepala Sekolah" },
};

export type Siswa = { nama: string; email: string; password: string };
export type Session = { role: Role; nama: string; email: string };

const SISWA_KEY = "spmb_siswa";
const SESSION_KEY = "spmb_session";

export function getAllSiswa(): Siswa[] {
  try {
    return JSON.parse(localStorage.getItem(SISWA_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveSiswa(s: Siswa) {
  const all = getAllSiswa();
  all.push(s);
  localStorage.setItem(SISWA_KEY, JSON.stringify(all));
}

export function setSession(s: Session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {}
}

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
