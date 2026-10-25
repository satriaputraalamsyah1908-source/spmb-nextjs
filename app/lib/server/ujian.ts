import type { RowDataPacket } from "mysql2";
import type { Pool } from "mysql2/promise";

export const DURASI_MS = 120 * 60 * 1000; // 120 menit

/** Bersihkan jawaban dari browser: { "idSoal": 0..3 }. */
export function bersihkan(j: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!j || typeof j !== "object") return out;
  let n = 0;
  for (const [k, v] of Object.entries(j as Record<string, unknown>)) {
    const id = Number(k);
    if (Number.isInteger(id) && id > 0 && Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 3) {
      out[String(id)] = v as number;
      if (++n >= 2000) break;
    }
  }
  return out;
}

export function bacaJawaban(teks: string | null | undefined): Record<string, number> {
  try {
    return bersihkan(teks ? JSON.parse(teks) : {});
  } catch {
    return {};
  }
}

export async function jumlahSoal(pool: Pool): Promise<number> {
  const [r] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM soal_tes");
  return Number(r[0].n);
}

/** Soal untuk siswa (TANPA kunci jawaban). */
export async function soalPublik(pool: Pool) {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d FROM soal_tes ORDER BY urutan, id"
  );
  return rows.map((r) => ({
    id: Number(r.id),
    teks: String(r.pertanyaan),
    opsi: [r.opsi_a, r.opsi_b, r.opsi_c, r.opsi_d].map(String),
  }));
}

/** Menilai, menyimpan hasil ujian, dan menyalin nilai ke data pendaftar (untuk dashboard admin). */
export async function selesaikan(pool: Pool, akunId: number, jawaban: Record<string, number>) {
  const [kunci] = await pool.query<RowDataPacket[]>("SELECT id, kunci FROM soal_tes");
  const total = kunci.length;
  const benar = kunci.filter((k) => jawaban[String(k.id)] === Number(k.kunci)).length;
  const nilai = total ? Math.round((benar / total) * 1000) / 10 : 0;

  await pool.execute(
    "UPDATE ujian_siswa SET selesai_ms = ?, jawaban = ?, benar = ?, nilai = ?, total = ? WHERE akun_id = ? AND selesai_ms IS NULL",
    [Date.now(), JSON.stringify(jawaban), benar, nilai, total, akunId]
  );
  await pool.execute("UPDATE biodata_siswa SET nilai = ? WHERE akun_id = ?", [nilai, akunId]);
  return { benar, nilai, total };
}
