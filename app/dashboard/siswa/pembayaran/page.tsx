"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CloudUpload, WalletIcon } from "../../../components/FormIcons";
import { UserIcon } from "../../../components/Icons";
import SiswaSidebar from "../../../components/SiswaSidebar";
import {
  BUKTI_MAX,
  METODE,
  TANGGAL_MAX,
  TANGGAL_MIN,
  cekBukti,
  cekNamaPengirim,
  cekNoPengirim,
  cekRef,
  cekTanggal,
  rupiah,
  type Metode,
} from "../../../lib/pembayaran";
import { useRoleGuard } from "../../../lib/useRoleGuard";
import "../../../styles/biodata.css";
import "../../../styles/siswa.css";

type Info = {
  biaya: number;
  jenis: string;
  biodata: { nama: string; nisn: string; jurusan: string } | null;
  lunas: boolean;
  status: "belum" | "menunggu" | "terverifikasi" | "ditolak";
  pembayaran: { metode: string; tipe: "bank" | "ewallet"; nominal: number; tanggal_bayar: string; dibuat_pada: string } | null;
};
type Form = { nama: string; no: string; ref: string; tgl: string };
type Key = keyof Form | "bukti";
type Errors = Partial<Record<Key, string>>;

function validate(m: Metode, f: Form, file: File | null): Errors {
  const e: Errors = {};
  const nama = cekNamaPengirim(f.nama);
  const no = cekNoPengirim(m.tipe, f.no);
  const ref = cekRef(f.ref);
  const tgl = cekTanggal(f.tgl);
  if (nama) e.nama = nama;
  if (no) e.no = no;
  if (ref) e.ref = ref;
  if (tgl) e.tgl = tgl;
  if (!file) e.bukti = "Bukti pembayaran wajib diunggah.";
  else {
    const b = cekBukti(file.name, file.size);
    if (b) e.bukti = b;
  }
  return e;
}

function Logo({ m }: { m: Metode }) {
  const [gagal, setGagal] = useState(false);
  if (gagal)
    return (
      <span className="pay-word" style={{ color: m.warna }}>
        {m.nama}
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/images/bank/${m.id}.png`} alt={m.nama} className="pay-logo" onError={() => setGagal(true)} />;
}

function tglIndo(iso: string) {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export default function PembayaranPage() {
  const router = useRouter();
  const { session, logout } = useRoleGuard("siswa");

  const [info, setInfo] = useState<Info | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [pilih, setPilih] = useState<Metode | null>(null);
  const [form, setForm] = useState<Form>({ nama: "", no: "", ref: "", tgl: "" });
  const [file, setFile] = useState<File | null>(null);
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session) return;
    let batal = false;
    (async () => {
      try {
        const res = await fetch("/api/pembayaran", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login/siswa");
          return;
        }
        const data = await res.json();
        if (batal) return;
        if (!res.ok) setLoadErr(data.error ?? "Gagal memuat data.");
        else setInfo(data);
      } catch {
        if (!batal) setLoadErr("Gagal memuat data. Pastikan MySQL di Laragon sudah Start.");
      }
    })();
    return () => {
      batal = true;
    };
  }, [session, router]);

  // Selama menunggu verifikasi admin, cek status tiap 8 detik
  const menunggu = info?.status === "menunggu";
  useEffect(() => {
    if (!session || !menunggu) return;
    const t = setInterval(async () => {
      try {
        const res = await fetch("/api/pembayaran", { cache: "no-store" });
        if (res.ok) setInfo(await res.json());
      } catch {
        /* coba lagi pada putaran berikutnya */
      }
    }, 8000);
    return () => clearInterval(t);
  }, [session, menunggu]);

  if (!session) return null;

  const errors = pilih ? validate(pilih, form, file) : {};
  const show = (k: Key) => (touched[k] || submitted ? errors[k] : undefined);
  const blur = (k: Key) => () => setTouched((t) => ({ ...t, [k]: true }));
  const set = (k: keyof Form, v: string) => {
    setMsg(null);
    setForm((f) => ({ ...f, [k]: v }));
  };

  function pilihMetode(m: Metode) {
    if (info?.lunas || info?.status === "menunggu" || saving) return;
    setPilih(m);
    setForm({ nama: info?.biodata?.nama ?? "", no: "", ref: "", tgl: "" });
    setFile(null);
    setTouched({});
    setSubmitted(false);
    setMsg(null);
    setCopied(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function salin(teks: string) {
    try {
      await navigator.clipboard.writeText(teks);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* abaikan kalau browser menolak */
    }
  }

  async function konfirmasi(e: React.FormEvent) {
    e.preventDefault();
    if (!pilih) return;
    setSubmitted(true);
    setMsg(null);
    if (Object.keys(errors).length > 0) {
      setMsg({ type: "error", text: "Lengkapi semua data konfirmasi dengan benar dulu ya." });
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("metode", pilih.id);
      fd.set("nama_pengirim", form.nama.trim());
      fd.set("no_pengirim", form.no.trim());
      fd.set("no_referensi", form.ref.trim());
      fd.set("tanggal", form.tgl);
      if (file) fd.set("bukti", file);

      const res = await fetch("/api/pembayaran", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login/siswa");
        return;
      }
      if (!res.ok) {
        setMsg({ type: "error", text: data.error ?? "Gagal memproses pembayaran." });
        return;
      }
      setInfo((i) =>
        i
          ? {
              ...i,
              lunas: false,
              status: "menunggu",
              pembayaran: { metode: pilih.id, tipe: pilih.tipe, nominal: i.biaya, status: "menunggu", tanggal_bayar: form.tgl, dibuat_pada: new Date().toISOString() },
            }
          : i
      );
      setPilih(null);
      setMsg({ type: "ok", text: "Konfirmasi pembayaran terkirim. Admin akan memeriksa bukti kamu, soal seleksi terbuka setelah pembayaran diverifikasi." });
    } catch {
      setMsg({ type: "error", text: "Gagal memproses pembayaran. Pastikan MySQL di Laragon sudah Start." });
    } finally {
      setSaving(false);
    }
  }

  const bank = METODE.filter((m) => m.tipe === "bank");
  const ewallet = METODE.filter((m) => m.tipe === "ewallet");
  const bayar = info?.pembayaran ? METODE.find((m) => m.id === info.pembayaran!.metode) : null;
  const isBank = pilih?.tipe === "bank";

  const daftar = (judul: string, sub: string, list: Metode[]) => (
    <div className="pay-group">
      <h3>{judul}</h3>
      <p>{sub}</p>
      {list.map((m) => (
        <label key={m.id} className={`pay-opt ${pilih?.id === m.id ? "on" : ""}`}>
          <Logo m={m} />
          <b>{m.nama}</b>
          <input
            type="radio"
            name="metode"
            checked={pilih?.id === m.id}
            onChange={() => pilihMetode(m)}
            disabled={!!info?.lunas || info?.status === "menunggu" || saving || !info?.biodata}
          />
          <span className="pay-radio" aria-hidden />
        </label>
      ))}
    </div>
  );

  return (
    <div className="bd">
      <SiswaSidebar active="pembayaran" lunas={info ? info.lunas : undefined} onLogout={logout} />

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

        <header className="bd-head pay-head">
          <WalletIcon size={104} />
          <div>
            <h1>Pembayaran Formulir</h1>
            <p>Lakukan Pembayaran di sini untuk mengikuti Tes Seleksi</p>
          </div>
        </header>

        {loadErr && <p className="bd-msg error">{loadErr}</p>}

        <div className="pay-grid">
          {/* ---- Ringkasan ---- */}
          <section className="pay-card pay-ring">
            <h2>Ringkasan Pembayaran</h2>
            <div className="pay-box">
              {!info ? (
                <p>Memuat...</p>
              ) : (
                <>
                  <p>Nama lengkap: {info.biodata?.nama ?? "-"}</p>
                  <p>NISN: {info.biodata?.nisn ?? "-"}</p>
                  <p>Jenis Pendaftaran: {info.jenis}</p>
                  <p>Jurusan: {info.biodata?.jurusan ?? "-"}</p>
                  <p>Biaya Formulir: {String(info.biaya).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</p>
                </>
              )}
            </div>
            <div className="pay-total">
              <span>Total Pembayaran</span>
              <b>{rupiah(info?.biaya ?? 0)}</b>
              {info?.lunas && <em className="pay-lunas">LUNAS</em>}
              {info?.status === "menunggu" && <em className="pay-lunas tunggu">MENUNGGU</em>}
            </div>
          </section>

          {/* ---- Pilih metode ---- */}
          <section className="pay-card pay-metode">
            <h2>Pilih Metode Pembayaran</h2>
            {info && !info.biodata ? (
              <div className="pay-warn">
                <p>Lengkapi Data Diri kamu dulu sebelum melakukan pembayaran.</p>
                <button type="button" className="pay-btn" onClick={() => router.push("/dashboard/siswa/biodata")}>
                  Isi Data Diri
                </button>
              </div>
            ) : info?.status === "menunggu" ? (
              <div className="pay-warn">
                <h3>Menunggu Verifikasi Admin</h3>
                <p>
                  Bukti pembayaran via <b>{bayar?.nama ?? info.pembayaran?.metode}</b> sudah kami terima. Halaman ini
                  diperbarui otomatis, soal seleksi terbuka begitu admin memverifikasi pembayaranmu.
                </p>
                {msg?.type === "ok" && <p className="bd-msg ok">{msg.text}</p>}
              </div>
            ) : info?.lunas && info.pembayaran ? (
              <div className="pay-done">
                <h3>Pembayaran Terverifikasi</h3>
                <p>
                  Dibayar via <b>{bayar?.nama ?? info.pembayaran.metode}</b> pada {tglIndo(info.pembayaran.tanggal_bayar)}.
                </p>
                <p>Tes seleksi sudah terbuka dan bisa dikerjakan sekarang.</p>
                <button type="button" className="pay-btn" onClick={() => router.push("/dashboard/siswa/seleksi")}>
                  Buka Soal Seleksi
                </button>
              </div>
            ) : (
              <>
                {info?.status === "ditolak" && (
                  <p className="bd-msg error">
                    Pembayaran kamu sebelumnya ditolak admin. Periksa kembali data dan bukti, lalu kirim ulang.
                  </p>
                )}
                {daftar("Transfer Bank", "Silahkan pilih metode untuk melakukan pembayaran", bank)}
                {daftar("E-Wallet", "Bayar lewat dompet digital pilihanmu", ewallet)}
              </>
            )}
          </section>

          {/* ---- Formulir konfirmasi ---- */}
          {pilih && info && !info.lunas && info.status !== "menunggu" && (
            <form className="pay-card pay-form" onSubmit={konfirmasi} noValidate>
              <h2>Formulir Konfirmasi Pembayaran</h2>
              <p className="pay-sub">
                Metode: <b>{pilih.nama}</b> ({isBank ? "Transfer Bank" : "E-Wallet"})
              </p>

              <div className="pay-tujuan">
                <small>{isBank ? `Transfer ke rekening ${pilih.nama}` : `Kirim ke ${pilih.nama}`}</small>
                <div>
                  <strong>{pilih.tujuan}</strong>
                  <button type="button" onClick={() => salin(pilih.tujuan)}>
                    {copied ? "Tersalin" : "Salin"}
                  </button>
                </div>
                <small>a.n. {pilih.atasNama}</small>
                <small>
                  Nominal tepat: <b>{rupiah(info.biaya)}</b>
                </small>
              </div>

              <div className="pay-field">
                <label htmlFor="p-nama">{isBank ? "Nama Pemilik Rekening Pengirim" : `Nama Akun ${pilih.nama} Pengirim`}</label>
                <input
                  id="p-nama"
                  type="text"
                  value={form.nama}
                  onChange={(e) => set("nama", e.target.value)}
                  onBlur={blur("nama")}
                  disabled={saving}
                  placeholder="Sesuai nama di aplikasi/rekening"
                />
                {show("nama") && <p className="bd-err">{show("nama")}</p>}
              </div>

              <div className="pay-field">
                <label htmlFor="p-no">{isBank ? `Nomor Rekening ${pilih.nama} Pengirim` : `Nomor HP ${pilih.nama} Pengirim`}</label>
                <input
                  id="p-no"
                  type="text"
                  inputMode="numeric"
                  value={form.no}
                  onChange={(e) => set("no", e.target.value.replace(/\D/g, "").slice(0, isBank ? 20 : 14))}
                  onBlur={blur("no")}
                  disabled={saving}
                  placeholder={isBank ? "Contoh: 1234567890" : "Contoh: 081234567890"}
                />
                {show("no") && <p className="bd-err">{show("no")}</p>}
              </div>

              <div className="pay-field">
                <label htmlFor="p-tgl">{isBank ? "Tanggal Transfer" : "Tanggal Pembayaran"}</label>
                <input
                  id="p-tgl"
                  type="date"
                  value={form.tgl}
                  min={TANGGAL_MIN()}
                  max={TANGGAL_MAX()}
                  onChange={(e) => set("tgl", e.target.value)}
                  onBlur={blur("tgl")}
                  disabled={saving}
                />
                {show("tgl") && <p className="bd-err">{show("tgl")}</p>}
              </div>

              <div className="pay-field">
                <label htmlFor="p-ref">{isBank ? "No. Referensi / Berita Transfer (opsional)" : "ID Transaksi (opsional)"}</label>
                <input
                  id="p-ref"
                  type="text"
                  value={form.ref}
                  onChange={(e) => set("ref", e.target.value)}
                  onBlur={blur("ref")}
                  disabled={saving}
                  maxLength={40}
                />
                {show("ref") && <p className="bd-err">{show("ref")}</p>}
              </div>

              <div className="pay-field">
                <span className="pay-lbl">{isBank ? "Bukti Transfer" : "Bukti Pembayaran"}</span>
                <label htmlFor="p-bukti" className={`bd-drop pay-drop ${show("bukti") ? "invalid" : ""}`}>
                  <CloudUpload size={44} />
                  {file ? (
                    <>
                      <strong>{file.name}</strong>
                      <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                    </>
                  ) : (
                    <>
                      <span>Pilih File Bukti (PDF/JPG/PNG)</span>
                      <small>Maks. {BUKTI_MAX / 1024 / 1024}mb</small>
                    </>
                  )}
                </label>
                <input
                  id="p-bukti"
                  ref={fileRef}
                  type="file"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  disabled={saving}
                  onChange={(e) => {
                    setMsg(null);
                    setFile(e.target.files?.[0] ?? null);
                    setTouched((t) => ({ ...t, bukti: true }));
                  }}
                />
                {show("bukti") && <p className="bd-err">{show("bukti")}</p>}
              </div>

              {msg && (
                <p className={`bd-msg ${msg.type}`} role="status">
                  {msg.text}
                </p>
              )}

              <button type="submit" className="pay-btn pay-submit" disabled={saving}>
                {saving ? "Memproses..." : "Konfirmasi Pembayaran"}
              </button>
            </form>
          )}

          {/* pesan sukses saat sudah lunas dan form disembunyikan */}
        </div>
      </main>
    </div>
  );
}
