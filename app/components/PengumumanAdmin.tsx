"use client";

// Kelola pengumuman (tambah / edit / hapus) untuk admin - dipasang di halaman Pendaftaran.
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cekPengumuman } from "../lib/pengumuman";
import { tglPanjang } from "./Pengumuman";
import "../styles/pengumuman.css";

type Item = { id: number; judul: string; isi: string; penulis: string; tanggal: string };
type Form = { id: number | null; judul: string; isi: string; tanggal: string };

const hariIni = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function PengumumanAdmin() {
  const router = useRouter();
  const [daftar, setDaftar] = useState<Item[] | null>(null);
  const [error, setError] = useState("");
  const [notif, setNotif] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [formErr, setFormErr] = useState("");
  const [hapus, setHapus] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pengumuman", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login/admin");
        return;
      }
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Gagal memuat pengumuman.");
      else {
        setDaftar(json.daftar);
        setError("");
      }
    } catch {
      setError("Gagal memuat pengumuman.");
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const err = cekPengumuman(form);
    if (err) {
      setFormErr(err);
      return;
    }
    setBusy(true);
    setFormErr("");
    try {
      const baru = form.id === null;
      const res = await fetch(baru ? "/api/admin/pengumuman" : `/api/admin/pengumuman/${form.id}`, {
        method: baru ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul: form.judul, isi: form.isi, tanggal: form.tanggal }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login/admin");
        return;
      }
      if (!res.ok) {
        setFormErr(json.error ?? "Gagal menyimpan pengumuman.");
        return;
      }
      setForm(null);
      setNotif(baru ? "Pengumuman berhasil ditambahkan. Calon siswa langsung bisa melihatnya." : "Pengumuman berhasil diubah.");
      await load();
    } catch {
      setFormErr("Gagal menyimpan pengumuman. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function konfirmasiHapus() {
    if (!hapus) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/pengumuman/${hapus.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login/admin");
        return;
      }
      setNotif(res.ok ? "Pengumuman berhasil dihapus." : json.error ?? "Gagal menghapus pengumuman.");
      if (res.ok) await load();
    } catch {
      setNotif("Gagal menghapus pengumuman. Coba lagi.");
    } finally {
      setHapus(null);
      setBusy(false);
    }
  }

  return (
    <section className="pga" aria-label="Kelola pengumuman">
      <header className="pga-head">
        <div>
          <h2>Pengumuman</h2>
          <p>Pengumuman yang kamu buat tampil di dashboard calon siswa.</p>
        </div>
        <button type="button" className="pga-tambah" onClick={() => { setForm({ id: null, judul: "", isi: "", tanggal: hariIni() }); setFormErr(""); }}>
          <span aria-hidden>+</span> Tambah Pengumuman
        </button>
      </header>

      {error && <p className="pga-msg err">{error}</p>}
      {notif && (
        <p className="pga-msg ok" role="status" onClick={() => setNotif("")}>
          {notif}
        </p>
      )}
      {!error && !daftar && <p className="pga-kosong">Memuat pengumuman...</p>}
      {daftar && daftar.length === 0 && <p className="pga-kosong">Belum ada pengumuman. Klik Tambah Pengumuman untuk membuat yang pertama.</p>}

      <div className="pga-list">
        {(daftar ?? []).map((p) => (
          <article key={p.id} className="pga-item">
            <div>
              <h3>{p.judul}</h3>
              <p>{p.isi}</p>
              <small>
                {tglPanjang(p.tanggal)} | {p.penulis}
              </small>
            </div>
            <div className="pga-aksi">
              <button type="button" className="pga-edit" onClick={() => { setForm({ id: p.id, judul: p.judul, isi: p.isi, tanggal: p.tanggal }); setFormErr(""); }}>
                Edit
              </button>
              <button type="button" className="pga-hapus" onClick={() => setHapus(p)}>
                Hapus
              </button>
            </div>
          </article>
        ))}
      </div>

      {form && (
        <div className="modal-bg" role="presentation" onClick={() => !busy && setForm(null)}>
          <form className="modal sl-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} onSubmit={simpan} noValidate>
            <h2>{form.id === null ? "Tambah Pengumuman" : "Edit Pengumuman"}</h2>

            <label className="sl-lbl" htmlFor="pg-j">Judul</label>
            <input id="pg-j" className="vf-in" type="text" maxLength={150} value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} placeholder="Contoh: Jadwal Seleksi Tahap 1 Telah Diumumkan" />

            <label className="sl-lbl" htmlFor="pg-i">Isi pengumuman</label>
            <textarea id="pg-i" className="vf-in" rows={5} maxLength={2000} value={form.isi} onChange={(e) => setForm({ ...form, isi: e.target.value })} placeholder="Tulis isi pengumuman di sini..." />

            <label className="sl-lbl" htmlFor="pg-t">Tanggal</label>
            <input id="pg-t" className="vf-in" type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />

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

      {hapus && (
        <div className="modal-bg" role="presentation" onClick={() => !busy && setHapus(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Hapus pengumuman ini?</h2>
            <p className="sl-del">{hapus.judul}</p>
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
    </section>
  );
}
