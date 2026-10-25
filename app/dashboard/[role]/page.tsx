"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getSession, type Session } from "../../lib/auth";
import "../../styles/auth.css";

const TITLE: Record<string, string> = {
  admin: "Dashboard Admin",
  siswa: "Dashboard Calon Siswa",
  kepsek: "Dashboard Kepala Sekolah",
};

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useParams<{ role: string }>();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== role) {
      router.replace("/portal");
      return;
    }
    setSession(s);
  }, [role, router]);

  if (!session) return null;

  return (
    <main className="dash-page">
      <div className="dash-card">
        <h1>{TITLE[role] ?? "Dashboard"}</h1>
        <p>
          Halo, <strong>{session.nama}</strong> ({session.email}). Kamu berhasil masuk.
        </p>
        <p className="dash-note">Halaman ini masih kosong, isi fitur {role} di sini.</p>
        <button
          className="staff-btn"
          onClick={() => {
            clearSession();
            router.push("/portal");
          }}
        >
          KELUAR
        </button>
      </div>
    </main>
  );
}
