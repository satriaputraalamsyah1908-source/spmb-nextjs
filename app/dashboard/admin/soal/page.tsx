"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BellIcon, GearIcon, LogoutIcon, SearchIcon, UserIcon } from "../../../components/Icons";
import { HURUF, cekSoal } from "../../../lib/soalTes";
import { useRoleGuard } from "../../../lib/useRoleGuard";
import "../../../styles/dashboard.css";
import "../../../styles/admin.css";

type Soal = { id: number; pertanyaan: string; opsi: string[]; kunci: number };
type Form = { pertanyaan: string; opsi: string[]; kunci: number };

const MENU = [
  { label: "Dasboard", href: "/dashboard/admin" },
  { label: "Pendaftaran", href: "/dashboard/admin/pendaftaran" },
  { label: "Verifikasi", href: "/dashboard/admin/verifikasi" },
  { label: "Soal Tes", href: "/dashboard/admin/soal" },
  { label: "Hasil Seleksi", href: "/dashboard/admin/hasil" },
];
const PER_HAL = 5;
const KOSONG: Form = { pertanyaan: "", opsi: ["", "", "", ""], kunci: -1 };

export default function SoalAdminPage() {
  const router = useRouter();
  const { session, logout } = useRoleGuard("admin");

  const [daftar, setDaftar] = useState<Soal[] | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [hal, setHal] = useState(1);

  // modal tambah/ubah: editId === 0 -> tambah
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Form>(KOSONG);
  const [formErr, setFormErr] = useState("");
  const [hapus, setHapus] = useState<Soal | null>(null);
  const [busy, setBusy] = useState(false);
  const [notif, setNotif] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/soal", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login/admin");
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal memuat soal.");
        return;
      }
      setDaftar(json.daftar);
      setError("");
    } catch {
      setError("Gagal memuat soal. Pastikan project berjalan dan MySQL di Laragon sudah Start.");
    }
  }, [router]);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  const kw = q.trim().toLowerCase();
  const hasil = useMemo(
    () =>
      (daftar ?? [])
        .map((s, i) => ({ ...s, no: i + 1 }))
        .filter((s) => !kw || s.pertanyaan.toLowerCase().includes(kw) || s.opsi.some((o) => o.toLowerCase().includes(kw))),
    [daftar, kw]
  );
  const totalHal = Math.max(1, Math.ceil(hasil.length / PER_HAL));
  const halIni = Math.min(hal, totalHal);
  const tampil = hasil.slice((halIni - 1) * PER_HAL, halIni * PER_HAL);

  if (!session) return null;

  function bukaTambah() {
    setForm({ ...KOSONG, opsi: ["", "", "", ""] });
    setFormErr("");
    setEditId(0);
  }
  function bukaUbah(s: Soal) {
    setForm({ pertanyaan: s.pertanyaan, opsi: [...s.opsi], kunci: s.kunci });
    setFormErr("");
    setEditId(s.id);
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    const err = cekSoal(form);
    if (err) {
      setFormErr(err);
      return;
    }
    setBusy(true);
    setFormErr("");
    try {
      const tambah = editId === 0;
      const res = await fetch(tambah ? "/api/admin/soal" : `/api/admin/soal/${editId}`, {
        method: tambah ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login/admin");
        return;
      }
      if (!res.ok) {
        setFormErr(json.error ?? "Gagal menyimpan soal.");
        return;
      }
      setEditId(null);
      setNotif(tambah ? "Soal berhasil ditambahkan." : "Soal berhasil diubah.");
      await load();
      if (tambah) setHal(Math.ceil(((daftar?.length ?? 0) + 1) / PER_HAL)); // lompat ke halaman soal baru
    } catch {
      setFormErr("Gagal menyimpan soal. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function konfirmasiHapus() {
    if (!hapus) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/soal/${hapus.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login/admin");
        return;
      }
      if (!res.ok) {
        setNotif(json.error ?? "Gagal menghapus soal.");
      } else {
        setNotif("Soal berhasil dihapus.");
        await load();
      }
      setHapus(null);
    } catch {
      setNotif("Gagal menghapus soal. Coba lagi.");
      setHapus(null);
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
            const aktif = m.href === "/dashboard/admin/soal";
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
          <form className="adm-search" onSubmit={(e) => e.preventDefault()}>
            <SearchIcon size={30} />
            <input
              type="search"
              placeholder="Search something..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setHal(1);
              }}
              aria-label="Cari soal"
            />
            <button type="submit">SEARCH</button>
          </form>
          <div className="adm-icons">
            <BellIcon size={34} />
            <GearIcon size={34} />
          </div>
        </div>

        <div className="sl-title">
          <svg width="76" height="84" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 3.5h9l4 4V12M3 3.5v19h9M7 12h5M7 16h4M7 8h3" />
            <path d="m14 21 1-3.4 6.3-6.3 2.4 2.4-6.3 6.3z" />
          </svg>
          <h1>SOAL TES</h1>
        </div>

        {error && <p className="adm-banner error">{error}</p>}
        {notif && (
          <p className="adm-banner sl-notif" role="status" onClick={() => setNotif("")}>
            {notif}
          </p>
        )}

        <div className="sl-card">
          <div className="sl-top">
            <small>{daftar ? `${daftar.length} soal` : ""}</small>
            <button type="button" className="sl-tambah" onClick={bukaTambah}>
              <span aria-hidden>+</span> Tambah Soal
            </button>
          </div>

          <div className="sl-wrap">
            <table className="sl-table">
              <thead>
                <tr>
                  <th>NO</th>
                  <th>Pertanyaan</th>
                  <th>Pilihan Ganda</th>
                  <th>Jawaban</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {!daftar && !error && (
                  <tr>
                    <td colSpan={5} className="empty">Memuat soal...</td>
                  </tr>
                )}
                {daftar && tampil.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">
                      {kw ? "Tidak ada soal yang cocok." : "Belum ada soal. Klik Tambah Soal untuk membuat soal pertama."}
                    </td>
                  </tr>
                )}
                {tampil.map((s) => (
                  <tr key={s.id}>
                    <td className="c">{s.no}</td>
                    <td className="q">{s.pertanyaan}</td>
                    <td className="o">
                      <div>
                        {s.opsi.map((o, i) => (
                          <span key={i} className={i === s.kunci ? "benar" : ""}>
                            {HURUF[i]}. {o}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="c j">{HURUF[s.kunci]}</td>
                    <td className="a">
                      <button type="button" className="sl-ubah" onClick={() => bukaUbah(s)}>
                        Edit
                      </button>
                      <button type="button" className="sl-hapus" onClick={() => setHapus(s)}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sl-pager">
            <button type="button" aria-label="Halaman sebelumnya" disabled={halIni <= 1} onClick={() => setHal(halIni - 1)}>
              ‹
            </button>
            <span>
              {halIni}
              <small> / {totalHal}</small>
            </span>
            <button type="button" aria-label="Halaman berikutnya" disabled={halIni >= totalHal} onClick={() => setHal(halIni + 1)}>
              ›
            </button>
          </div>
        </div>
      </section>

      {/* ---- Modal tambah / ubah ---- */}
      {editId !== null && (
        <div className="modal-bg" role="presentation" onClick={() => !busy && setEditId(null)}>
          <form className="modal sl-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} onSubmit={simpan} noValidate>
            <h2>{editId === 0 ? "Tambah Soal" : "Ubah Soal"}</h2>

            <label className="sl-lbl" htmlFor="sl-q">Pertanyaan</label>
            <textarea
              id="sl-q"
              rows={4}
              value={form.pertanyaan}
              onChange={(e) => setForm((f) => ({ ...f, pertanyaan: e.target.value }))}
              placeholder="Tulis pertanyaan di sini..."
              maxLength={1000}
            />

            <p className="sl-lbl">Pilihan jawaban (pilih bulatan untuk jawaban yang benar)</p>
            {form.opsi.map((o, i) => (
              <div key={i} className={`sl-opt ${form.kunci === i ? "on" : ""}`}>
                <input
                  type="radio"
                  name="kunci"
                  checked={form.kunci === i}
                  onChange={() => setForm((f) => ({ ...f, kunci: i }))}
                  aria-label={`Jawaban benar ${HURUF[i]}`}
                />
                <b>{HURUF[i]}</b>
                <input
                  type="text"
                  value={o}
                  maxLength={255}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, opsi: f.opsi.map((x, j) => (j === i ? e.target.value : x)) }))
                  }
                  placeholder={`Pilihan ${HURUF[i]}`}
                  aria-label={`Pilihan ${HURUF[i]}`}
                />
              </div>
            ))}

            {formErr && <p className="modal-msg">{formErr}</p>}

            <div className="sl-actions">
              <button type="button" className="lihat-btn alt" disabled={busy} onClick={() => setEditId(null)}>
                Batal
              </button>
              <button type="submit" className="lihat-btn" disabled={busy}>
                {busy ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ---- Konfirmasi hapus ---- */}
      {hapus && (
        <div className="modal-bg" role="presentation" onClick={() => !busy && setHapus(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Hapus soal ini?</h2>
            <p className="sl-del">{hapus.pertanyaan}</p>
            <p className="sl-sub">
              Soal akan hilang dari tes berikutnya. Nilai siswa yang sudah selesai tidak berubah.
            </p>
            <div className="sl-actions">
              <button type="button" className="lihat-btn alt" disabled={busy} onClick={() => setHapus(null)}>
                Batal
              </button>
              <button type="button" className="lihat-btn sl-merah" disabled={busy} onClick={konfirmasiHapus}>
                {busy ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
