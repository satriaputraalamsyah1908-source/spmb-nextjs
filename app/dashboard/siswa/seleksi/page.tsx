"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LockIcon } from "../../../components/FormIcons";
import { UserIcon } from "../../../components/Icons";
import SiswaSidebar from "../../../components/SiswaSidebar";
import { useRoleGuard } from "../../../lib/useRoleGuard";
import "../../../styles/biodata.css";
import "../../../styles/siswa.css";

type Soal = { id: number; teks: string; opsi: string[] };
type Hasil = { nilai: number; benar: number; total: number };
type State =
  | { tipe: "muat" }
  | { tipe: "kunci"; pembayaran: string; total: number }
  | { tipe: "hasil"; hasil: Hasil }
  | { tipe: "ujian"; soal: Soal[]; durasiMs: number };

const HURUF = ["A", "B", "C", "D"];
const DURASI_DEFAULT = 120 * 60 * 1000;

const p2 = (n: number) => String(n).padStart(2, "0");
function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${p2(Math.floor(s / 3600))}:${p2(Math.floor((s % 3600) / 60))}:${p2(s % 60)}`;
}

// Soal contoh yang tampil di belakang kunci (hanya hiasan, bukan soal asli).
const CONTOH = {
  teks: "Indonesia memiliki banyak suku, budaya, dan agama. Agar keberagaman tersebut tidak menimbulkan perpecahan, sikap yang harus dilakukan adalah ...",
  opsi: ["Memaksakan budaya sendiri", "Menghindari pergaulan", "Menghargai perbedaan", "Mengutamakan kelompok sendiri"],
};

export default function SeleksiPage() {
  const router = useRouter();
  const { session, logout } = useRoleGuard("siswa");

  const [state, setState] = useState<State>({ tipe: "muat" });
  const [error, setError] = useState("");
  const [jawaban, setJawaban] = useState<Record<string, number>>({});
  const [idx, setIdx] = useState(0);
  const [sisa, setSisa] = useState(DURASI_DEFAULT);
  const [konfirm, setKonfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [warn, setWarn] = useState("");

  const endAt = useRef(0);
  const jawabanRef = useRef<Record<string, number>>({});
  const selesaiRef = useRef(false);

  // ---- Muat status/soal dari server ----
  const muat = useCallback(async () => {
    try {
      const res = await fetch("/api/ujian", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login/siswa");
        return;
      }
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "Gagal memuat soal.");
        return;
      }
      if (d.terkunci) setState({ tipe: "kunci", pembayaran: d.pembayaran ?? "belum", total: d.total ?? 50 });
      else if (d.selesai) setState({ tipe: "hasil", hasil: { nilai: d.nilai, benar: d.benar, total: d.total } });
      else {
        jawabanRef.current = d.jawaban ?? {};
        setJawaban(d.jawaban ?? {});
        endAt.current = Date.now() + d.sisaMs;
        setSisa(d.sisaMs);
        setState({ tipe: "ujian", soal: d.soal, durasiMs: d.durasiMs });
      }
    } catch {
      setError("Gagal memuat soal. Pastikan MySQL di Laragon sudah Start.");
    }
  }, [router]);

  useEffect(() => {
    if (session) muat();
  }, [session, muat]);

  // ---- Kirim jawaban ----
  async function kirim() {
    if (selesaiRef.current) return;
    selesaiRef.current = true;
    setSending(true);
    setWarn("");
    try {
      const res = await fetch("/api/ujian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jawaban: jawabanRef.current }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setWarn(d.error ?? "Gagal mengirim jawaban. Coba lagi.");
        selesaiRef.current = false;
        return;
      }
      setState({ tipe: "hasil", hasil: { nilai: d.nilai, benar: d.benar, total: d.total } });
    } catch {
      setWarn("Gagal mengirim jawaban. Periksa koneksi lalu coba lagi.");
      selesaiRef.current = false;
    } finally {
      setSending(false);
      setKonfirm(false);
    }
  }
  const kirimRef = useRef(kirim);
  useEffect(() => {
    kirimRef.current = kirim;
  });

  // ---- Hitung mundur ----
  const berjalan = state.tipe === "ujian";
  useEffect(() => {
    if (!berjalan) return;
    const t = setInterval(() => {
      const s = Math.max(0, endAt.current - Date.now());
      setSisa(s);
      if (s === 0) kirimRef.current();
    }, 500);
    return () => clearInterval(t);
  }, [berjalan]);

  if (!session) return null;

  function pilih(no: number, opsi: number) {
    const baru = { ...jawabanRef.current, [String(no)]: opsi };
    jawabanRef.current = baru;
    setJawaban(baru);
    fetch("/api/ujian", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jawaban: baru }),
    })
      .then((r) => r.json().catch(() => ({})))
      .then((d) => {
        if (d?.selesai) muat(); // waktu sudah habis di server
        else setWarn("");
      })
      .catch(() => setWarn("Jawaban belum tersimpan di server. Pastikan koneksi aktif."));
  }

  const chip = (
    <div className="bd-user sel-chip">
      <span className="bd-avatar">
        <UserIcon size={34} />
      </span>
      <div>
        <strong>{session.nama}</strong>
        <small>{session.email}</small>
      </div>
    </div>
  );

  const lunas = state.tipe === "muat" ? undefined : state.tipe !== "kunci";
  const kunci = state.tipe === "kunci";
  const ujian = state.tipe === "ujian" ? state : null;
  const soal = ujian ? ujian.soal[idx] : null;
  const total = ujian?.soal.length ?? (state.tipe === "kunci" ? state.total : 50);
  const terjawab = ujian ? ujian.soal.filter((x) => jawaban[String(x.id)] !== undefined).length : 0;
  const durasi = ujian?.durasiMs ?? DURASI_DEFAULT;

  /* ----- Hasil ----- */
  if (state.tipe === "hasil") {
    return (
      <div className="bd">
        <SiswaSidebar active="seleksi" lunas onLogout={logout} />
        <main className="bd-main">
          {chip}
          <section className="sel-result">
            <h1>Seleksi Selesai</h1>
            <p>Jawabanmu sudah tersimpan dan dinilai.</p>
            <div className="sel-score">
              <b>{String(state.hasil.nilai).replace(".", ",")}</b>
              <span>Nilai kamu</span>
            </div>
            <p className="sel-benar">
              {state.hasil.benar} dari {state.hasil.total} soal dijawab benar
            </p>
            <p className="sel-note">Peringkat dan keputusan akhir diumumkan panitia melalui menu Hasil Seleksi.</p>
            <button type="button" className="pay-btn" onClick={() => router.push("/dashboard/siswa/hasil")}>
              Lihat Hasil Seleksi
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="bd">
      <SiswaSidebar active="seleksi" lunas={lunas} onLogout={logout} />

      <main className="bd-main">
        <div className="sel-grid">
          {/* ================= kiri ================= */}
          <div className="sel-left">
            <section className="sel-head">
              <svg width="78" height="92" viewBox="0 0 24 28" fill="none" stroke="#2f7a46" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 2h11l5 5v19H4z" />
                <path d="M15 2v5h5M8 12h8M8 16h8M8 20h4" />
              </svg>
              <div>
                <h1>Seleksi Penerimaan Murid Baru(SPMB)</h1>
                <p>Kerjakan soal dengan jujur dan teliti. Waktu akan berjalan selama ujian berlangsung</p>
              </div>
            </section>

            <section className="sel-info">
              <div>
                <small>Mata Pelajaran</small>
                <b>Campuran</b>
              </div>
              <div>
                <small>Waktu Pengerjaan</small>
                <b>120 Menit</b>
              </div>
              <div>
                <small>Jumlah Soal</small>
                <b>{total} Soal</b>
              </div>
            </section>

            <section className={`sel-q ${state.tipe !== "ujian" ? "samar" : ""}`}>
              {error && <p className="bd-msg error">{error}</p>}
              <span className="sel-pill">
                Soal {ujian ? idx + 1 : 1} dari {total}
              </span>
              <p className="sel-teks">{soal ? soal.teks : CONTOH.teks}</p>
              <div className="sel-opsi">
                {(soal ? soal.opsi : CONTOH.opsi).map((o, i) => {
                  const on = soal ? jawaban[String(soal.id)] === i : i === 2;
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`sel-o ${on ? "on" : ""}`}
                      disabled={!soal}
                      onClick={() => soal && pilih(soal.id, i)}
                    >
                      <span className="sel-radio" aria-hidden />
                      <span className="sel-huruf">{HURUF[i]}</span>
                      <span className="sel-ot">{o}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {ujian && (
              <div className="sel-nav">
                {warn && <small className="sel-warn">{warn}</small>}
                <button type="button" className="sel-prev" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
                  Sebelumnya
                </button>
                {idx < total - 1 ? (
                  <button type="button" className="pay-btn sel-next" onClick={() => setIdx((i) => i + 1)}>
                    Selanjutnya <span aria-hidden>›</span>
                  </button>
                ) : (
                  <button type="button" className="pay-btn sel-next" onClick={() => setKonfirm(true)}>
                    Selesai <span aria-hidden>✓</span>
                  </button>
                )}
              </div>
            )}

            {/* ---- Kunci: belum bayar ---- */}
            {kunci && (
              <div className="sel-lock">
                <LockIcon size={300} className="sel-lock-ico" />
                <div className="sel-lock-pill">
                  {state.tipe === "kunci" && state.pembayaran === "menunggu" ? (
                    <>
                      <b>Menunggu Verifikasi</b>
                      <span>
                        Admin sedang memeriksa <Link href="/dashboard/siswa/pembayaran">Pembayaran</Link> kamu
                      </span>
                    </>
                  ) : (
                    <>
                      <b>Selesaikan Pembayaran</b>
                      <span>
                        Disini! <Link href="/dashboard/siswa/pembayaran">Pembayaran</Link>
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ================= kanan ================= */}
          <aside className="sel-right">
            {chip}
            <div className="sel-panel">
              <div className="sel-timer">
                <span className="sel-clock" aria-hidden>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="13.5" r="7.5" />
                    <path d="M12 9.5v4l2.5 1.5M9.5 2.5h5M12 2.5v3" />
                  </svg>
                </span>
                <div>
                  <small>Sisa Waktu</small>
                  <b>{fmt(ujian ? sisa : DURASI_DEFAULT)}</b>
                </div>
              </div>
              <div className="sel-bar" aria-hidden>
                <i style={{ width: `${ujian ? Math.min(100, (sisa / durasi) * 100) : 100}%` }} />
              </div>

              <h3>Daftar Soal</h3>
              <div className="sel-nomor">
                {Array.from({ length: total }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${ujian && i === idx ? "cur" : ""} ${ujian && jawaban[String(ujian.soal[i].id)] !== undefined ? "ans" : ""}`}
                    disabled={!ujian}
                    onClick={() => setIdx(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {ujian && (
                <button type="button" className="sel-finish" onClick={() => setKonfirm(true)}>
                  Kirim Jawaban ({terjawab}/{total})
                </button>
              )}
            </div>
          </aside>
        </div>

        {konfirm && ujian && (
          <div className="sel-modal-bg" role="presentation" onClick={() => !sending && setKonfirm(false)}>
            <div className="sel-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
              <h2>Kirim jawaban sekarang?</h2>
              <p>
                Kamu sudah menjawab <b>{terjawab}</b> dari <b>{total}</b> soal.
                {terjawab < total && " Soal yang kosong akan dianggap salah."} Setelah dikirim, jawaban tidak bisa diubah.
              </p>
              {warn && <p className="bd-msg error">{warn}</p>}
              <div>
                <button type="button" className="sel-prev" disabled={sending} onClick={() => setKonfirm(false)}>
                  Kembali
                </button>
                <button type="button" className="pay-btn" disabled={sending} onClick={kirim}>
                  {sending ? "Mengirim..." : "Ya, Kirim"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
