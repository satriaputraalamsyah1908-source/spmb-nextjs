"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, ClipboardList, Clock3, FileText, Home, LockKeyhole, Search, UserRound } from "lucide-react";
import {
  LogoutIcon,
} from "../../components/Icons";
import Pengumuman from "../../components/Pengumuman";
import { useRoleGuard } from "../../lib/useRoleGuard";
import "../../styles/dashboard.css";

type Info = { status: "terdaftar" | "terverifikasi" | "lolos"; jurusan: string } | null;

const STATUS_TEXT = {
  terdaftar: "Terdaftar",
  terverifikasi: "Terverifikasi",
  lolos: "Lolos Seleksi",
};

const MENU = [
  { label: "Dashboard", icon: <Home size={25} fill="currentColor" />, active: true },
  { label: "Biodata", icon: <UserRound size={24} />, href: "/dashboard/siswa/biodata" },
  { label: "Seleksi", icon: <ClipboardList size={24} />, locked: true },
  { label: "Hasil Seleksi", icon: <ClipboardList size={24} /> },
];

export default function DashboardSiswaPage() {
  const router = useRouter();
  const { session, logout } = useRoleGuard("siswa");
  const [info, setInfo] = useState<Info>(null);
  const [loaded, setLoaded] = useState(false);

  // Ambil status pendaftaran dari database
  useEffect(() => {
    if (!session) return;
    let batal = false;
    (async () => {
      try {
        const res = await fetch("/api/biodata", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login/siswa");
          return;
        }
        const data = await res.json();
        if (!batal && res.ok && data.biodata) {
          setInfo({ status: data.biodata.status, jurusan: data.biodata.jurusan });
        }
      } catch {
        /* dashboard tetap tampil walau database belum bisa dihubungi */
      } finally {
        if (!batal) setLoaded(true);
      }
    })();
    return () => {
      batal = true;
    };
  }, [session, router]);

  if (!session) return null;

  const status = info?.status;
  const diverifikasi = status === "terverifikasi" || status === "lolos";
  const STEPS = [
    { title: "Buat akun", desc: "Akun SPMB kamu sudah aktif.", done: true },
    {
      title: "Lengkapi biodata",
      desc: info ? `Jurusan pilihan: ${info.jurusan}.` : "Isi data diri di menu Biodata.",
      done: !!info,
    },
    { title: "Unggah berkas", desc: "Ijazah/SKL diunggah di menu Biodata.", done: !!info },
    { title: "Verifikasi", desc: "Panitia memeriksa data dan berkasmu.", done: diverifikasi },
    { title: "Tes seleksi", desc: "Ikuti tes sesuai jadwal yang ditentukan.", done: status === "lolos" },
    { title: "Pengumuman", desc: "Lihat hasil seleksi di menu Hasil Seleksi.", done: status === "lolos" },
  ];
  const progressSteps = [
    { title: "Biodata", done: STEPS[1].done, current: false },
    { title: "Dokumen", done: STEPS[2].done, current: false },
    { title: "Verifikasi", done: diverifikasi, current: !diverifikasi && !!info },
    { title: "Seleksi", done: status === "lolos", current: false },
    { title: "Pengumuman", done: status === "lolos", current: false },
  ];

  return (
    <div className="kp">
      <aside className="kp-side">
        <div className="kp-logo">SPMB</div>
        <nav className="kp-nav">
          {MENU.map((m) => (
            <button
              key={m.label}
              type="button"
              className={`${m.active ? "active" : ""}${m.locked ? " locked" : ""}`}
              onClick={() => m.href && router.push(m.href)}
            >
              {m.icon}
              <span>{m.label}</span>
              {m.locked && <LockKeyhole size={22} aria-label="Belum dibuka" />}
            </button>
          ))}
          <button type="button" onClick={logout} className="kp-out">
            <LogoutIcon size={30} />
            <span>Keluar</span>
          </button>
        </nav>
      </aside>

      <section className="kp-main">
        <div className="kp-top">
          <label className="kp-search">
            <Search size={20} />
            <input type="search" placeholder="Cari informasi..." aria-label="Cari informasi" />
          </label>
          <div className="kp-profile">
            <span className="kp-avatar">
              <UserRound size={28} fill="currentColor" />
            </span>
            <div>
              <strong>{session.nama}</strong>
              <small>{session.email}</small>
            </div>
          </div>
        </div>

        <header className="kp-welcome">
          <h1>Halo, {session.nama}</h1>
          <p>Selamat datang di halaman dashboard Sistem Penerimaan Murid Baru (SPMB)</p>
          <p>Pantau terus status pendaftaran dan pastikan data sudah lengkap dan benar</p>
        </header>

        <div className="kp-cards">
          <article className="kp-card kp-card-biodata">
            <UserRound size={44} />
            <h2>Data Diri</h2>
            <p><span className="kp-check"><Check size={16} /></span>{info ? "Lengkap" : "Belum Lengkap"}</p>
          </article>
          <article className="kp-card kp-card-dokumen">
            <FileText size={42} />
            <h2>Dokumen</h2>
            <p><span className="kp-check"><Check size={16} /></span>{info ? "1/1 Terunggah" : "0/1 Terunggah"}</p>
          </article>
          <article className="kp-card kp-card-status">
            <FileText size={42} />
            <h2>Status Pendaftaran</h2>
            <p><span className="kp-check"><Check size={16} /></span>
              {!loaded ? "Memuat..." : status ? STATUS_TEXT[status] : "Belum lengkap"}
            </p>
          </article>
          <article className="kp-card kp-card-hasil">
            <ClipboardList size={42} />
            <h2>Hasil Seleksi</h2>
            <p><Clock3 size={21} />{status === "lolos" ? "Tersedia" : "Belum Tersedia"}</p>
          </article>
        </div>

        <section className="kp-progress">
          <h2><FileText size={27} /> Tahap Pendaftaran</h2>
          <ol>
            {progressSteps.map((step, i) => (
              <li key={step.title} className={step.done ? "done" : step.current ? "current" : ""}>
                <span className="kp-stage-dot">
                  {step.done ? <Check size={24} /> : step.current ? <span className="kp-spinner" /> : String(i + 1).padStart(2, "0")}
                </span>
                <strong>{step.title}</strong>
                <small>{step.done ? "Selesai" : step.current ? "Dalam Proses" : "Menunggu"}</small>
              </li>
            ))}
          </ol>
          {loaded && !info && (
            <button type="button" className="kp-complete-btn" onClick={() => router.push("/dashboard/siswa/biodata")}>
              Lengkapi Data Diri
            </button>
          )}
        </section>

        <Pengumuman />
      </section>
    </div>
  );
}
