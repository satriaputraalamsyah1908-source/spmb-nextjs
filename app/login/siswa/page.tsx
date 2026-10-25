"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import PasswordInput from "../../components/PasswordInput";
import { isEmail, setSession } from "../../lib/auth";
import "../../styles/auth.css";

function LoginSiswaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }
    if (!isEmail(email)) {
      setError("Format email tidak valid.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Cek akun ke database MySQL (tabel akun_siswa)
      const res = await fetch("/api/siswa/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal masuk.");
        return;
      }
      setSession({ role: "siswa", nama: data.nama, email: data.email });
      router.push("/dashboard/siswa");
    } catch {
      setError("Tidak bisa menghubungi server. Pastikan project sedang berjalan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="photo-page">
      <div className="photo-pill">SPMB</div>
      <h1 className="photo-heading">Selamat Datang Kembali</h1>
      <p className="photo-subheading">Silahkan Masukan Akun Anda</p>

      <form onSubmit={handleSubmit} noValidate className="photo-form">
        <div className="green-card">
          {justRegistered && (
            <p className="form-success">Akun berhasil dibuat. Silahkan masuk.</p>
          )}

          <label htmlFor="email">Email</label>
          <div className="field-wrap">
            <input
              id="email"
              type="email"
              placeholder="Email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="label-row">
            <label htmlFor="password">Password</label>
            <a href="#" className="forgot" onClick={(e) => e.preventDefault()}>
              Lupa Password?
            </a>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          {error && <p className="form-error">{error}</p>}

          <p className="switch-text">
            Belum Memiliki Akun? <Link href="/daftar">DAFTAR</Link>
          </p>
        </div>

        <button type="submit" className="green-btn" disabled={loading}>
          {loading ? "MEMPROSES..." : "MASUK"}
        </button>
      </form>

      <Link href="/portal" className="back-link light">
        ← Kembali ke Portal
      </Link>
    </main>
  );
}

export default function LoginSiswaPage() {
  return (
    <Suspense fallback={null}>
      <LoginSiswaForm />
    </Suspense>
  );
}
