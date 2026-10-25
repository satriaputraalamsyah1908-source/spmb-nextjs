"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PasswordInput from "../components/PasswordInput";
import { isEmail, setSession } from "../lib/auth";
import "../styles/auth.css";

type Form = { nama: string; email: string; password: string; konfirmasi: string };
type Errors = Partial<Record<keyof Form, string>>;

function validate(f: Form): Errors {
  const e: Errors = {};

  const nama = f.nama.trim();
  if (!nama) e.nama = "Nama lengkap wajib diisi.";
  else if (nama.length < 3) e.nama = "Nama minimal 3 karakter.";
  else if (!/^[A-Za-z\s.'-]+$/.test(nama)) e.nama = "Nama hanya boleh berisi huruf.";

  if (!f.email.trim()) e.email = "Email wajib diisi.";
  else if (!isEmail(f.email)) e.email = "Format email tidak valid.";

  if (!f.password) e.password = "Password wajib diisi.";
  else if (f.password.length < 8) e.password = "Password minimal 8 karakter.";
  else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))
    e.password = "Password harus mengandung huruf dan angka.";

  if (!f.konfirmasi) e.konfirmasi = "Konfirmasi password wajib diisi.";
  else if (f.konfirmasi !== f.password) e.konfirmasi = "Konfirmasi password tidak sama.";

  return e;
}

export default function DaftarPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>({ nama: "", email: "", password: "", konfirmasi: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const errors = validate(form);
  const show = (k: keyof Form) => (touched[k] ? errors[k] : undefined);

  const set = (k: keyof Form) => (v: string) => {
    setServerError("");
    setForm((f) => ({ ...f, [k]: v }));
  };
  const blur = (k: keyof Form) => () => setTouched((t) => ({ ...t, [k]: true }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ nama: true, email: true, password: true, konfirmasi: true });
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setServerError("");
    try {
      // Akun disimpan ke database MySQL (tabel akun_siswa), password disimpan dalam bentuk hash.
      const res = await fetch("/api/siswa/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(data.error ?? "Gagal membuat akun.");
        return;
      }
      // Berhasil -> langsung masuk ke halaman Data Diri
      setSession({ role: "siswa", nama: data.nama, email: data.email });
      router.push("/dashboard/siswa/biodata");
    } catch {
      setServerError("Tidak bisa menghubungi server. Pastikan project sedang berjalan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="photo-page">
      <div className="photo-pill yellow">SPMB</div>
      <h1 className="photo-heading small">Selamat Datang Calon Siswa</h1>
      <h2 className="photo-subtitle">Buat Akun Baru</h2>

      <form onSubmit={handleSubmit} noValidate className="photo-form">
        <div className="green-card">
          <label htmlFor="nama">Nama Lengkap</label>
          <div className={`field-wrap ${show("nama") ? "invalid" : ""}`}>
            <input
              id="nama"
              type="text"
              placeholder="Nama Anda"
              value={form.nama}
              onChange={(e) => set("nama")(e.target.value)}
              onBlur={blur("nama")}
              autoComplete="name"
            />
          </div>
          {show("nama") && <p className="form-error">{show("nama")}</p>}

          <label htmlFor="email">Email</label>
          <div className={`field-wrap ${show("email") ? "invalid" : ""}`}>
            <input
              id="email"
              type="email"
              placeholder="Email@example.com"
              value={form.email}
              onChange={(e) => set("email")(e.target.value)}
              onBlur={blur("email")}
              autoComplete="email"
            />
          </div>
          {show("email") && <p className="form-error">{show("email")}</p>}

          <label htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            value={form.password}
            onChange={set("password")}
            onBlur={blur("password")}
            autoComplete="new-password"
            invalid={!!show("password")}
          />
          {show("password") && <p className="form-error">{show("password")}</p>}

          <label htmlFor="konfirmasi">Konfirmasi Password</label>
          <PasswordInput
            id="konfirmasi"
            value={form.konfirmasi}
            onChange={set("konfirmasi")}
            onBlur={blur("konfirmasi")}
            autoComplete="new-password"
            invalid={!!show("konfirmasi")}
          />
          {show("konfirmasi") && <p className="form-error">{show("konfirmasi")}</p>}

          {serverError && <p className="form-error">{serverError}</p>}
        </div>

        <button type="submit" className="green-btn narrow" disabled={loading}>
          {loading ? "MEMPROSES..." : "DAFTAR"}
        </button>
      </form>

      <p className="switch-text outside">
        Sudah punya akun? <Link href="/login/siswa">MASUK</Link>
      </p>
    </main>
  );
}
