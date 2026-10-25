import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "spmb_siswa";
const SECRET = process.env.SESSION_SECRET || "spmb-dev-secret-ganti-saat-production";

function sign(v: string) {
  return crypto.createHmac("sha256", SECRET).update(v).digest("hex");
}

export async function setSession(id: number) {
  const jar = await cookies();
  jar.set(COOKIE, `${id}.${sign(String(id))}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionId(): Promise<number | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const [id, sig] = raw.split(".");
  if (!id || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(id));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}
