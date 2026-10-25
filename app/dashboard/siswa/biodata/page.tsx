"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  CloudUpload,
  DiamondGrid,
  GradCap,
  HouseUser,
  IdCard,
  PersonFill,
  SaveIcon,
} from "../../../components/FormIcons";
import { UserIcon } from "../../../components/Icons";
import SiswaSidebar from "../../../components/SiswaSidebar";
import { useRoleGuard } from "../../../lib/useRoleGuard";
import {
  IJAZAH_MAX,
  JURUSAN,
  cekIjazah,
  cekJurusan,
  cekNama,
  cekNik,
  cekNisn,
} from "../../../lib/validasi";
import "../../../styles/biodata.css";
import "../../../styles/siswa.css";

type Form = { nama: string; jurusan: string; nik: string; nisn: string };
type Key = keyof Form | "ijazah";
type Errors = Partial<Record<Key, string>>;

function validate(f: Form, file: File | null, adaFileTersimpan: boolean): Errors {
  const e: Errors = {};
  const nama = cekNama(f.nama);
  const jurusan = cekJurusan(f.jurusan);
  const nik = cekNik(f.nik);
  const nisn = cekNisn(f.nisn);
  if (nama) e.nama = nama;
  if (jurusan) e.jurusan = jurusan;
  if (nik) e.nik = nik;
  if (nisn) e.nisn = nisn;

  if (file) {
    const i = cekIjazah(file.name, file.size);
    if (i) e.ijazah = i;
  } else if (!adaFileTersimpan) {
    e.ijazah = "Ijazah/Surat Keterangan Lulus wajib diunggah.";
  }
  return e;
}

function Field({
  id,
  label,
  icon,
  error,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bd-group">
      <label htmlFor={id} className="bd-label">
        {label}
      </label>
      <div className={`bd-field ${error ? "invalid" : ""}`}>
        <span className="bd-ficon">{icon}</span>
        {children}
      </div>
      {error && <p className="bd-err">{error}</p>}
    </div>
  );
}

export default function DataDiriPage() {
  const router = useRouter();
  const { session, logout } = useRoleGuard("siswa");

  const [form, setForm] = useState<Form>({ nama: "", jurusan: "", nik: "", nisn: "" });
  const [file, setFile] = useState<File | null>(null);
  const [savedFile, setSavedFile] = useState<string | null>(null);
  const [editing, setEditing] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [drag, setDrag] = useState(false);

  // Ambil data yang sudah pernah disimpan dari database
  useEffect(() => {
    if (!session) return;
    let batal = false;
    (async () => {
      try {
        const res = await fetch("/api/biodata", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login/siswa");
          return;
        }
        const data = await res.json();
        if (batal) return;
        if (!res.ok) {
          setMsg({ type: "error", text: data.error ?? "Gagal memuat data." });
        } else if (data.biodata) {
          setForm({
            nama: data.biodata.nama,
            jurusan: data.biodata.jurusan,
            nik: data.biodata.nik,
            nisn: data.biodata.nisn,
          });
          setSavedFile(data.biodata.ijazah_nama_asli);
          setEditing(false);
        } else {
          setForm((f) => ({ ...f, nama: data.akun.nama }));
        }
      } catch {
        if (!batal)
          setMsg({
            type: "error",
            text: "Gagal memuat data. Pastikan MySQL di Laragon sudah Start.",
          });
      } finally {
        if (!batal) setLoaded(true);
      }
    })();
    return () => {
      batal = true;
    };
  }, [session, router]);

  if (!session) return null;

  const errors = validate(form, file, !!savedFile);
  const show = (k: Key) => (touched[k] || submitted ? errors[k] : undefined);
  const blur = (k: Key) => () => setTouched((t) => ({ ...t, [k]: true }));
  const set = (k: keyof Form, v: string) => {
    setMsg(null);
    setForm((f) => ({ ...f, [k]: v }));
  };

  function pilihFile(f: File | null) {
    setMsg(null);
    setFile(f);
    setTouched((t) => ({ ...t, ijazah: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setMsg(null);
    if (Object.keys(errors).length > 0) {
      setMsg({ type: "error", text: "Lengkapi semua data dengan benar dulu ya." });
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.set("nama", form.nama.trim());
      fd.set("jurusan", form.jurusan);
      fd.set("nik", form.nik);
      fd.set("nisn", form.nisn);
      if (file) fd.set("ijazah", file);

      const res = await fetch("/api/biodata", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace("/login/siswa");
        return;
      }
      if (!res.ok) {
        setMsg({ type: "error", text: data.error ?? "Gagal menyimpan data." });
        return;
      }
      setSavedFile(data.ijazah_nama_asli);
      setFile(null);
      setEditing(false);
      setSubmitted(false);
      setTouched({});
      setMsg({ type: "ok", text: "Data berhasil disimpan. Mengalihkan ke dashboard..." });
      // Setelah berhasil simpan, langsung masuk ke dashboard siswa
      setTimeout(() => router.push("/dashboard/siswa"), 1200);
    } catch {
      setMsg({
        type: "error",
        text: "Gagal menyimpan. Pastikan MySQL di Laragon sudah Start.",
      });
    } finally {
      setSaving(false);
    }
  }

  const disabled = !editing || saving;

  return (
    <div className="bd">
      <SiswaSidebar active="biodata" onLogout={logout} />

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
          <HouseUser size={110} />
          <div>
            <h1>Data Diri</h1>
            <p>Lengkapi data diri Anda dengan benar dan sesuai dokumen yang dimiliki</p>
          </div>
        </header>

        <form className="bd-card" onSubmit={handleSubmit} noValidate>
          <div className="bd-card-head">
            <span className="bd-badge">
              <PersonFill size={44} />
            </span>
            <div>
              <h2>Informasi Pribadi</h2>
              <p>Masukan data sesuai dokumen resmi</p>
            </div>
            <button
              type="button"
              className="bd-edit"
              onClick={() => {
                setEditing(true);
                setMsg(null);
              }}
              disabled={editing || !loaded}
            >
              EDIT
            </button>
          </div>

          <Field id="nama" label="Nama Lengkap" icon={<PersonFill size={50} />} error={show("nama")}>
            <input
              id="nama"
              type="text"
              placeholder="Contoh: Satria putra"
              value={form.nama}
              onChange={(e) => set("nama", e.target.value)}
              onBlur={blur("nama")}
              disabled={disabled}
              autoComplete="name"
            />
          </Field>

          <Field id="jurusan" label="Pilih Jurusan" icon={<DiamondGrid size={46} />} error={show("jurusan")}>
            <select
              id="jurusan"
              value={form.jurusan}
              onChange={(e) => set("jurusan", e.target.value)}
              onBlur={blur("jurusan")}
              disabled={disabled}
              className={form.jurusan ? "" : "kosong"}
            >
              <option value="">Pilih jurusan</option>
              {JURUSAN.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
            <span className="bd-chev">
              <ChevronDown size={44} />
            </span>
          </Field>

          <Field id="nik" label="NIK" icon={<IdCard size={50} />} error={show("nik")}>
            <input
              id="nik"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 3201234567890001 (16 digit)"
              value={form.nik}
              onChange={(e) => set("nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
              onBlur={blur("nik")}
              disabled={disabled}
            />
          </Field>

          <Field id="nisn" label="NISN" icon={<GradCap size={50} />} error={show("nisn")}>
            <input
              id="nisn"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 1234567890 (10 digit)"
              value={form.nisn}
              onChange={(e) => set("nisn", e.target.value.replace(/\D/g, "").slice(0, 10))}
              onBlur={blur("nisn")}
              disabled={disabled}
            />
          </Field>

          <div className="bd-group">
            <span className="bd-label">Ijazah/Surat Keterangan Lulus</span>
            <label
              htmlFor="ijazah"
              className={`bd-drop ${drag ? "drag" : ""} ${show("ijazah") ? "invalid" : ""} ${
                disabled ? "off" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                if (!disabled) setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                if (!disabled && e.dataTransfer.files[0]) pilihFile(e.dataTransfer.files[0]);
              }}
            >
              <CloudUpload size={62} />
              {file ? (
                <>
                  <strong>{file.name}</strong>
                  <small>{(file.size / 1024 / 1024).toFixed(2)} MB — siap disimpan</small>
                </>
              ) : savedFile ? (
                <>
                  <strong>Tersimpan: {savedFile}</strong>
                  <small>{editing ? "Klik untuk mengganti file" : "Klik EDIT untuk mengganti file"}</small>
                </>
              ) : (
                <>
                  <span>Pilih File Ijazah (PDF/JPG/PNG)</span>
                  <small>Maks . {IJAZAH_MAX / 1024 / 1024}mb</small>
                </>
              )}
            </label>
            <input
              id="ijazah"
              type="file"
              className="sr-only"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              disabled={disabled}
              onChange={(e) => pilihFile(e.target.files?.[0] ?? null)}
            />
            {show("ijazah") && <p className="bd-err">{show("ijazah")}</p>}
          </div>

          {msg && (
            <p className={`bd-msg ${msg.type}`} role="status">
              {msg.text}
            </p>
          )}

          <button type="submit" className="bd-save" disabled={disabled}>
            <SaveIcon size={44} />
            <span>{saving ? "Menyimpan..." : "Simpan"}</span>
          </button>
        </form>
      </main>
    </div>
  );
}
