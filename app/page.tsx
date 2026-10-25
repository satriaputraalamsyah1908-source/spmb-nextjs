import Image from "next/image";
import Link from "next/link";

// Gambar & ikon dipisah: /public/images dan /public/icons
const IMAGES = {
  background: "/images/bacgorund.png",
  logo: "/images/logo.png",
};

const MENU = [
  { label: "HOME", href: "/", icon: "/icons/home.svg", active: true },
  { label: "INFORMASI", href: "/informasi", icon: "/icons/info.svg" },
  { label: "STATISTIK", href: "/statistik", icon: "/icons/statistik.svg" },
  { label: "HASIL SELEKSI", href: "/hasil-seleksi", icon: "/icons/hasil.svg" },
];

export default function Home() {
  return (
    <main className="hero">
      {/* Background */}
      <Image
        src={IMAGES.background}
        alt="Foto sekolah"
        fill
        priority
        unoptimized
        className="hero-bg"
      />
      <div className="hero-overlay" />

      {/* Navbar */}
      <nav className="navbar">
        {MENU.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`nav-item ${item.active ? "active" : ""}`}
          >
            <Image src={item.icon} alt="" width={26} height={26} unoptimized />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Konten tengah */}
      <section className="hero-content">
        <Image
          src={IMAGES.logo}
          alt="Logo SMA Citra Negara"
          width={110}
          height={110}
          unoptimized
          className="logo"
        />

        <div className="pill">Sistem Penerimaan Murid Baru</div>

        <h1 className="title">SPMB</h1>

        <p className="desc">
          Mungkin hari ini kamu sedang mencari sekolah yang tepat untuk
          melanjutkan perjalananmu. Di sinilah langkah baru itu dimulai. Kenali
          lingkungan belajar, kembangkan kemampuan, temukan pengalaman baru, dan
          bertemu dengan orang-orang yang akan menjadi bagian dari
          perjalananmu.
        </p>

        <div className="actions">
          <Link href="/portal" className="btn btn-primary">
            <span>DAFTAR SPMB</span>
            <Image
              src="/icons/chevron-right.svg"
              alt=""
              width={22}
              height={22}
              unoptimized
            />
          </Link>
          <Link href="/status" className="btn btn-secondary">
            CEK STATUS PENDAFTARAN
          </Link>
        </div>
      </section>
    </main>
  );
}
