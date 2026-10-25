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
import { METODE, rupiah } from "../../../lib/pembayaran";
import { IJAZAH_MAX, JURUSAN, cekIjazah, cekJurusan, cekNama, cekNik, cekNisn } from "../../../lib/validasi";
import { useRoleGuard } from "../../../lib/useRoleGuard";
import "../../../styles/dashboard.css";
import "../../../styles/admin.css";

type StatusData = "terdaftar" | "terverifikasi" | "lolos";
type StatusBayar = "menunggu" | "terverifikasi" | "ditolak";
type Pendaftar = {
  id: number;
  nama: string;
  email: string;
  nik: string;
  nisn: string;
  jurusan: string;
  status: StatusData;
  nilai: string | number | null;
  ijazah_nama_asli: string;
  dibuat_pada: string;
};
type Bayar = {
  id: number;
  biodata_id: number | null;
  nama: string;
  nisn: string | null;
  nik: string | null;
  jurusan: string | null;
  email: string;
  metode: string;
  tipe: "bank" | "ewallet";
  nominal: number;
  nama_pengirim: string;
  no_pengirim: string;
  no_referensi: string | null;
  tanggal_bayar: string;
  dibuat_pada: string;
  bukti_nama_asli: string;
  status: StatusBayar;
};

const MENU = [
  { label: "Dasboard", href: "/dashboard/admin" },
  { label: "Pendaftaran", href: "/dashboard/admin/pendaftaran" },
  { label: "Verifikasi", href: "/dashboard/admin/verifikasi" },
  { label: "Soal Tes", href: "/dashboard/admin/soal" },
  { label: "Hasil Seleksi", href: "/dashboard/admin/hasil" },
];
const TAG_DATA: Record<StatusData, { text: string; cls: string }> = {
  lolos: { text: "Diterima", cls: "diterima" },
  terverifikasi: { text: "Dalam Proses", cls: "proses" },
  terdaftar: { text: "Belum Diterima", cls: "belum" },
};
const TAG_BAYAR: Record<StatusBayar, { text: string; cls: string }> = {
  menunggu: { text: "Menunggu", cls: "menunggu" },
  terverifikasi: { text: "Terverifikasi", cls: "terverifikasi" },
  ditolak: { text: "Ditolak", cls: "ditolak" },
};
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const REFRESH_MS = 10000;
const p2 = (n: number) => String(n).padStart(2, "0");

const noPendaftar = (r: Pendaftar) =>
  `SPMB${new Date(r.dibuat_pada).getFullYear() % 100 || 26}${String(r.id).padStart(6, "0")}`;
const nilaiNum = (r: Pendaftar) => (r.nilai === null || r.nilai === "" ? null : Number(r.nilai));
const fmtNilai = (n: number | null) => (n === null ? "-" : String(n).replace(".", ","));
const titik = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const mask = (s: string) => (s.length <= 4 ? "*".repeat(s.length) : "*".repeat(s.length - 4) + s.slice(-4));

function tglPanjang(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}
function tglBayar(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return y && m && d ? `${d} ${BULAN[m - 1]} ${y}` : ymd;
}
function jam(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${p2(d.getHours())}.${p2(d.getMinutes())} WIB`;
}
const namaMetode = (b: Bayar) => {
  const m = METODE.find((x) => x.id === b.metode);
  return `${b.tipe === "bank" ? "Transfer Bank" : "E-Wallet"}(${m?.nama ?? b.metode})`;
};
const adaGambar = (nama: string) => /\.(jpe?g|png)$/i.test(nama);

const ImgIcon = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1.5 14.5h13l-4-5.3-3 3.8-2-2.5zM8.5 6.8a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z" />
  </svg>
);

export default function VerifikasiAdminPage() {
  const router = useRouter();
  const { session, logout } = useRoleGuard("admin");

  const [tab, setTab] = useState<"data" | "bayar">("data");
  const [dataSiswa, setDataSiswa] = useState<{ ringkasan: { total: number; terdaftar: number; terverifikasi: number; lolos: number }; daftar: Pendaftar[] } | null>(null);
  const [dataBayar, setDataBayar] = useState<{ ringkasan: { total: number; menunggu: number; terverifikasi: number; ditolak: number }; daftar: Bayar[] } | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // edit / hapus data pendaftar
  const [edit, setEdit] = useState<{ nama: string; jurusan: string; nik: string; nisn: string } | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editErr, setEditErr] = useState("");
  const [hapusData, setHapusData] = useState(false);
  const [notif, setNotif] = useState("");

  const load = useCallback(async () => {
    try {
      const [a, b] = await Promise.all([
        fetch("/api/admin/pendaftar", { cache: "no-store" }),
        fetch("/api/admin/pembayaran", { cache: "no-store" }),
      ]);
      if (a.status === 401 || b.status === 401) {
        router.replace("/login/admin");
        return;
      }
      const [ja, jb] = await Promise.all([a.json(), b.json()]);
      if (!a.ok) setError(ja.error ?? "Gagal memuat data.");
      else if (!b.ok) setError(jb.error ?? "Gagal memuat pembayaran.");
      else {
        setDataSiswa(ja);
        setDataBayar(jb);
        setError("");
      }
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

  // Peringkat berdasarkan nilai (sama dengan halaman Pendaftaran)
  const peringkat = useMemo(() => {
    const m = new Map<number, number>();
    const arr = (dataSiswa?.daftar ?? [])
      .map((r) => ({ id: r.id, n: nilaiNum(r) }))
      .filter((x): x is { id: number; n: number } => x.n !== null)
      .sort((x, y) => y.n - x.n);
    arr.forEach((x, i) => m.set(x.id, i > 0 && arr[i - 1].n === x.n ? m.get(arr[i - 1].id)! : i + 1));
    return m;
  }, [dataSiswa]);

  const kw = q.trim().toLowerCase();
  const listData = useMemo(
    () =>
      (dataSiswa?.daftar ?? [])
        .filter((x) => !kw || x.nama.toLowerCase().includes(kw) || x.nisn.includes(kw) || noPendaftar(x).toLowerCase().includes(kw))
        .sort((x, y) => (peringkat.get(x.id) ?? Infinity) - (peringkat.get(y.id) ?? Infinity) || x.id - y.id),
    [dataSiswa, kw, peringkat]
  );
  const listBayar = useMemo(
    () =>
      (dataBayar?.daftar ?? []).filter(
        (x) => !kw || x.nama.toLowerCase().includes(kw) || (x.nisn ?? "").includes(kw) || namaMetode(x).toLowerCase().includes(kw)
      ),
    [dataBayar, kw]
  );

  if (!session) return null;

  const selData = tab === "data" ? dataSiswa?.daftar.find((x) => x.id === selId) ?? null : null;
  const selBayar = tab === "bayar" ? dataBayar?.daftar.find((x) => x.id === selId) ?? null : null;

  function ganti(t: "data" | "bayar") {
    setTab(t);
    setSelId(null);
    setMsg("");
    setNotif("");
  }

  function bukaEdit(p: Pendaftar) {
    setEdit({ nama: p.nama, jurusan: p.jurusan, nik: p.nik, nisn: p.nisn });
    setEditFile(null);
    setEditErr("");
  }

  async function simpanEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit || !selData) return;
    const err =
      cekNama(edit.nama) || cekJurusan(edit.jurusan) || cekNik(edit.nik) || cekNisn(edit.nisn) ||
      (editFile ? cekIjazah(editFile.name, editFile.size) : null);
    if (err) {
      setEditErr(err);
      return;
    }
    setBusy(true);
    setEditErr("");
    try {
      const fd = new FormData();
      fd.set("nama", edit.nama.trim());
      fd.set("jurusan", edit.jurusan);
      fd.set("nik", edit.nik);
      fd.set("nisn", edit.nisn);
      if (editFile) fd.set("ijazah", editFile);
      const res = await fetch(`/api/admin/pendaftar/${selData.id}`, { method: "PUT", body: fd });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login/admin");
        return;
      }
      if (!res.ok) {
        setEditErr(json.error ?? "Gagal menyimpan perubahan.");
        return;
      }
      setEdit(null);
      setNotif("Data pendaftar berhasil diubah.");
      await load();
    } catch {
      setEditErr("Gagal menyimpan perubahan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function hapusPendaftar() {
    if (!selData) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/pendaftar/${selData.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login/admin");
        return;
      }
      if (!res.ok) {
        setNotif(json.error ?? "Gagal menghapus data.");
      } else {
        setNotif("Data pendaftar berhasil dihapus.");
        setSelId(null);
        await load();
      }
    } catch {
      setNotif("Gagal menghapus data. Coba lagi.");
    } finally {
      setHapusData(false);
      setBusy(false);
    }
  }

  async function ubah(url: string, status: string) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(url, {
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
        setMsg(json.error ?? "Gagal menyimpan.");
        return;
      }
      await load();
    } catch {
      setMsg("Gagal menyimpan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  const rd = dataSiswa?.ringkasan ?? { total: 0, terdaftar: 0, terverifikasi: 0, lolos: 0 };
  const rb = dataBayar?.ringkasan ?? { total: 0, menunggu: 0, terverifikasi: 0, ditolak: 0 };
  const kartu =
    tab === "data"
      ? [rd.total, rd.terverifikasi, rd.terdaftar, rd.lolos]
      : [rb.total, rb.terverifikasi, rb.menunggu, rb.ditolak];
  const label =
    tab === "data"
      ? ["Pendaftar", "Terverifikasi", "Belum Terverifikasi", "Lolos Seleksi"]
      : ["Pembayaran", "Terverifikasi", "Menunggu", "Ditolak"];

  const memuat = tab === "data" ? !dataSiswa : !dataBayar;
  const kosong = tab === "data" ? listData.length === 0 : listBayar.length === 0;
  const kolom = 7;

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
            const aktif = m.href === "/dashboard/admin/verifikasi";
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
              onChange={(e) => setQ(e.target.value)}
              aria-label="Cari nama, NISN, atau nomor pendaftar"
            />
            <button type="submit">SEARCH</button>
          </form>
          <div className="vf-right">
            <div className="vf-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === "data"} className={tab === "data" ? "on" : ""} onClick={() => ganti("data")}>
                Data
              </button>
              <button type="button" role="tab" aria-selected={tab === "bayar"} className={tab === "bayar" ? "on" : ""} onClick={() => ganti("bayar")}>
                Pembayaran
                {rb.menunggu > 0 && <i className="vf-badge">{rb.menunggu}</i>}
              </button>
            </div>
            <div className="adm-icons">
              <BellIcon size={34} />
              <GearIcon size={34} />
            </div>
          </div>
        </div>

        <div className="vf-title">
          <svg width="66" height="78" viewBox="0 0 24 28" aria-hidden>
            <path d="M12 1 2 5v8c0 6.4 4.2 11.2 10 14 5.8-2.8 10-7.6 10-14V5z" fill="#0f5a14" />
            <path d="m7.5 13.5 3.3 3.3 6-6.3" fill="none" stroke="#6cff3a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <h1>VERIFIKASI</h1>
            <p>PERIKSA DAN VERIFIKASI DATA YANG MASUK KE SISTEM</p>
          </div>
        </div>

        {error && <p className="adm-banner error">{error}</p>}
        {notif && (
          <p className="adm-banner sl-notif" role="status" onClick={() => setNotif("")}>
            {notif}
          </p>
        )}

        <div className="adm-stats pd-stats vf-stats">
          <div className="stat" style={{ background: "#e6f4e8" }}>
            <span className="stat-icon" style={{ background: "#f59a00", color: "#fff", borderRadius: 4 }}>
              <UserIcon size={52} />
            </span>
            <b>{kartu[0]}</b>
            <span>{label[0]}</span>
          </div>
          <div className="stat" style={{ background: "#ecf7cf" }}>
            <span className="stat-icon" style={{ color: "#7bc418" }}>
              <CheckCircleIcon size={64} />
            </span>
            <b>{kartu[1]}</b>
            <span>{label[1]}</span>
          </div>
          <div className="stat" style={{ background: "#eedfcf" }}>
            <span className="stat-icon" style={{ color: "#2a7de1" }}>
              <FileIcon size={64} />
            </span>
            <b>{kartu[2]}</b>
            <span>{label[2]}</span>
          </div>
          <div className="stat" style={{ background: "#f2d675" }}>
            <span className="stat-icon" style={{ color: "#c98a2a" }}>
              <ClockIcon size={64} />
            </span>
            <b>{kartu[3]}</b>
            <span>{label[3]}</span>
          </div>
        </div>

        <div className="pd-table-wrap vf-table">
          <table className="pd-table">
            <thead>
              {tab === "data" ? (
                <tr>
                  <th>NO</th>
                  <th>Nomor Pendaftar</th>
                  <th>Nama Calon Murid</th>
                  <th>Nilai</th>
                  <th>Peringkat</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              ) : (
                <tr>
                  <th>NO</th>
                  <th>Nama Calon Murid</th>
                  <th>Metode Pembayaran</th>
                  <th>Jumlah</th>
                  <th>Bukti</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              )}
            </thead>
            <tbody>
              {memuat && !error && (
                <tr>
                  <td colSpan={kolom} className="empty">Memuat data...</td>
                </tr>
              )}
              {!memuat && kosong && (
                <tr>
                  <td colSpan={kolom} className="empty">
                    {kw ? "Tidak ada data yang cocok." : tab === "data" ? "Belum ada pendaftar." : "Belum ada pembayaran masuk."}
                  </td>
                </tr>
              )}

              {tab === "data" &&
                listData.map((x, i) => (
                  <tr key={x.id} className={selId === x.id ? "sel" : ""}>
                    <td>{i + 1}.</td>
                    <td>{noPendaftar(x)}</td>
                    <td>{x.nama}</td>
                    <td>{fmtNilai(nilaiNum(x))}</td>
                    <td>{peringkat.get(x.id) ?? "-"}</td>
                    <td>
                      <span className={`pd-tag ${TAG_DATA[x.status].cls}`}>{TAG_DATA[x.status].text}</span>
                    </td>
                    <td>
                      <button type="button" className="pd-detail" onClick={() => { setMsg(""); setSelId(x.id); }}>
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}

              {tab === "bayar" &&
                listBayar.map((x, i) => (
                  <tr key={x.id} className={selId === x.id ? "sel" : ""}>
                    <td>{i + 1}.</td>
                    <td>{x.nama}</td>
                    <td>{namaMetode(x)}</td>
                    <td>{titik(x.nominal)}</td>
                    <td className={`vf-bukti ${x.status}`}>
                      <ImgIcon />
                    </td>
                    <td>
                      <span className={`pd-tag ${TAG_BAYAR[x.status].cls}`}>{TAG_BAYAR[x.status].text}</span>
                    </td>
                    <td>
                      <button type="button" className="pd-detail" onClick={() => { setMsg(""); setSelId(x.id); }}>
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ================= Panel detail DATA ================= */}
      {selData && (
        <aside className="vf-panel" aria-label="Detail data pendaftar">
          <button type="button" className="vf-x" onClick={() => setSelId(null)} aria-label="Tutup">
            X
          </button>
          <div className="vf-who">
            <span className="vf-ava">
              <UserIcon size={64} />
            </span>
            <div>
              <h2>{selData.nama}</h2>
              <p>NISN:{selData.nisn}</p>
              <p>Tanggal Daftar: {tglPanjang(selData.dibuat_pada)}</p>
            </div>
          </div>

          <div className="vf-sec">
            <h3>
              <UserIcon size={30} /> Informasi pribadi
            </h3>
            <dl>
              <dt>Nama Lengkap</dt>
              <dd>{selData.nama}</dd>
              <dt>NIK</dt>
              <dd>{selData.nik}</dd>
              <dt>NISN</dt>
              <dd>{selData.nisn}</dd>
              <dt>Jurusan</dt>
              <dd>{selData.jurusan}</dd>
              <dt>Email akun</dt>
              <dd>{selData.email}</dd>
              <dt>Nomor Pendaftar</dt>
              <dd>{noPendaftar(selData)}</dd>
            </dl>
          </div>

          <div className="vf-sec">
            <a className="vf-doc" href={`/api/admin/ijazah/${selData.id}`} target="_blank" rel="noreferrer">
              <FileIcon size={34} />
              <span>
                <b>Ijazah / Surat Keterangan Lulus</b>
                <small>File Terunggah: {selData.ijazah_nama_asli}</small>
              </span>
              <i className="vf-ok" aria-hidden>✓</i>
            </a>
          </div>

          <div className="vf-sec">
            <h3>Kelola Data</h3>
            <div className="vf-row">
              <button type="button" className="vf-btn blue" disabled={busy} onClick={() => bukaEdit(selData)}>
                Edit Data
              </button>
              <button type="button" className="vf-btn no" disabled={busy} onClick={() => setHapusData(true)}>
                Hapus Data
              </button>
            </div>
          </div>

          <div className="vf-sec">
            <h3>Status</h3>
            <p>
              <span className={`pd-tag ${TAG_DATA[selData.status].cls}`}>{TAG_DATA[selData.status].text}</span>
            </p>
            {msg && <p className="vf-msg">{msg}</p>}
            <div className="vf-actions">
              {selData.status === "terdaftar" && (
                <button type="button" className="vf-btn ok" disabled={busy} onClick={() => ubah(`/api/admin/pendaftar/${selData.id}`, "terverifikasi")}>
                  Verifikasi Data
                </button>
              )}
              {selData.status === "terverifikasi" && (
                <>
                  <button type="button" className="vf-btn ok" disabled={busy} onClick={() => ubah(`/api/admin/pendaftar/${selData.id}`, "lolos")}>
                    Loloskan Seleksi
                  </button>
                  <button type="button" className="vf-btn no" disabled={busy} onClick={() => ubah(`/api/admin/pendaftar/${selData.id}`, "terdaftar")}>
                    Batalkan Verifikasi
                  </button>
                </>
              )}
              {selData.status === "lolos" && (
                <button type="button" className="vf-btn no" disabled={busy} onClick={() => ubah(`/api/admin/pendaftar/${selData.id}`, "terverifikasi")}>
                  Batalkan Kelulusan
                </button>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ---- Modal edit data ---- */}
      {edit && selData && (
        <div className="modal-bg" role="presentation" onClick={() => !busy && setEdit(null)}>
          <form className="modal sl-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} onSubmit={simpanEdit} noValidate>
            <h2>Edit Data Pendaftar</h2>
            <p className="sl-sub">Status pendaftaran tidak berubah setelah data diedit.</p>

            <label className="sl-lbl" htmlFor="ed-nama">Nama Lengkap</label>
            <input id="ed-nama" className="vf-in" type="text" value={edit.nama} onChange={(e) => setEdit({ ...edit, nama: e.target.value })} />

            <label className="sl-lbl" htmlFor="ed-jur">Jurusan</label>
            <select id="ed-jur" className="vf-in" value={edit.jurusan} onChange={(e) => setEdit({ ...edit, jurusan: e.target.value })}>
              <option value="">Pilih jurusan</option>
              {JURUSAN.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>

            <label className="sl-lbl" htmlFor="ed-nik">NIK (16 digit)</label>
            <input id="ed-nik" className="vf-in" type="text" inputMode="numeric" value={edit.nik} onChange={(e) => setEdit({ ...edit, nik: e.target.value.replace(/\D/g, "").slice(0, 16) })} />

            <label className="sl-lbl" htmlFor="ed-nisn">NISN (10 digit)</label>
            <input id="ed-nisn" className="vf-in" type="text" inputMode="numeric" value={edit.nisn} onChange={(e) => setEdit({ ...edit, nisn: e.target.value.replace(/\D/g, "").slice(0, 10) })} />

            <label className="sl-lbl" htmlFor="ed-file">Ganti Ijazah / SKL (opsional)</label>
            <input
              id="ed-file"
              className="vf-in"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(e) => setEditFile(e.target.files?.[0] ?? null)}
            />
            <p className="sl-sub">
              File sekarang: {selData.ijazah_nama_asli}. Kosongkan kalau tidak diganti (maks. {IJAZAH_MAX / 1024 / 1024}mb).
            </p>

            {editErr && <p className="modal-msg">{editErr}</p>}

            <div className="sl-actions">
              <button
                type="button"
                className="lihat-btn sl-merah"
                disabled={busy}
                onClick={() => {
                  setEdit(null);
                  setHapusData(true);
                }}
              >
                Hapus Data
              </button>
              <button type="button" className="lihat-btn alt" disabled={busy} onClick={() => setEdit(null)}>
                Batal
              </button>
              <button type="submit" className="lihat-btn" disabled={busy}>
                {busy ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---- Konfirmasi hapus data ---- */}
      {hapusData && selData && (
        <div className="modal-bg" role="presentation" onClick={() => !busy && setHapusData(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Hapus data pendaftar?</h2>
            <p className="sl-del">{selData.nama} ({noPendaftar(selData)})</p>
            <p className="sl-sub">
              Data diri, nilai, dan file ijazah akan dihapus. Akun siswa tetap ada, jadi siswa bisa mengisi Data Diri lagi.
            </p>
            <div className="sl-actions">
              <button type="button" className="lihat-btn alt" disabled={busy} onClick={() => setHapusData(false)}>
                Batal
              </button>
              <button type="button" className="lihat-btn sl-merah" disabled={busy} onClick={hapusPendaftar}>
                {busy ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= Panel detail PEMBAYARAN ================= */}
      {selBayar && (
        <aside className="vf-panel" aria-label="Detail pembayaran">
          <button type="button" className="vf-x" onClick={() => setSelId(null)} aria-label="Tutup">
            X
          </button>
          <div className="vf-who small">
            <span className="vf-ava">
              <UserIcon size={48} />
            </span>
            <div>
              <h2>{selBayar.nama}</h2>
              <p>NISN:{selBayar.nisn ?? "-"}</p>
            </div>
          </div>

          <div className="vf-sec">
            <h3>Informasi pribadi</h3>
            <dl>
              <dt>Nama Lengkap</dt>
              <dd>{selBayar.nama}</dd>
              <dt>NISN</dt>
              <dd>{selBayar.nisn ?? "-"}</dd>
              <dt>Jurusan</dt>
              <dd>{selBayar.jurusan ?? "-"}</dd>
              <dt>Email akun</dt>
              <dd>{selBayar.email}</dd>
            </dl>
          </div>

          <div className="vf-sec">
            <h3>Detail Pembayaran</h3>
            <dl>
              <dt>Metode Pembayaran</dt>
              <dd>{namaMetode(selBayar)}</dd>
              <dt>Nama Pengirim</dt>
              <dd>{selBayar.nama_pengirim}</dd>
              <dt>{selBayar.tipe === "bank" ? "Nomor Rekening" : "Nomor HP"}</dt>
              <dd>{mask(selBayar.no_pengirim)}</dd>
              <dt>Jumlah</dt>
              <dd>{rupiah(selBayar.nominal)}</dd>
              <dt>Tanggal Pembayaran</dt>
              <dd>{tglBayar(selBayar.tanggal_bayar)}</dd>
              <dt>Dikirim</dt>
              <dd>
                {tglPanjang(selBayar.dibuat_pada)}; {jam(selBayar.dibuat_pada)}
              </dd>
              <dt>Nomor Transaksi</dt>
              <dd>{selBayar.no_referensi || "-"}</dd>
            </dl>
          </div>

          <div className="vf-sec">
            <h3>Bukti Pembayaran</h3>
            <div className="vf-bukti-box">
              {adaGambar(selBayar.bukti_nama_asli) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/admin/bukti/${selBayar.id}`} alt="Bukti pembayaran" />
              ) : (
                <span className="vf-pdf">
                  <FileIcon size={56} />
                  <small>PDF</small>
                </span>
              )}
              <a className="vf-lihat" href={`/api/admin/bukti/${selBayar.id}`} target="_blank" rel="noreferrer">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Lihat Gambar
              </a>
            </div>
          </div>

          <div className="vf-sec">
            <h3>Status</h3>
            <p>
              <span className={`pd-tag ${TAG_BAYAR[selBayar.status].cls}`}>{TAG_BAYAR[selBayar.status].text}</span>
            </p>
            {msg && <p className="vf-msg">{msg}</p>}
            {selBayar.status === "terverifikasi" && (
              <p className="vf-info">Siswa ini sudah bisa mengikuti seleksi.</p>
            )}
            <div className="vf-actions">
              {selBayar.status !== "terverifikasi" && (
                <button type="button" className="vf-btn ok big" disabled={busy} onClick={() => ubah(`/api/admin/pembayaran/${selBayar.id}`, "terverifikasi")}>
                  <span aria-hidden>✔</span> Verifikasi Pembayaran
                </button>
              )}
              {selBayar.status === "menunggu" && (
                <button type="button" className="vf-btn no big" disabled={busy} onClick={() => ubah(`/api/admin/pembayaran/${selBayar.id}`, "ditolak")}>
                  <span aria-hidden>✖</span> Tolak Pembayaran
                </button>
              )}
              {selBayar.status === "terverifikasi" && (
                <button type="button" className="vf-btn no big" disabled={busy} onClick={() => ubah(`/api/admin/pembayaran/${selBayar.id}`, "menunggu")}>
                  Batalkan Verifikasi
                </button>
              )}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
