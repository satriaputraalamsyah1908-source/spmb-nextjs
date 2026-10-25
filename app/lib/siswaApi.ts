// Dipakai halaman /daftar dan /login/siswa (client side)
type Result = { ok: true } | { ok: false; error: string };

async function post(url: string, body: unknown): Promise<Result> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || "Terjadi kesalahan." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Tidak bisa menghubungi server." };
  }
}

export const daftarSiswa = (nama: string, email: string, password: string) =>
  post("/api/siswa/daftar", { nama, email, password });

export const loginSiswa = (email: string, password: string) =>
  post("/api/siswa/login", { email, password });
