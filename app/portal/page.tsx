import Image from "next/image";
import Link from "next/link";
import "../styles/auth.css";

const ROLES = [
  {
    key: "admin",
    label: "ADMIN",
    href: "/login/admin",
    icon: "/icons/admin.svg",
  },
  {
    key: "siswa",
    label: "CALON SISWA",
    href: "/login/siswa",
    icon: "/icons/siswa.svg",
  },
  {
    key: "kepsek",
    label: "KEPALA SEKOLAH",
    href: "/login/kepsek",
    icon: "/icons/kepsek.svg",
  },
];

export default function PortalPage() {
  return (
    <main className="portal-page">
      <Image
        src="/images/logo.png"
        alt="Logo SMA Citra Negara"
        width={90}
        height={90}
        className="portal-logo"
        unoptimized
      />

      <header className="portal-head">
        <h2 className="portal-kicker">PORTAL MASUK</h2>
        <h1 className="portal-title">SPMB</h1>
        <p className="portal-sub">Sistem Penerimaan Siswa Baru</p>
        <div className="portal-pill">Masuk Sebagai:</div>
      </header>

      <section className="portal-cards">
        {ROLES.map((r) => (
          <div key={r.key} className={`role-card role-${r.key}`}>
            <Image src={r.icon} alt="" width={120} height={120} unoptimized />
            <h3>{r.label}</h3>
            <Link href={r.href} className="role-btn">
              <span>MASUK</span>
              <Image src="/icons/chevron-dark.svg" alt="" width={26} height={26} unoptimized />
            </Link>
          </div>
        ))}
      </section>
    </main>
  );
}
