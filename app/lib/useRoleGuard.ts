"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, getSession, type Role, type Session } from "./auth";

// Memastikan hanya role yang sesuai yang bisa membuka dashboard.
// Kalau belum login / role beda, otomatis dilempar ke /portal.
export function useRoleGuard(role: Role) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== role) {
      router.replace("/portal");
      return;
    }
    setSession(s);
  }, [role, router]);

  const logout = () => {
    // Cookie sesi di server ikut dihapus saat keluar.
    fetch(role === "siswa" ? "/api/siswa/logout" : "/api/staff/logout", { method: "POST" }).catch(
      () => {}
    );
    clearSession();
    router.push("/portal");
  };

  return { session, logout };
}
