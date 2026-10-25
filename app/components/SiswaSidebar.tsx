"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipboardChart, ClipboardList, HomeFill, LockIcon, WalletIcon } from "./FormIcons";
import { LogoutIcon, UserIcon } from "./Icons";

export type SiswaMenu = "dashboard" | "biodata" | "seleksi" | "hasil" | "pembayaran";

type Props = {
  active: SiswaMenu;
  onLogout: () => void;
  /** Kalau halaman sudah tahu status bayar, kirim di sini. Kalau tidak diisi, diambil dari server. */
  lunas?: boolean | null;
};

export default function SiswaSidebar({ active, onLogout, lunas }: Props) {
  const router = useRouter();
  const [dariServer, setDariServer] = useState<boolean | null>(null);

  useEffect(() => {
    if (lunas !== undefined) return;
    let batal = false;
    fetch("/api/pembayaran", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!batal && d) setDariServer(!!d.lunas);
      })
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, [lunas]);

  const terbuka = lunas !== undefined ? lunas : dariServer;
  const terkunci = terbuka === false;

  const item = (key: SiswaMenu, href: string, label: string, icon: React.ReactNode, extra?: React.ReactNode) => (
    <button
      type="button"
      className={`${active === key ? "active" : ""} ${key === "seleksi" && terkunci ? "terkunci" : ""}`}
      aria-current={active === key ? "page" : undefined}
      onClick={() => active !== key && router.push(href)}
    >
      {icon}
      <span>{label}</span>
      {extra}
    </button>
  );

  return (
    <aside className="bd-side tight">
      <div className="bd-logo">SPMB</div>
      <nav className="bd-nav tight">
        {item("dashboard", "/dashboard/siswa", "Dashboard", <HomeFill size={36} />)}
        {item("biodata", "/dashboard/siswa/biodata", "Biodata", <UserIcon size={30} />)}
        {item(
          "seleksi",
          "/dashboard/siswa/seleksi",
          "Seleksi",
          <ClipboardList size={38} />,
          terkunci ? <LockIcon size={30} className="bd-lock" /> : null
        )}
        {item("hasil", "/dashboard/siswa/hasil", "Hasil Seleksi", <ClipboardChart size={36} />)}
        {item("pembayaran", "/dashboard/siswa/pembayaran", "Pembayaran", <WalletIcon size={38} />)}
      </nav>
      <button type="button" className="bd-out" onClick={onLogout}>
        <LogoutIcon size={44} />
        <span>Keluar</span>
      </button>
    </aside>
  );
}
