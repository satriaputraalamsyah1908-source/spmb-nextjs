import { NextResponse } from "next/server";

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function serverFail(e: unknown) {
  console.error(e);
  const code = (e as { code?: string })?.code;
  if (code === "ECONNREFUSED" || code === "ER_ACCESS_DENIED_ERROR") {
    return fail(
      "Tidak bisa terhubung ke database. Pastikan MySQL di Laragon sudah Start dan user/password di .env.local benar.",
      500
    );
  }
  return fail("Terjadi kesalahan di server.", 500);
}
