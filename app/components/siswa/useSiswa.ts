"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type Akun = { id: number; nama: string; email: string };
export type Biodata = {
  nama_lengkap: string;
  jurusan: string;
  nik: string;
  nisn: string;
  ijazah_file: string | null;
  ijazah_nama_asli: string | null;
} | null;

export function useSiswa() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [akun, setAkun] = useState<Akun | null>(null);
  const [biodata, setBiodata] = useState<Biodata>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/siswa/me", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login/siswa");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal memuat data.");
      } else {
        setAkun(data.akun);
        setBiodata(data.biodata);
      }
    } catch {
      setError("Tidak bisa menghubungi server.");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, akun, biodata, error, reload: load };
}
