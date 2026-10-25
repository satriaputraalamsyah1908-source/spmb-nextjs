import crypto from "crypto";
import { cookies } from "next/headers";

// Cookie sesi (httpOnly, ditandatangani) supaya API tahu siapa yang login.
//  - spmb_siswa : calon siswa  -> berisi id akun
//  - spmb_staff : admin/kepsek -> berisi role
const SISWA = "spmb_siswa";
const STAFF = "spmb_staff";
const MAX_AGE = 60 * 60 * 8; // 8 jam

const secret = () => process.env.SESSION_SECRET || "spmb-dev-secret-ganti-saat-produksi";
const sign = (v: string) => crypto.createHmac("sha256", secret()).update(v).digest("hex");

const opts = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
  secure: process.env.NODE_ENV === "production",
};

// Memeriksa token "nilai.waktu.tanda-tangan" -> mengembalikan nilai kalau valid.
function verify(token: string | undefined): string | null {
  if (!token) return null;
  const [val, ts, sig] = token.split(".");
  if (!val || !ts || !sig) return null;

  const a = Buffer.from(sig);
  const b = Buffer.from(sign(`${val}.${ts}`));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Date.now() - Number(ts) > MAX_AGE * 1000) return null;
  return val;
}

function make(val: string) {
  const base = `${val}.${Date.now()}`;
  return `${base}.${sign(base)}`;
}

/* ---------- Calon siswa ---------- */
export async function setSiswaCookie(akunId: number) {
  (await cookies()).set(SISWA, make(String(akunId)), opts);
}

export async function getSiswaId(): Promise<number | null> {
  const v = verify((await cookies()).get(SISWA)?.value);
  const n = Number(v);
  return v && Number.isInteger(n) && n > 0 ? n : null;
}

export async function clearSiswaCookie() {
  (await cookies()).delete(SISWA);
}

/* ---------- Admin / Kepala Sekolah ---------- */
export type StaffRole = "admin" | "kepsek";

export async function setStaffCookie(role: StaffRole) {
  (await cookies()).set(STAFF, make(role), opts);
}

export async function getStaffRole(): Promise<StaffRole | null> {
  const v = verify((await cookies()).get(STAFF)?.value);
  return v === "admin" || v === "kepsek" ? v : null;
}

export async function clearStaffCookie() {
  (await cookies()).delete(STAFF);
}
