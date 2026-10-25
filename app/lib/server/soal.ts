// Bank soal AWAL (50 soal campuran). Setelah masuk database, soal dikelola admin
// lewat menu Soal Tes - mengubah file ini tidak mengubah soal yang sudah ada di database.
// Format: [soal, jawaban BENAR, pilihan salah 1, salah 2, salah 3]
// Urutan pilihan A-D diacak otomatis dengan pola tetap.

type Sumber = [string, string, string, string, string];

const SUMBER: Sumber[] = [
  // --- PPKn & Pengetahuan Sosial ---
  ["Indonesia memiliki banyak suku, budaya, dan agama. Agar keberagaman tersebut tidak menimbulkan perpecahan, sikap yang harus dilakukan adalah ...", "Menghargai perbedaan", "Mengutamakan kelompok sendiri", "Memaksakan budaya sendiri kepada orang lain", "Menghindari pergaulan dengan suku lain"],
  ["Pancasila sebagai dasar negara tercantum dalam ...", "Pembukaan UUD 1945", "Batang tubuh UUD 1945", "Penjelasan UUD 1945", "Ketetapan MPR"],
  ["Sila ketiga Pancasila berbunyi ...", "Persatuan Indonesia", "Kemanusiaan yang adil dan beradab", "Ketuhanan Yang Maha Esa", "Keadilan sosial bagi seluruh rakyat Indonesia"],
  ["Hari Sumpah Pemuda diperingati setiap tanggal ...", "28 Oktober", "20 Mei", "17 Agustus", "10 November"],
  ["Lembaga yang berwenang menguji undang-undang terhadap UUD 1945 adalah ...", "Mahkamah Konstitusi", "Mahkamah Agung", "Komisi Yudisial", "Dewan Perwakilan Rakyat"],
  ["Ibu kota Provinsi Jawa Timur adalah ...", "Surabaya", "Malang", "Semarang", "Bandung"],
  ["Proklamasi kemerdekaan Indonesia dibacakan pada tahun ...", "1945", "1942", "1949", "1950"],
  ["Contoh hak warga negara di bidang pendidikan adalah ...", "Mendapat pengajaran yang layak", "Membayar pajak", "Menaati hukum", "Ikut serta dalam bela negara"],
  ["Kegiatan ekonomi yang bertujuan menyalurkan barang dari produsen ke konsumen disebut ...", "Distribusi", "Produksi", "Konsumsi", "Investasi"],
  ["Benua terluas di dunia adalah ...", "Asia", "Afrika", "Eropa", "Amerika"],

  // --- Bahasa Indonesia ---
  ["Kalimat yang menggunakan huruf kapital dengan benar adalah ...", "Ibu pergi ke Pasar Minggu naik kereta.", "ibu pergi ke pasar minggu Naik Kereta.", "Ibu Pergi ke pasar Minggu naik kereta.", "ibu Pergi ke Pasar Minggu Naik kereta."],
  ["Sinonim kata \"gigih\" adalah ...", "Tekun", "Malas", "Ragu", "Lemah"],
  ["Antonim kata \"luas\" adalah ...", "Sempit", "Lebar", "Panjang", "Besar"],
  ["Gagasan pokok sebuah paragraf biasanya terdapat pada ...", "Kalimat utama", "Kalimat penjelas", "Judul buku", "Nomor halaman"],
  ["Pada kalimat \"Adik membaca buku di perpustakaan.\", yang berfungsi sebagai predikat adalah ...", "membaca", "Adik", "buku", "di perpustakaan"],
  ["Bentuk kata baku yang benar adalah ...", "Apotek", "Apotik", "Apotick", "Apotec"],
  ["Teks yang bertujuan membujuk pembaca agar melakukan sesuatu disebut teks ...", "Persuasi", "Narasi", "Deskripsi", "Eksposisi"],
  ["Majas yang membandingkan dua hal secara langsung dengan kata \"seperti\" atau \"bagai\" adalah ...", "Simile", "Metafora", "Hiperbola", "Personifikasi"],
  ["Unsur intrinsik cerpen yang berkaitan dengan waktu, tempat, dan suasana disebut ...", "Latar", "Tema", "Alur", "Amanat"],
  ["Penulisan tanda baca yang benar terdapat pada kalimat ...", "Dia bertanya, \"Kapan kita berangkat?\"", "Dia bertanya \"Kapan kita berangkat\"?", "Dia bertanya, Kapan kita berangkat?\"", "Dia bertanya: \"Kapan kita berangkat.\""],

  // --- Matematika ---
  ["Hasil dari 15 + 6 × 4 adalah ...", "39", "84", "33", "27"],
  ["Hasil dari 3/4 + 1/2 adalah ...", "5/4", "4/6", "3/8", "4/8"],
  ["Nilai x dari 2x + 5 = 17 adalah ...", "6", "11", "7", "5"],
  ["Luas persegi panjang dengan panjang 12 cm dan lebar 8 cm adalah ...", "96 cm²", "40 cm²", "20 cm²", "192 cm²"],
  ["Keliling lingkaran berjari-jari 7 cm (π = 22/7) adalah ...", "44 cm", "22 cm", "154 cm", "14 cm"],
  ["25% dari 240 adalah ...", "60", "25", "120", "48"],
  ["Rata-rata dari 6, 8, 10, dan 12 adalah ...", "9", "8", "10", "36"],
  ["Hasil dari (−8) + 13 − (−2) adalah ...", "7", "3", "−3", "23"],
  ["Sebuah kubus memiliki panjang rusuk 5 cm. Volumenya adalah ...", "125 cm³", "25 cm³", "150 cm³", "15 cm³"],
  ["Jika harga 3 buku adalah Rp12.000, maka harga 5 buku adalah ...", "Rp20.000", "Rp15.000", "Rp36.000", "Rp18.000"],

  // --- IPA ---
  ["Organ pernapasan tempat terjadinya pertukaran oksigen dan karbon dioksida pada manusia adalah ...", "Alveolus", "Trakea", "Bronkus", "Laring"],
  ["Planet yang paling dekat dengan Matahari adalah ...", "Merkurius", "Venus", "Bumi", "Mars"],
  ["Perubahan wujud dari cair menjadi gas disebut ...", "Menguap", "Membeku", "Mencair", "Menyublim"],
  ["Zat hijau daun yang berperan dalam fotosintesis adalah ...", "Klorofil", "Stomata", "Xilem", "Floem"],
  ["Satuan gaya dalam Sistem Internasional (SI) adalah ...", "Newton", "Joule", "Watt", "Pascal"],
  ["Rumus kimia air adalah ...", "H₂O", "CO₂", "O₂", "NaCl"],
  ["Hewan yang berkembang biak dengan cara bertelur disebut ...", "Ovipar", "Vivipar", "Ovovivipar", "Herbivora"],
  ["Sumber energi yang termasuk energi terbarukan adalah ...", "Energi matahari", "Batu bara", "Minyak bumi", "Gas alam"],
  ["Alat yang digunakan untuk mengukur suhu adalah ...", "Termometer", "Barometer", "Higrometer", "Amperemeter"],
  ["Perpindahan kalor tanpa memerlukan zat perantara disebut ...", "Radiasi", "Konduksi", "Konveksi", "Evaporasi"],

  // --- Bahasa Inggris ---
  ["She ... to school every day.", "goes", "go", "going", "gone"],
  ["The opposite of \"big\" is ...", "small", "tall", "long", "wide"],
  ["I have two brothers. ... names are Andi and Budi.", "Their", "Them", "They", "There"],
  ["Choose the correct sentence.", "They are playing football now.", "They is playing football now.", "They playing football now are.", "They plays football now."],
  ["Yesterday, we ... a movie.", "watched", "watch", "watching", "watches"],

  // --- Umum, TIK, dan Logika ---
  ["Perangkat lunak yang digunakan untuk menjelajahi internet disebut ...", "Browser", "Compiler", "Spreadsheet", "Antivirus"],
  ["Perhatikan deret bilangan berikut: 2, 4, 8, 16, ... Bilangan berikutnya adalah ...", "32", "24", "30", "20"],
  ["Kepanjangan dari CPU adalah ...", "Central Processing Unit", "Central Program Utility", "Computer Personal Unit", "Control Processing Universal"],
  ["Semua siswa SMA wajib mengikuti upacara. Rani adalah siswa SMA. Kesimpulan yang tepat adalah ...", "Rani wajib mengikuti upacara", "Rani tidak wajib mengikuti upacara", "Rani bukan siswa", "Upacara tidak wajib bagi siapa pun"],
  ["Semboyan negara Indonesia, Bhinneka Tunggal Ika, berarti ...", "Berbeda-beda tetapi tetap satu", "Satu untuk semua", "Bersatu kita teguh", "Tanah air kita"],
];

// Pola pengacakan tetap: posisi jawaban benar berputar C, B, A, D, ...
const geser = (i: number) => (7 * i + 2) % 4;

export type SoalSeed = { teks: string; opsi: string[]; kunci: number };

/** Soal awal: dimasukkan ke database satu kali saja (kalau tabel soal masih kosong). */
export const SEED_SOAL: SoalSeed[] = SUMBER.map(([teks, ...o], i) => {
  const r = geser(i);
  const opsi: string[] = ["", "", "", ""];
  o.forEach((x, j) => {
    opsi[(j + r) % 4] = x;
  });
  return { teks, opsi, kunci: r };
});
