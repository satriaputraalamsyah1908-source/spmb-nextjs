"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bars, Donut } from "../../components/Charts";
import {
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  FileIcon,
  GearIcon,
  LogoutIcon,
  SearchIcon,
  UserIcon,
} from "../../components/Icons";
import { useRoleGuard } from "../../lib/useRoleGuard";
import "../../styles/dashboard.css";
import "../../styles/admin.css";

type Status = "terdaftar" | "terverifikasi" | "lolos";
type Row = {
  id: number;
  nama: string;
  email: string;
  nik: string;
  nisn: string;
  jurusan: string;
  status: Status;
  ijazah_nama_asli: string;
  dibuat_pada: string;
};
type Data = {
  ringkasan: {
    total: number;
    terdaftar: number;
    terverifikasi: number;
    lolos: number;
    akunBelumLengkap: number;
  };
  daftar: Row[];
};

const MENU = ["Dasboard", "Pendaftaran", "Verifikasi", "Soal Tes", "Hasil Seleksi"];
const LABEL: Record<Status, string> = {
  terdaftar: "TERDAFTAR",
  terverifikasi: "TERVERIFIKASI",
  lolos: "LOLOS SELEKSI",
};
const REFRESH_MS = 10000; // data diperbarui otomatis tiap 10 detik

function tanggal(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default function DashboardAdminPage() {
  const router = useRouter();
  const { session, logout } = useRoleGuard("admin");

  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [modalMsg, setModalMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/pendaftar", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login/admin");
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

  const r = data?.ringkasan ?? { total: 0, terdaftar: 0, terverifikasi: 0, lolos: 0, akunBelumLengkap: 0 };
  const keyword = q.trim().toLowerCase();
  const cocok = (data?.daftar ?? []).filter(
    (x) =>
      !keyword ||
      x.nama.toLowerCase().includes(keyword) ||
      x.nisn.includes(keyword) ||
      x.nik.includes(keyword)
  );
  const visible = showAll ? cocok : cocok.slice(0, 5);
  const selected = data?.daftar.find((x) => x.id === selectedId) ?? null;

  const segs = [
    { label: "Terverifikasi", value: r.terverifikasi, color: "#5cff10" },
    { label: "Lolos Seleksi", value: r.lolos, color: "#e0dc20" },
    { label: "Belum Terverifikasi", value: r.terdaftar, color: "#e03a2a" },
  ];
  const bars = [
    { label: "Terverifikasi", value: r.terverifikasi, color: "#417a45" },
    { label: "Belum Terverifikasi", value: r.terdaftar, color: "#6b7248" },
    { label: "Lolos Seleksi", value: r.lolos, color: "#bccc2c" },
  ];

  async function ubahStatus(row: Row, status: Status) {
    setBusy(true);
    setModalMsg("");
    try {
      const res = await fetch(`/api/admin/pendaftar/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login/admin");
        return;
      }
      if (!res.ok) {
        setModalMsg(json.error ?? "Gagal mengubah status.");
        return;
      }
      await load();
    } catch {
      setModalMsg("Gagal mengubah status. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-brand">
          <h1>SPMB</h1>
          <p>Sistem Penerimaan Murid Baru</p>
        </div>

        <p className="adm-menu-label">MAIN MENU</p>
        <nav className="adm-nav">
          {MENU.map((m, i) => (
            <button
              key={m}
              type="button"
              className={i === 0 ? "active" : ""}
              aria-current={i === 0 ? "page" : undefined}
              onClick={() => {
                if (i === 1) router.push("/dashboard/admin/pendaftaran");
                if (i === 2) router.push("/dashboard/admin/verifikasi");
                if (i === 3) router.push("/dashboard/admin/soal");
                if (i === 4) router.push("/dashboard/admin/hasil");
              }}
            >
              {m}
            </button>
          ))}
        </nav>

        <div className="adm-user">
          <div className="adm-user-row">
            <span className="adm-avatar">
              <UserIcon size={30} />
            </span>
            <div>
              <strong>{session.nama}</strong>
              <small>{session.email}</small>
            </div>
          </div>
          <button type="button" className="adm-logout" onClick={logout} aria-label="Keluar">
            <LogoutIcon size={28} />
          </button>
        </div>
      </aside>

      <section className="adm-main">
        <div className="adm-top">
          <form className="adm-search" onSubmit={(e) => e.preventDefault()}>
            <SearchIcon size={30} />
            <input
              type="search"
              placeholder="Search something..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Cari nama, NISN, atau NIK"
            />
            <button type="submit">SEARCH</button>
          </form>
          <div className="adm-icons">
            <BellIcon size={34} />
            <GearIcon size={34} />
          </div>
        </div>

        <h1 className="adm-title">Dasboard</h1>
        <p className="adm-sub">Pantau penerimaan murid di sini</p>
        {data && r.akunBelumLengkap > 0 && (
          <p className="adm-note">
            {r.akunBelumLengkap} akun sudah dibuat tapi belum melengkapi Data Diri.
          </p>
        )}
        {error && <p className="adm-banner error">{error}</p>}

        <div className="adm-stats">
          <div className="stat" style={{ background: "#e6f4e8" }}>
            <span className="stat-icon" style={{ background: "#f59a00", color: "#fff", borderRadius: 4 }}>
              <UserIcon size={52} />
            </span>
            <b>{r.total}</b>
            <span>Pendaftar</span>
          </div>
          <div className="stat" style={{ background: "#ecf7cf" }}>
            <span className="stat-icon" style={{ color: "#7bc418" }}>
              <CheckCircleIcon size={64} />
            </span>
            <b>{r.terverifikasi}</b>
            <span>Terverifikasi</span>
          </div>
          <div className="stat" style={{ background: "#eedfcf" }}>
            <span className="stat-icon" style={{ color: "#2a7de1" }}>
              <FileIcon size={64} />
            </span>
            <b>{r.terdaftar}</b>
            <span>Belum Terverifikasi</span>
          </div>
          <div className="stat" style={{ background: "#f2d675" }}>
            <span className="stat-icon" style={{ color: "#c98a2a" }}>
              <ClockIcon size={64} />
            </span>
            <b>{r.lolos}</b>
            <span>Lolos Seleksi</span>
          </div>
        </div>

        <div className="adm-charts">
          <div className="chart-card">
            <Bars data={bars} />
          </div>
          <div className="chart-card">
            <Donut segments={segs} center={r.total} caption="Pendaftar" />
          </div>
        </div>

        <div className="adm-table-head">
          <button type="button" className="pill-btn adm-refresh" onClick={load}>
            Segarkan
          </button>
          <button type="button" className="pill-btn" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Ringkas" : "Lihat semua"}
          </button>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>NAMA</th>
                <th>NISN</th>
                <th>Tanggal Daftar</th>
                <th>Status</th>
                <th className="sr-only">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!data && !error && (
                <tr>
                  <td colSpan={6} className="empty">
                    Memuat data...
                  </td>
                </tr>
              )}
              {data && visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    {keyword ? "Tidak ada data yang cocok." : "Belum ada pendaftar."}
                  </td>
                </tr>
              )}
              {visible.map((x, i) => (
                <tr key={x.id}>
                  <td>{i + 1}.</td>
                  <td>{x.nama}</td>
                  <td>{x.nisn}</td>
                  <td>{tanggal(x.dibuat_pada)}</td>
                  <td>
                    <span className={`status-tag ${x.status}`}>{LABEL[x.status]}</span>
                  </td>
                  <td className="act">
                    <button
                      type="button"
                      className="lihat-btn"
                      onClick={() => {
                        setModalMsg("");
                        setSelectedId(x.id);
                      }}
                    >
                      Lihat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="modal-bg" onClick={() => setSelectedId(null)} role="presentation">
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Detail Pendaftar</h2>
            <dl>
              <dt>Nama</dt>
              <dd>{selected.nama}</dd>
              <dt>Email akun</dt>
              <dd>{selected.email}</dd>
              <dt>NIK</dt>
              <dd>{selected.nik}</dd>
              <dt>NISN</dt>
              <dd>{selected.nisn}</dd>
              <dt>Jurusan</dt>
              <dd>{selected.jurusan}</dd>
              <dt>Tanggal Daftar</dt>
              <dd>{tanggal(selected.dibuat_pada)}</dd>
              <dt>Status</dt>
              <dd>
                <span className={`status-tag ${selected.status}`}>{LABEL[selected.status]}</span>
              </dd>
              <dt>Ijazah/SKL</dt>
              <dd>
                <a
                  className="link"
                  href={`/api/admin/ijazah/${selected.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {selected.ijazah_nama_asli}
                </a>
              </dd>
            </dl>

            {modalMsg && <p className="modal-msg">{modalMsg}</p>}

            <div className="modal-actions">
              {selected.status === "terdaftar" && (
                <button type="button" className="lihat-btn" disabled={busy} onClick={() => ubahStatus(selected, "terverifikasi")}>
                  Verifikasi
                </button>
              )}
              {selected.status === "terverifikasi" && (
                <>
                  <button type="button" className="lihat-btn" disabled={busy} onClick={() => ubahStatus(selected, "lolos")}>
                    Loloskan Seleksi
                  </button>
                  <button type="button" className="lihat-btn alt" disabled={busy} onClick={() => ubahStatus(selected, "terdaftar")}>
                    Batalkan Verifikasi
                  </button>
                </>
              )}
              {selected.status === "lolos" && (
                <button type="button" className="lihat-btn alt" disabled={busy} onClick={() => ubahStatus(selected, "terverifikasi")}>
                  Batalkan Kelulusan
                </button>
              )}
            </div>

            <button type="button" className="lihat-btn" onClick={() => setSelectedId(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
