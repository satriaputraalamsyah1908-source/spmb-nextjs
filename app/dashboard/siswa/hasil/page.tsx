"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserIcon } from "../../../components/Icons";
import SiswaSidebar from "../../../components/SiswaSidebar";
import { useRoleGuard } from "../../../lib/useRoleGuard";
import "../../../styles/biodata.css";
import "../../../styles/siswa.css";

type Ujian =
  | { terkunci: true }
  | { terkunci: false; mulai: boolean; selesai: false; sisaMs?: number }
  | { terkunci: false; mulai: true; selesai: true; nilai: number; benar: number; total: number };
type Status = "terdaftar" | "terverifikasi" | "lolos";

const LABEL: Record<Status, string> = {
  terdaftar: "Belum Diterima",
  terverifikasi: "Dalam Proses",
  lolos: "Diterima",
};

export default function HasilSeleksiPage() {
  const router = useRouter();
  const { session, logout } = useRoleGuard("siswa");
  const [ujian, setUjian] = useState<Ujian | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    let batal = false;
    (async () => {
      try {
        const [u, b] = await Promise.all([
          fetch("/api/ujian?info=1", { cache: "no-store" }),
          fetch("/api/biodata", { cache: "no-store" }),
        ]);
        if (u.status === 401 || b.status === 401) {
          router.replace("/login/siswa");
          return;
        }
        const ud = await u.json();
        const bd = await b.json();
        if (batal) return;
        if (!u.ok) setError(ud.error ?? "Gagal memuat hasil.");
        else setUjian(ud);
        if (b.ok && bd.biodata) setStatus(bd.biodata.status);
      } catch {
        if (!batal) setError("Gagal memuat hasil. Pastikan MySQL di Laragon sudah Start.");
      }
    })();
    return () => {
      batal = true;
    };
  }, [session, router]);

  if (!session) return null;

  const selesai = ujian && !ujian.terkunci && ujian.selesai ? ujian : null;

  return (
    <div className="bd">
      <SiswaSidebar
        active="hasil"
        lunas={ujian ? !ujian.terkunci : undefined}
        onLogout={logout}
      />
      <main className="bd-main">
        <div className="bd-user">
          <span className="bd-avatar">
            <UserIcon size={34} />
          </span>
          <div>
            <strong>{session.nama}</strong>
            <small>{session.email}</small>
          </div>
        </div>

        <header className="bd-head">
          <div>
            <h1>Hasil Seleksi</h1>
            <p>Pantau nilai tes dan status penerimaanmu di sini</p>
          </div>
        </header>

        {error && <p className="bd-msg error">{error}</p>}

        <section className="sel-result hasil-card">
          {!ujian && !error && <p>Memuat...</p>}

          {ujian?.terkunci && (
            <>
              <h2>Tes seleksi belum terbuka</h2>
              <p>Selesaikan pembayaran formulir untuk membuka soal seleksi.</p>
              <button type="button" className="pay-btn" onClick={() => router.push("/dashboard/siswa/pembayaran")}>
                Ke Halaman Pembayaran
              </button>
            </>
          )}

          {ujian && !ujian.terkunci && !selesai && (
            <>
              <h2>{ujian.mulai ? "Tes sedang berlangsung" : "Kamu belum mengerjakan tes"}</h2>
              <p>{ujian.mulai ? "Lanjutkan dan kirim jawabanmu sebelum waktu habis." : "Soal seleksi sudah terbuka. Kerjakan sekarang."}</p>
              <button type="button" className="pay-btn" onClick={() => router.push("/dashboard/siswa/seleksi")}>
                {ujian.mulai ? "Lanjutkan Tes" : "Mulai Tes"}
              </button>
            </>
          )}

          {selesai && (
            <>
              <h2>Nilai Tes Seleksi</h2>
              <div className="sel-score">
                <b>{String(selesai.nilai).replace(".", ",")}</b>
                <span>
                  {selesai.benar} dari {selesai.total} soal benar
                </span>
              </div>
            </>
          )}

          {status && (
            <p className="sel-note">
              Status pendaftaran: <b>{LABEL[status]}</b>
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
