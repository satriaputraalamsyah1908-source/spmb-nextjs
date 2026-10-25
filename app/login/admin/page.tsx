import StaffLogin from "../../components/StaffLogin";

export default function LoginAdminPage() {
  return (
    <StaffLogin role="admin" welcome="WELCOME BACK ADMIN" emailPlaceholder="admin@gmail.com">
      Tetap semangat melayani, setiap proses yang kamu kelola adalah bagian dari langkah menuju
      keberhasilan
      <br />
      <strong>SEMANGAT ADMINNNN</strong>
    </StaffLogin>
  );
}
