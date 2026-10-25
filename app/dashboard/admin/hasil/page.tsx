"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BellIcon, GearIcon, LogoutIcon, SearchIcon, UserIcon } from "../../../components/Icons";
import { useRoleGuard } from "../../../lib/useRoleGuard";
import "../../../styles/dashboard.css";
import "../../../styles/admin.css";

type Hasil = "lulus" | "tidak_lulus" | null;
type Row = {
  id: number;
  nama: string;
  email: string;
  nik: string;
  nisn: string;
  jurusan: string;
  status: "terdaftar" | "terverifikasi" | "lolos";
  nilai: string | number | null;
  hasil: Hasil;
  keterangan: string | null;
  tanggal_seleksi: string | null;
  dibuat_pada: string;
  selesai_ms: number | null;
  benar: number | null;
  total: number | null;
};
type Data = {
  ringkasan: { total: number; lulus: number; tidakLulus: number; menunggu: number };
  daftar: Row[];
};
type Pilihan = "lulus" | "tidak_lulus" | "menunggu";

const MENU = [
  { label: "Dasboard", href: "/dashboard/admin" },
  { label: "Pendaftaran", href: "/dashboard/admin/pendaftaran" },
  { label: "Verifikasi", href: "/dashboard/admin/verifikasi" },
  { label: "Soal Tes", href: "/dashboard/admin/soal" },
  { label: "Hasil Seleksi", href: "/dashboard/admin/hasil" },
];
const TAG: Record<Pilihan, { text: string; cls: string }> = {
  lulus: { text: "Lulus", cls: "diterima" },
  tidak_lulus: { text: "Tidak Lulus", cls: "belum" },
  menunggu: { text: "Menunggu", cls: "proses" },
};
const BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const PER_HAL = 10;
const p2 = (n: number) => String(n).padStart(2, "0");

const pilihanDari = (r: Row): Pilihan => r.hasil ?? "menunggu";
const noPendaftar = (r: Row) =>
  `SPMB${new Date(r.dibuat_pada).getFullYear() % 100 || 26}${String(r.id).padStart(6, "0")}`;
const nilaiNum = (r: Row) => (r.nilai === null || r.nilai === "" ? null : Number(r.nilai));
const fmtNilai = (n: number | null) => (n === null ? "-" : String(n).replace(".", ","));

// Tanggal seleksi: yang ditetapkan admin, kalau belum ada -> tanggal siswa selesai mengerjakan tes
function tanggalKey(r: Row): string | null {
  if (r.tanggal_seleksi) return r.tanggal_seleksi;
  if (r.selesai_ms) {
    const d = new Date(r.selesai_ms);
    return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  }
  return null;
}
function tampilTgl(key: string | null) {
  if (!key) return "-";
  const [y, m, d] = key.split("-").map(Number);
  return `${d} ${BLN[m - 1]} ${y}`;
}
function ketDefault(r: Row) {
  if (r.hasil === "lulus") return "Memenuhi semua kriteria";
  if (r.hasil === "tidak_lulus") return "Nilai tidak memenuhi standar";
  return r.selesai_ms ? "Menunggu keputusan panitia" : "Belum mengikuti tes seleksi";
}
const ket = (r: Row) => r.keterangan || ketDefault(r);

function Ikon({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
const I = {
  mata: "M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  pensil: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  unduh: "M12 3v12M7 10l5 5 5-5M4 20h16",
  plus: "M12 5v14M5 12h14",
};

export default function HasilSeleksiAdminPage() {
  const router = useRouter();
  const { session, logout } = useRoleGuard("admin");

  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [notif, setNotif] = useState("");

  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [fStatus, setFStatus] = useState<"" | Pilihan>("");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [hal, setHal] = useState(1);

  const [detail, setDetail] = useState<Row | null>(null);
  // form edit/tambah: target null + tambah=true -> pilih pendaftar sendiri
  const [form, setForm] = useState<{ tambah: boolean; id: number | null; hasil: Pilihan; tanggal: string; keterangan: string } | null>(null);
  const [formErr, setFormErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/hasil", { cache: "no-store" });
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
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [session, load]);

  const hasil = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return (data?.daftar ?? []).filter((r) => {
      if (kw && !(r.nama.toLowerCase().includes(kw) || r.nisn.includes(kw) || noPendaftar(r).toLowerCase().includes(kw))) return false;
      if (fStatus && pilihanDari(r) !== fStatus) return false;
      if (dari || sampai) {
        const k = tanggalKey(r);
        if (!k) return false;
        if (dari && k < dari) return false;
        if (sampai && k > sampai) return false;
      }
      return true;
    });
  }, [data, q, fStatus, dari, sampai]);

  if (!session) return null;

  const r = data?.ringkasan ?? { total: 0, lulus: 0, tidakLulus: 0, menunggu: 0 };
  const totalHal = Math.max(1, Math.ceil(hasil.length / PER_HAL));
  const halIni = Math.min(hal, totalHal);
  const mulai = (halIni - 1) * PER_HAL;
  const tampil = hasil.slice(mulai, mulai + PER_HAL);

  // nomor halaman yang ditampilkan: 1 2 3 4 5 ... 
  const nomor: (number | "...")[] = [];
  for (let i = 1; i <= totalHal; i++) {
    if (i === 1 || i === totalHal || Math.abs(i - halIni) <= 1 || (halIni <= 3 && i <= 5)) nomor.push(i);
    else if (nomor[nomor.length - 1] !== "...") nomor.push("...");
  }

  const hariIni = () => {
    const d = new Date();
    return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  };

  function bukaEdit(row: Row) {
    setForm({ tambah: false, id: row.id, hasil: pilihanDari(row), tanggal: row.tanggal_seleksi ?? tanggalKey(row) ?? hariIni(), keterangan: row.keterangan ?? "" });
    setFormErr("");
  }
  function bukaTambah() {
    const belum = (data?.daftar ?? []).filter((x) => x.hasil === null);
    setForm({ tambah: true, id: belum[0]?.id ?? null, hasil: "lulus", tanggal: hariIni(), keterangan: "" });
    setFormErr("");
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (!form.id) {
      setFormErr("Pilih pendaftar terlebih dahulu.");
      return;
    }
    setBusy(true);
    setFormErr("");
    try {
      const res = await fetch(`/api/admin/hasil/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasil: form.hasil, tanggal: form.hasil === "menunggu" ? "" : form.tanggal, keterangan: form.keterangan }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login/admin");
        return;
      }
      if (!res.ok) {
        setFormErr(json.error ?? "Gagal menyimpan.");
        return;
      }
      setForm(null);
      setDetail(null);
      setNotif("Hasil seleksi berhasil disimpan.");
      await load();
    } catch {
      setFormErr("Gagal menyimpan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const baris = [
      ["No", "Nomor Pendaftaran", "Nama Calon Murid", "NISN", "NIK", "Jurusan", "Nilai", "Status", "Tanggal Seleksi", "Keterangan"],
      ...hasil.map((x, i) => [i + 1, noPendaftar(x), x.nama, x.nisn, x.nik, x.jurusan, fmtNilai(nilaiNum(x)), TAG[pilihanDari(x)].text, tampilTgl(tanggalKey(x)), ket(x)]),
    ];
    const csv = "﻿" + baris.map((b) => b.map(esc).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `hasil-seleksi-${hariIni()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const belumDiputus = (data?.daftar ?? []).filter((x) => x.hasil === null);
  const rowForm = form?.id ? data?.daftar.find((x) => x.id === form.id) ?? null : null;

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
            const aktif = m.href === "/dashboard/admin/hasil";
            return (
              <button
                key={m.label}
                type="button"
                className={aktif ? "active" : ""}
                aria-current={aktif ? "page" : undefined}
                onClick={() => !aktif && router.push(m.href)}
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
          <form className="adm-search" onSubmit={(e) => { e.preventDefault(); setQ(qInput); setHal(1); }}>
            <SearchIcon size={30} />
            <input
              type="search"
              placeholder="Cari nama, NISN, atau nomor pendaftaran..."
              value={qInput}
              onChange={(e) => { setQInput(e.target.value); setQ(e.target.value); setHal(1); }}
              aria-label="Cari nama, NISN, atau nomor pendaftaran"
            />
            <button type="submit">SEARCH</button>
          </form>
          <div className="adm-icons">
            <BellIcon size={34} />
            <GearIcon size={34} />
          </div>
        </div>

        <div className="hs-head">
          <span className="hs-head-ico">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 2.5h8l4 4V21.5H6z" />
              <path d="M14 2.5v4h4M9 12h6M9 16h6M9 8.5h2" />
            </svg>
          </span>
          <div>
            <h1>Hasil Seleksi</h1>
            <p>Lihat data hasil seleksi calon siswa yang telah melalui proses penilaian.</p>
          </div>
        </div>

        {error && <p className="adm-banner error">{error}</p>}
        {notif && (
          <p className="adm-banner sl-notif" role="status" onClick={() => setNotif("")}>
            {notif}
          </p>
        )}

        <div className="hs-stats">
          <div className="hs-stat" style={{ background: "#ecf7cf" }}>
            <span className="hs-ico" style={{ background: "#c5ecc0", color: "#1d8a2a" }}>
              <Ikon d="M5 13l4 4L19 7" size={30} />
            </span>
            <div>
              <small>Lulus</small>
              <b>{r.lulus}</b>
              <em>dari {r.total} pendaftar</em>
            </div>
          </div>
          <div className="hs-stat" style={{ background: "#f6d9d3" }}>
            <span className="hs-ico" style={{ background: "#f9b8b0", color: "#c0392b" }}>
              <Ikon d="M6 6l12 12M18 6L6 18" size={30} />
            </span>
            <div>
              <small>Tidak Lulus</small>
              <b>{r.tidakLulus}</b>
              <em>dari {r.total} pendaftar</em>
            </div>
          </div>
          <div className="hs-stat" style={{ background: "#f2d675" }}>
            <span className="hs-ico" style={{ background: "#f7e7a4", color: "#b27800" }}>
              <Ikon d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" size={30} />
            </span>
            <div>
              <small>Menunggu</small>
              <b>{r.menunggu}</b>
              <em>dari {r.total} pendaftar</em>
            </div>
          </div>
          <div className="hs-stat" style={{ background: "#e6f4e8" }}>
            <span className="hs-ico" style={{ background: "#f59a00", color: "#fff", borderRadius: 8 }}>
              <UserIcon size={32} />
            </span>
            <div>
              <small>Total Pendaftar</small>
              <b>{r.total}</b>
              <em>seluruh pendaftar</em>
            </div>
          </div>
        </div>

        <form className="hs-filter" onSubmit={(e) => { e.preventDefault(); setHal(1); }}>
          <div className="pd-box hs-tgl">
            <span>Rentang tanggal seleksi</span>
            <div>
              <input type="date" value={dari} max={sampai || undefined} onChange={(e) => { setDari(e.target.value); setHal(1); }} aria-label="Dari tanggal" />
              <em>-</em>
              <input type="date" value={sampai} min={dari || undefined} onChange={(e) => { setSampai(e.target.value); setHal(1); }} aria-label="Sampai tanggal" />
            </div>
          </div>
          <div className="pd-box hs-sts">
            <select value={fStatus} onChange={(e) => { setFStatus(e.target.value as "" | Pilihan); setHal(1); }} aria-label="Filter status">
              <option value="">Semua Status</option>
              <option value="lulus">Lulus</option>
              <option value="tidak_lulus">Tidak Lulus</option>
              <option value="menunggu">Menunggu</option>
            </select>
          </div>
          <label className="pd-box hs-cari">
            <SearchIcon size={24} />
            <input
              type="search"
              placeholder="Cari berdasarkan nomor pendaftaran, NISN..."
              value={qInput}
              onChange={(e) => { setQInput(e.target.value); setQ(e.target.value); setHal(1); }}
              aria-label="Cari berdasarkan nomor pendaftaran atau NISN"
            />
          </label>
          <button type="submit" className="hs-cari-btn">Cari</button>
        </form>

        <div className="hs-bar">
          <h2>Data Hasil Seleksi</h2>
          <div>
            <button type="button" className="hs-btn light" onClick={exportCsv} disabled={hasil.length === 0}>
              <Ikon d={I.unduh} size={20} /> Export Data
            </button>
            <button type="button" className="hs-btn" onClick={bukaTambah} disabled={belumDiputus.length === 0} title={belumDiputus.length === 0 ? "Semua pendaftar sudah punya hasil" : undefined}>
              <Ikon d={I.plus} size={20} /> Tambah Data
            </button>
          </div>
        </div>

        <div className="pd-table-wrap hs-table">
          <table className="pd-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nomor Pendaftaran</th>
                <th>Nama Calon Murid</th>
                <th>NISN</th>
                <th>Nilai</th>
                <th>Status</th>
                <th>Tanggal Seleksi</th>
                <th>Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!data && !error && (
                <tr>
                  <td colSpan={9} className="empty">Memuat data...</td>
                </tr>
              )}
              {data && tampil.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty">
                    {data.daftar.length === 0 ? "Belum ada pendaftar." : "Tidak ada data yang cocok."}
                  </td>
                </tr>
              )}
              {tampil.map((x, i) => (
                <tr key={x.id}>
                  <td>{mulai + i + 1}</td>
                  <td>{noPendaftar(x)}</td>
                  <td className="kiri">{x.nama}</td>
                  <td>{x.nisn}</td>
                  <td>{fmtNilai(nilaiNum(x))}</td>
                  <td>
                    <span className={`pd-tag ${TAG[pilihanDari(x)].cls}`}>{TAG[pilihanDari(x)].text}</span>
                  </td>
                  <td>{tampilTgl(tanggalKey(x))}</td>
                  <td className="kiri">{ket(x)}</td>
                  <td className="hs-aksi">
                    <button type="button" className="pd-detail" onClick={() => setDetail(x)}>
                      <Ikon d={I.mata} size={16} /> Detail
                    </button>
                    <button type="button" className="pd-detail" onClick={() => bukaEdit(x)}>
                      <Ikon d={I.pensil} size={16} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="hs-foot">
          <small>
            {hasil.length === 0 ? "Menampilkan 0 data" : `Menampilkan ${mulai + 1}-${mulai + tampil.length} dari ${hasil.length} data`}
          </small>
          <div className="hs-pager">
            <button type="button" aria-label="Sebelumnya" disabled={halIni <= 1} onClick={() => setHal(halIni - 1)}>‹</button>
            {nomor.map((n, i) =>
              n === "..." ? (
                <span key={`e${i}`}>…</span>
              ) : (
                <button key={n} type="button" className={n === halIni ? "on" : ""} onClick={() => setHal(n)}>
                  {n}
                </button>
              )
            )}
            <button type="button" aria-label="Berikutnya" disabled={halIni >= totalHal} onClick={() => setHal(halIni + 1)}>›</button>
          </div>
        </div>
      </section>

      {/* ---- Detail ---- */}
      {detail && (
        <div className="modal-bg" role="presentation" onClick={() => setDetail(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Detail Hasil Seleksi</h2>
            <dl>
              <dt>No. Pendaftaran</dt>
              <dd>{noPendaftar(detail)}</dd>
              <dt>Nama</dt>
              <dd>{detail.nama}</dd>
              <dt>NISN</dt>
              <dd>{detail.nisn}</dd>
              <dt>NIK</dt>
              <dd>{detail.nik}</dd>
              <dt>Jurusan</dt>
              <dd>{detail.jurusan}</dd>
              <dt>Email akun</dt>
              <dd>{detail.email}</dd>
              <dt>Nilai tes</dt>
              <dd>
                {fmtNilai(nilaiNum(detail))}
                {detail.benar !== null && detail.total ? ` (${detail.benar} dari ${detail.total} soal benar)` : ""}
              </dd>
              <dt>Status</dt>
              <dd>
                <span className={`pd-tag ${TAG[pilihanDari(detail)].cls}`}>{TAG[pilihanDari(detail)].text}</span>
              </dd>
              <dt>Tanggal Seleksi</dt>
              <dd>{tampilTgl(tanggalKey(detail))}</dd>
              <dt>Keterangan</dt>
              <dd>{ket(detail)}</dd>
            </dl>
            <div className="sl-actions">
              <button type="button" className="lihat-btn alt" onClick={() => setDetail(null)}>
                Tutup
              </button>
              <button type="button" className="lihat-btn" onClick={() => { const d = detail; setDetail(null); bukaEdit(d); }}>
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Edit / Tambah ---- */}
      {form && (
        <div className="modal-bg" role="presentation" onClick={() => !busy && setForm(null)}>
          <form className="modal sl-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} onSubmit={simpan} noValidate>
            <h2>{form.tambah ? "Tambah Data Hasil Seleksi" : "Edit Hasil Seleksi"}</h2>

            {form.tambah ? (
              <>
                <label className="sl-lbl" htmlFor="hs-p">Pendaftar (yang belum punya hasil)</label>
                <select id="hs-p" className="vf-in" value={form.id ?? ""} onChange={(e) => setForm({ ...form, id: Number(e.target.value) || null })}>
                  {belumDiputus.map((x) => (
                    <option key={x.id} value={x.id}>
                      {noPendaftar(x)} - {x.nama} (nilai {fmtNilai(nilaiNum(x))})
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <p className="sl-del">
                {rowForm ? `${noPendaftar(rowForm)} - ${rowForm.nama}` : ""}
                {rowForm && <small> · nilai tes {fmtNilai(nilaiNum(rowForm))}</small>}
              </p>
            )}

            <label className="sl-lbl" htmlFor="hs-s">Status</label>
            <select id="hs-s" className="vf-in" value={form.hasil} onChange={(e) => setForm({ ...form, hasil: e.target.value as Pilihan })}>
              <option value="lulus">Lulus</option>
              <option value="tidak_lulus">Tidak Lulus</option>
              <option value="menunggu">Menunggu</option>
            </select>

            {form.hasil !== "menunggu" && (
              <>
                <label className="sl-lbl" htmlFor="hs-t">Tanggal Seleksi</label>
                <input id="hs-t" className="vf-in" type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
              </>
            )}

            <label className="sl-lbl" htmlFor="hs-k">Keterangan (opsional)</label>
            <input
              id="hs-k"
              className="vf-in"
              type="text"
              maxLength={255}
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              placeholder={form.hasil === "lulus" ? "Memenuhi semua kriteria" : form.hasil === "tidak_lulus" ? "Nilai tidak memenuhi standar" : "Perlu verifikasi berkas"}
            />
            {form.hasil === "lulus" && <p className="sl-sub">Status Lulus otomatis menjadikan pendaftar &ldquo;Diterima&rdquo; di halaman Pendaftaran.</p>}

            {formErr && <p className="modal-msg">{formErr}</p>}

            <div className="sl-actions">
              <button type="button" className="lihat-btn alt" disabled={busy} onClick={() => setForm(null)}>
                Batal
              </button>
              <button type="submit" className="lihat-btn" disabled={busy}>
                {busy ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
