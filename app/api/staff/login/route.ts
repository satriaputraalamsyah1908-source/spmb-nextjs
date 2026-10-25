import { NextResponse } from "next/server";
import { STAFF_ACCOUNTS } from "../../../lib/auth";
import { setStaffCookie } from "../../../lib/server/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const role = body.role === "admin" || body.role === "kepsek" ? body.role : null;
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  if (!role) return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
  }

  const acc = STAFF_ACCOUNTS[role];
  if (email !== acc.email.toLowerCase() || password !== acc.password) {
    return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
  }

  await setStaffCookie(role);
  return NextResponse.json({ nama: acc.nama, email: acc.email });
}
