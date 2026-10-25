"use client";

// Kartu "Pengumuman" untuk dashboard calon siswa. Data diambil dari database
// (diisi admin lewat halaman Pendaftaran). Pasang dengan: <Pengumuman />
import { useEffect, useState } from "react";
import "../styles/pengumuman.css";

type Item = { id: number; judul: string; isi: string; penulis: string; tanggal: string };

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export function tglPanjang(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return y && m && d ? `${d} ${BULAN[m - 1]} ${y}` : ymd;
}

const Megaphone = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 10v4h3l8 4V6L6 10H3zM18 9a4 4 0 0 1 0 6M7 14l1.5 5.5h2.5L10 15" />
  </svg>
);

export default function Pengumuman({ jumlahAwal = 3 }: { jumlahAwal?: number }) {
  const [daftar, setDaftar] = useState<Item[] | null>(null);
  const [error, setError] = useState("");
  const [semua, setSemua] = useState(false);

  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const res = await fetch("/api/pengumuman", { cache: "no-store" });
        const json = await res.json();
        if (batal) return;
        if (!res.ok) setError(json.error ?? "Gagal memuat pengumuman.");
        else setDaftar(json.daftar);
      } catch {
        if (!batal) setError("Gagal memuat pengumuman.");
      }
    })();
    return () => {
      batal = true;
    };
  }, []);

  const tampil = daftar ? (semua ? daftar : daftar.slice(0, jumlahAwal)) : [];

  return (
    <section className="pg-card" aria-label="Pengumuman">
      <header className="pg-head">
        <span className="pg-ico">
          <Megaphone />
        </span>
        <h2>Pengumuman</h2>
        {daftar && daftar.length > jumlahAwal && (
          <button type="button" className="pg-semua" onClick={() => setSemua((v) => !v)}>
            {semua ? "Ringkas" : "Lihat Semua"} <span aria-hidden>{semua ? "‹" : "›"}</span>
          </button>
        )}
      </header>

      {error && <p className="pg-kosong">{error}</p>}
      {!error && !daftar && <p className="pg-kosong">Memuat pengumuman...</p>}
      {daftar && daftar.length === 0 && <p className="pg-kosong">Belum ada pengumuman.</p>}

      {tampil.map((p) => (
        <article key={p.id} className="pg-item">
          <span className="pg-item-ico">
            <Megaphone size={34} />
          </span>
          <div>
            <h3>{p.judul}</h3>
            <p>{p.isi}</p>
            <small>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3.5" y="5" width="17" height="15" rx="2" />
                <path d="M3.5 10h17M8 3v4M16 3v4" />
              </svg>
              {tglPanjang(p.tanggal)}
              <i aria-hidden>|</i>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
              </svg>
              {p.penulis}
            </small>
          </div>
        </article>
      ))}
    </section>
  );
}
