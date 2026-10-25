"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bars, Donut, LineChart } from "../../components/Charts";
import {
  ArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  GearIcon,
  HomeIcon,
  LogoutIcon,
  SchoolArt,
  SearchIcon,
  TrendIcon,
  UserIcon,
  UsersIcon,
  XCircleIcon,
} from "../../components/Icons";
import { useRoleGuard } from "../../lib/useRoleGuard";
import "../../styles/dashboard.css";

// Teks sesuai desain. Ubah di sini kalau namanya mau disamakan.
const NAMA_WELCOME = "Drs. Budi Santoso";
const NAMA_HEADER = "Drs.Yanto Santoso";

type Periode = { now: number; prev: number };
type Ringkasan = {
  total: number;
  terdaftar: number;
  terverifikasi: number;
  lolos: number;
  ditolak: number;
  periode: { total: Periode; terverifikasi: Periode; proses: Periode; ditolak: Periode };
  harian: { label: string; value: number }[];
};
const REFRESH_MS = 15000;

// Perubahan 7 hari terakhir dibanding 7 hari sebelumnya (dalam persen).
function persen(p?: Periode) {
  if (!p) return 0;
  if (p.prev === 0) return p.now > 0 ? 100 : 0;
  return Math.round(((p.now - p.prev) / p.prev) * 100);
}

const MENU = [
  { label: "Dashboard", icon: <HomeIcon size={34} />, active: true },
  { label: "Data Pendaftar", icon: <UsersIcon size={30} /> },
  { label: "Laporan", icon: <TrendIcon size={30} /> },
  { label: "Pengaturan", icon: <GearIcon size={30} /> },
];

export default function DashboardKepsekPage() {
  const router = useRouter();
  const { session, logout } = useRoleGuard("kepsek");
  const [data, setData] = useState<Ringkasan | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/kepsek/ringkasan", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login/kepsek");
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal memuat data.");
        return;
      }
      setData(json);
      setError("");
    } catch {
      setError("Gagal memuat data. Pastikan project berjalan dan MySQL di Laragon sudah Start.");
    }
  }, [router]);

  useEffect(() => {
    if (!session) return;
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [session, load]);

  if (!session) return null;

  const d: Ringkasan = data ?? {
    total: 0,
    terdaftar: 0,
    terverifikasi: 0,
    lolos: 0,
    ditolak: 0,
    periode: { total: { now: 0, prev: 0 }, terverifikasi: { now: 0, prev: 0 }, proses: { now: 0, prev: 0 }, ditolak: { now: 0, prev: 0 } },
    harian: ["", "", "", "", "", ""].map(() => ({ label: "-", value: 0 })),
  };
  const sudahVerif = d.terverifikasi + d.lolos;
  const CARDS = [
    { label: "Total Pendaftar", value: d.total, p: persen(d.periode.total), bg: "#7aaf6e", icon: <UsersIcon size={52} />, ic: "#0d5a14" },
    { label: "Sudah Terverifikasi", value: sudahVerif, p: persen(d.periode.terverifikasi), bg: "#8fb455", icon: <CheckCircleIcon size={50} />, ic: "#6cc04a" },
    { label: "Dalam Proses", value: d.terdaftar, p: persen(d.periode.proses), bg: "#47b2b0", icon: <ClockIcon size={50} />, ic: "#1f6f86" },
    { label: "Ditolak", value: d.ditolak, p: persen(d.periode.ditolak), bg: "#b86a4b", icon: <XCircleIcon size={50} />, ic: "#d23a3a" },
  ];
  const puncak = Math.max(...d.harian.map((h) => h.value), 0);
  const maxY = Math.max(5, Math.ceil(puncak / 5) * 5);

  return (
    <div className="kp">
      <aside className="kp-side">
        <div className="kp-logo">SPMB</div>
        <nav className="kp-nav">
          {MENU.map((m) => (
            <button key={m.label} type="button" className={m.active ? "active" : ""}>
              {m.icon}
              <span>{m.label}</span>
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
            <SearchIcon size={28} />
            <input type="search" placeholder="Cari informasi..." aria-label="Cari informasi" />
          </label>
          <div className="kp-profile">
            <span className="kp-avatar">
              <UserIcon size={36} />
            </span>
            <div>
              <strong>{NAMA_HEADER}</strong>
              <small>Kepala Sekolah</small>
            </div>
          </div>
        </div>

        {error && (
          <p style={{ background: "#f6d6d1", color: "#8f1d12", borderRadius: 14, padding: "0.6rem 1rem", margin: "0 0 0.8rem", fontWeight: 600 }}>
            {error}
          </p>
        )}

        <div className="kp-welcome">
          <div>
            <p className="kp-hi">Selamat Datang.</p>
            <h1>{NAMA_WELCOME}</h1>
            <p className="kp-desc">
              Pantau perkembangan pemdaftaran siswa baru dengan mudah dan cepat melalui dashboard
              ini.
            </p>
          </div>
          <SchoolArt width={330} />
        </div>

        <div className="kp-cards">
          {CARDS.map((c) => (
            <div key={c.label} className="kp-card" style={{ background: c.bg }}>
              <div className="kp-card-top">
                <span style={{ color: c.ic }}>{c.icon}</span>
                <div>
                  <p>{c.label}</p>
                  <b>{c.value}</b>
                </div>
              </div>
              <div className="kp-up">
                <span style={{ display: "inline-flex", transform: c.p < 0 ? "rotate(180deg)" : undefined }}>
                  <ArrowUpIcon size={26} />
                </span>
                <span>{Math.abs(c.p)}%</span>
              </div>
              <small>dari periode sebelum nya (7 hari)</small>
            </div>
          ))}
        </div>

        <div className="kp-charts">
          <div className="kp-line">
            <LineChart points={d.harian} max={maxY} />
          </div>
          <div className="kp-side-charts">
            <div className="chart-card">
              <Donut
                size={150}
                center={d.total}
                caption="Pendaftar"
                segments={[
                  { label: "Terverifikasi", value: d.terverifikasi, color: "#5cff10" },
                  { label: "Lolos Seleksi", value: d.lolos, color: "#e0dc20" },
                  { label: "Belum Terverifiksi", value: d.terdaftar, color: "#e03a2a" },
                ]}
              />
            </div>
            <div className="chart-card">
              <Bars
                height={110}
                data={[
                  { label: "Terverifikasi", value: d.terverifikasi, color: "#417a45" },
                  { label: "Belum Terverifiksi", value: d.terdaftar, color: "#6b7248" },
                  { label: "Lolos Seleksi", value: d.lolos, color: "#bccc2c" },
                ]}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
