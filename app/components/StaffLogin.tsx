"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isEmail, setSession } from "../lib/auth";
import "../styles/auth.css";

type Props = {
  role: "admin" | "kepsek";
  welcome: string;
  emailPlaceholder: string;
  children: React.ReactNode; // teks penyemangat di bawah tombol
};

export default function StaffLogin({ role, welcome, emailPlaceholder, children }: Props) {
  const router = useRouter();
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
      // Dicek di server supaya dashboard & datanya terlindungi.
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Gagal masuk.");
        return;
      }
      setSession({ role, nama: data.nama, email: data.email });
      router.push(`/dashboard/${role}`);
    } catch {
      setError("Tidak bisa menghubungi server. Pastikan project sedang berjalan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`staff-page staff-${role}`}>
      <div className="staff-card">
        <p className="staff-welcome">{welcome}</p>
        <h1 className="staff-title">SPMB</h1>

        <form onSubmit={handleSubmit} noValidate className="staff-form">
          <div className="staff-input">
            <span className="staff-icon">
              <Image src="/icons/mail.svg" alt="" width={38} height={38} unoptimized />
            </span>
            <input
              type="email"
              placeholder={emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="staff-input">
            <span className="staff-icon">
              <Image src="/icons/lock.svg" alt="" width={34} height={34} unoptimized />
            </span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="form-error center">{error}</p>}

          <button type="submit" className="staff-btn" disabled={loading}>
            {loading ? "MEMPROSES..." : "MASUK"}
          </button>
        </form>

        <p className="staff-message">{children}</p>

        <Link href="/portal" className="back-link">
          ← Kembali ke Portal
        </Link>
      </div>
    </main>
  );
}
