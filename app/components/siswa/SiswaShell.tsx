"use client";
import "./siswa.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { House, User, ListChecks, ClipboardList, LogOut, Lock, UserRound, Search } from "lucide-react";
import type { Akun } from "./useSiswa";

type Props = {
  akun: Akun | null;
  active: "dashboard" | "biodata";
  showSearch?: boolean;
  children: React.ReactNode;
};

export default function SiswaShell({ akun, active, showSearch, children }: Props) {
  const router = useRouter();

  async function keluar() {
    await fetch("/api/siswa/logout", { method: "POST" });
    router.replace("/login/siswa");
  }

  return (
    <div className="sw-root">
      <aside className="sw-side">
        <div className="sw-logo">SPMB</div>
        <nav className="sw-nav" aria-label="Menu calon siswa">
          <Link href="/dashboard/siswa" className={`sw-item ${active === "dashboard" ? "on" : ""}`}>
            <House size={28} /> Dashboard
          </Link>
          <Link href="/dashboard/siswa/biodata" className={`sw-item ${active === "biodata" ? "on" : ""}`}>
            <User size={28} /> Biodata
          </Link>
          <div className="sw-item off" aria-disabled="true" title="Seleksi belum dibuka">
            <ListChecks size={28} /> Seleksi <Lock size={26} className="lock" />
          </div>
          <div className="sw-item off" aria-disabled="true" title="Hasil seleksi belum tersedia">
            <ClipboardList size={28} /> Hasil Seleksi
          </div>
        </nav>
        <button type="button" className="sw-item sw-out" onClick={keluar}>
          <LogOut size={30} /> Keluar
        </button>
      </aside>

      <main className="sw-main">
        <div className="sw-top">
          {showSearch && (
            <label className="sw-search">
              <Search size={22} />
              <input type="search" placeholder="Cari informasi..." />
            </label>
          )}
          <div className="sw-user">
            <div className="sw-avatar"><UserRound size={30} fill="currentColor" /></div>
            <div className="sw-chip">
              <b>{akun?.nama ?? "..."}</b>
              <span>{akun?.email ?? ""}</span>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
