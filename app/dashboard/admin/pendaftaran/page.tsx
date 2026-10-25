"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  FileIcon,
  GearIcon,
  LogoutIcon,
  SearchIcon,
  UserIcon,
} from "../../../components/Icons";
import PengumumanAdmin from "../../../components/PengumumanAdmin";
import { useRoleGuard } from "../../../lib/useRoleGuard";
import "../../../styles/dashboard.css";
import "../../../styles/admin.css";

type Status = "terdaftar" | "terverifikasi" | "lolos";
type Row = {
  id: number;
  nama: string;
  email: string;
  nik: string;
  nisn: string;
  jurusan: string;
  status: Status;
  nilai: string | number | null;
  ijazah_nama_asli: string;
  dibuat_pada: string;
};
type Data = {
  ringkasan: { total: number; terdaftar: number; terverifikasi: number; lolos: number };
  daftar: Row[];
};

const MENU = [
  { label: "Dasboard", href: "/dashboard/admin" },
  { label: "Pendaftaran", href: "/dashboard/admin/pendaftaran" },
  { label: "Verifikasi", href: "/dashboard/admin/verifikasi" },
  { label: "Soal Tes", href: "/dashboard/admin/soal" },
  { label: "Hasil Seleksi", href: "/dashboard/admin/hasil" },
];
// Label status di tabel mengikuti desain
const TAG: Record<Status, { text: string; cls: string }> = {
  lolos: { text: "Diterima", cls: "diterima" },
  terverifikasi: { text: "Dalam Proses", cls: "proses" },
  terdaftar: { text: "Belum Diterima", cls: "belum" },
};
const PAGE = 5;
const REFRESH_MS = 10000;

const noPendaftar = (r: Row) =>
  `SPMB${new Date(r.dibuat_pada).getFullYear() % 100 || 26}${String(r.id).padStart(6, "0")}`;
const nilaiNum = (r: Row) => (r.nilai === null || r.nilai === "" ? null : Number(r.nilai));
const fmtNilai = (n: number | null) =>
  n === null ? "-" : String(n).replace(".", ",");
const tglKey = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const tglTampil = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : tglKey(iso).split("-").reverse().join("/");
};

export default function PendaftaranAdminPage() {
  const router = useRouter();
  const { session, logout } = useRoleGuard("admin");

  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [fStatus, setFStatus] = useState<"" | Status>("");
  const [limit, setLimit] = useState(PAGE);
  const [penuh, setPenuh] = useState(false); // tampilan "Lihat Selengkapnya": hanya tabel, semua baris
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [nilaiInput, setNilaiInput] = useState("");
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

  // Peringkat: nilai tertinggi = 1 (nilai sama -> peringkat sama)
  const peringkat = useMemo(() => {
    const m = new Map<number, number>();
    const nilai = (data?.daftar ?? [])
      .map((r) => ({ id: r.id, n: nilaiNum(r) }))
      .filter((x): x is { id: number; n: number } => x.n !== null)
      .sort((a, b) => b.n - a.n);
    nilai.forEach((x, i) => {
      m.set(x.id, i > 0 && nilai[i - 1].n === x.n ? m.get(nilai[i - 1].id)! : i + 1);
    });
    return m;
  }, [data]);

  const hasil = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return (data?.daftar ?? [])
      .filter((x) => {
        if (kw && !(x.nama.toLowerCase().includes(kw) || x.nisn.includes(kw) || noPendaftar(x).toLowerCase().includes(kw)))
          return false;
        if (fStatus && x.status !== fStatus) return false;
        const k = tglKey(x.dibuat_pada);
        if (dari && k < dari) return false;
        if (sampai && k > sampai) return false;
        return true;
      })
      .sort((a, b) => {
        const pa = peringkat.get(a.id) ?? Infinity;
        const pb = peringkat.get(b.id) ?? Infinity;
        return pa !== pb ? pa - pb : a.id - b.id;
      });
  }, [data, q, fStatus, dari, sampai, peringkat]);

  if (!session) return null;

  const r = data?.ringkasan ?? { total: 0, terdaftar: 0, terverifikasi: 0, lolos: 0 };
  const visible = penuh ? hasil : hasil.slice(0, limit);
  const selected = data?.daftar.find((x) => x.id === selectedId) ?? null;

  function buka(x: Row) {
    setModalMsg("");
    setNilaiInput(nilaiNum(x) === null ? "" : String(nilaiNum(x)));
    setSelectedId(x.id);
  }

  async function ubah(row: Row, body: { status?: Status; nilai?: string | null }) {
    setBusy(true);
    setModalMsg("");
    try {
      const res = await fetch(`/api/admin/pendaftar/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login/admin");
        return;
      }
      if (!res.ok) {
        setModalMsg(json.error ?? "Gagal menyimpan.");
        return;
      }
      await load();
      if (body.nilai !== undefined) setModalMsg("Nilai tersimpan.");
    } catch {
      setModalMsg("Gagal menyimpan. Coba lagi.");
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
          {MENU.map((m) => {
            const aktif = m.href === "/dashboard/admin/pendaftaran";
            return (
              <button
                key={m.label}
                type="button"
                className={aktif ? "active" : ""}
                aria-current={aktif ? "page" : undefined}
                onClick={() => m.href && !aktif && router.push(m.href)}
              >
                {m.label}
              </button>
            );
          })}
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
              onChange={(e) => {
                setQ(e.target.value);
                setLimit(PAGE);
              }}
              aria-label="Cari"
            />
            <button type="submit">SEARCH</button>
          </form>
          <div className="adm-icons">
            <BellIcon size={34} />
            <GearIcon size={34} />
          </div>
        </div>

        {error && <p className="adm-banner error">{error}</p>}

        {!penuh && (
          <>
        <h1 className="adm-title pd-title">PENDAFTARAN</h1>

        <div className="pd-filters">
          <label className="pd-box pd-cari">
            <SearchIcon size={26} />
            <input
              type="search"
              placeholder="Cari nama / NISN / No. Pendaftar..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setLimit(PAGE);
              }}
              aria-label="Cari nama, NISN, atau nomor pendaftar"
            />
          </label>
          <div className="pd-box pd-tgl">
            <span>Tanggal Daftar</span>
            <div>
              <input type="date" value={dari} max={sampai || undefined} onChange={(e) => { setDari(e.target.value); setLimit(PAGE); }} aria-label="Dari tanggal" />
              <em>-</em>
              <input type="date" value={sampai} min={dari || undefined} onChange={(e) => { setSampai(e.target.value); setLimit(PAGE); }} aria-label="Sampai tanggal" />
            </div>
          </div>
          <div className="pd-box pd-stat">
            <span>Status</span>
            <select
              value={fStatus}
              onChange={(e) => {
                setFStatus(e.target.value as "" | Status);
                setLimit(PAGE);
              }}
              aria-label="Filter status"
            >
              <option value="">Semua</option>
              <option value="lolos">Diterima</option>
              <option value="terverifikasi">Dalam Proses</option>
              <option value="terdaftar">Belum Diterima</option>
            </select>
          </div>
        </div>

        <div className="adm-stats pd-stats">
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

          </>
        )}

        <div className={`pd-table-wrap ${penuh ? "penuh" : ""}`}>
          <table className="pd-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>Nomor Pendaftar</th>
                <th>Nama Calon Murid</th>
                <th>Nilai</th>
                <th>Peringkat</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!data && !error && (
                <tr>
                  <td colSpan={7} className="empty">Memuat data...</td>
                </tr>
              )}
              {data && visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    {data.daftar.length === 0 ? "Belum ada pendaftar." : "Tidak ada data yang cocok."}
                  </td>
                </tr>
              )}
              {visible.map((x, i) => (
                <tr key={x.id}>
                  <td>{i + 1}.</td>
                  <td>{noPendaftar(x)}</td>
                  <td>{x.nama}</td>
                  <td>{fmtNilai(nilaiNum(x))}</td>
                  <td>{peringkat.get(x.id) ?? "-"}</td>
                  <td>
                    <span className={`pd-tag ${TAG[x.status].cls}`}>{TAG[x.status].text}</span>
                  </td>
                  <td>
                    <button type="button" className="pd-detail" onClick={() => buka(x)}>
                      Lihat Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pd-more">
          {data && <small>Menampilkan {visible.length} dari {hasil.length} pendaftar</small>}
          {penuh ? (
            <button type="button" onClick={() => setPenuh(false)}>
              <span aria-hidden>‹</span> Kembali
            </button>
          ) : (
            <div className="pd-btns">
              {hasil.length > limit && (
                <button type="button" onClick={() => setLimit((l) => l + PAGE)}>
                  Lainnya <span aria-hidden>›</span>
                </button>
              )}
              {hasil.length > PAGE && (
                <button
                  type="button"
                  onClick={() => {
                    setPenuh(true);
                    window.scrollTo({ top: 0 });
                  }}
                >
                  Lihat Selengkapnya <span aria-hidden>›</span>
                </button>
              )}
            </div>
          )}
        </div>
        {!penuh && <PengumumanAdmin />}
      </section>

      {selected && (
        <div className="modal-bg" onClick={() => setSelectedId(null)} role="presentation">
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Detail Pendaftar</h2>
            <dl>
              <dt>No. Pendaftar</dt>
              <dd>{noPendaftar(selected)}</dd>
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
              <dd>{tglTampil(selected.dibuat_pada)}</dd>
              <dt>Status</dt>
              <dd>
                <span className={`pd-tag ${TAG[selected.status].cls}`}>{TAG[selected.status].text}</span>
              </dd>
              <dt>Ijazah/SKL</dt>
              <dd>
                <a className="link" href={`/api/admin/ijazah/${selected.id}`} target="_blank" rel="noreferrer">
                  {selected.ijazah_nama_asli}
                </a>
              </dd>
              <dt>Nilai</dt>
              <dd className="pd-nilai">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  placeholder="0 - 100"
                  value={nilaiInput}
                  onChange={(e) => setNilaiInput(e.target.value)}
                  aria-label="Nilai"
                />
                <button
                  type="button"
                  className="lihat-btn"
                  disabled={busy}
                  onClick={() => ubah(selected, { nilai: nilaiInput.trim() === "" ? null : nilaiInput })}
                >
                  Simpan
                </button>
              </dd>
            </dl>

            {modalMsg && <p className="modal-msg">{modalMsg}</p>}

            <div className="modal-actions">
              {selected.status === "terdaftar" && (
                <button type="button" className="lihat-btn" disabled={busy} onClick={() => ubah(selected, { status: "terverifikasi" })}>
                  Verifikasi
                </button>
              )}
              {selected.status === "terverifikasi" && (
                <>
                  <button type="button" className="lihat-btn" disabled={busy} onClick={() => ubah(selected, { status: "lolos" })}>
                    Loloskan Seleksi
                  </button>
                  <button type="button" className="lihat-btn alt" disabled={busy} onClick={() => ubah(selected, { status: "terdaftar" })}>
                    Batalkan Verifikasi
                  </button>
                </>
              )}
              {selected.status === "lolos" && (
                <button type="button" className="lihat-btn alt" disabled={busy} onClick={() => ubah(selected, { status: "terverifikasi" })}>
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
