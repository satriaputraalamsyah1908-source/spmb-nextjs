import StaffLogin from "../../components/StaffLogin";

export default function LoginKepsekPage() {
  return (
    <StaffLogin role="kepsek" welcome="WELCOME KEPALA SEKOLAH" emailPlaceholder="Kepsek@gmail.com">
      “Selamat datang, Bapak/Ibu Kepala Sekolah. Teruslah menjadi pemimpin yang menginspirasi,
      membimbing dengan bijaksana, dan bersama-sama membawa sekolah menuju pendidikan yang lebih
      baik.”
    </StaffLogin>
  );
}
