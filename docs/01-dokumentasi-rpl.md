# Dokumentasi RPL — EduTrack: Sistem Informasi Akademik Sekolah

## 1. Latar Belakang
Pengelolaan data akademik sekolah menengah kejuruan (SMK), khususnya jurusan RPL,
masih banyak dilakukan secara manual atau tersebar di berbagai berkas (Excel, kertas,
grup chat). Hal ini menyulitkan proses pemantauan kehadiran, penilaian, penyusunan
rapor, dan pengambilan keputusan kenaikan kelas secara cepat dan akurat.

## 2. Identifikasi Masalah
- Data siswa, nilai, dan absensi tersebar di banyak sumber sehingga sulit direkap.
- Proses pembuatan rapor memakan waktu karena perhitungan nilai akhir dilakukan manual.
- Penjadwalan pelajaran rawan bentrok (guru mengajar dua kelas bersamaan, dsb).
- Orang tua tidak memiliki akses langsung untuk memantau perkembangan anak.
- Tidak ada jejak audit atas perubahan data akademik penting (nilai, absensi).

## 3. Rumusan Masalah
1. Bagaimana merancang sistem informasi akademik yang mengintegrasikan data siswa,
   guru, kelas, jadwal, absensi, nilai, dan rapor dalam satu basis data relasional?
2. Bagaimana menerapkan kontrol akses berbasis peran (role-based access control)
   agar setiap pengguna hanya dapat mengakses data yang relevan dengan perannya?
3. Bagaimana mengotomatisasi deteksi bentrok jadwal dan perhitungan nilai akhir/rapor?

## 4. Tujuan
- Membangun sistem informasi akademik sekolah berbasis web yang terintegrasi dengan
  database relasional sungguhan (Supabase/PostgreSQL), bukan data statis di frontend.
- Menyediakan akses berbeda untuk lima peran: Admin, Guru, Wali Kelas, Siswa, Orang Tua.
- Mengotomatisasi proses akademik: absensi (termasuk via QR Code), penilaian dengan
  bobot dan penguncian, rapor, serta kenaikan kelas dengan histori.

## 5. Manfaat
- **Bagi sekolah**: data akademik terpusat, konsisten, dan dapat diaudit.
- **Bagi guru**: input absensi/nilai lebih cepat, rekap otomatis.
- **Bagi wali kelas**: pemantauan siswa binaan lebih mudah, catatan perkembangan tercatat.
- **Bagi siswa & orang tua**: akses transparan ke nilai, absensi, jadwal, dan rapor.

## 6. Batasan Sistem
- Sistem ini adalah proyek akademik (tugas RPL); fitur pembayaran SPP, PPDB online,
  dan integrasi e-learning **tidak** termasuk dalam cakupan.
- QR Code digunakan sebagai identitas absensi, bukan sebagai sistem keamanan tingkat
  produksi (lihat bagian Keterbatasan di README.md).
- Backup database mengandalkan fitur native Supabase (PITR) dan export CSV manual;
  aplikasi tidak mengklaim melakukan backup otomatis di luar itu.

## 7. Analisis Kebutuhan

### 7.1 Functional Requirements
| Kode | Kebutuhan |
|---|---|
| FR-01 | Sistem dapat mengautentikasi pengguna dengan 5 role berbeda |
| FR-02 | Admin dapat melakukan CRUD data siswa, guru, orang tua, kelas, mata pelajaran |
| FR-03 | Sistem dapat mendeteksi bentrok jadwal (guru/kelas/ruangan) secara otomatis |
| FR-04 | Guru dapat menginput absensi manual maupun melalui QR Code |
| FR-05 | Guru dapat menginput nilai per komponen dan menguncinya |
| FR-06 | Sistem dapat menghitung nilai akhir berdasarkan bobot yang dikonfigurasi Admin |
| FR-07 | Wali kelas dapat menambahkan catatan perkembangan siswa |
| FR-08 | Sistem dapat menghasilkan rapor siap cetak per siswa per semester |
| FR-09 | Admin dapat memproses kenaikan kelas dengan histori tersimpan |
| FR-10 | Orang tua dapat memilih anak (jika lebih dari satu) untuk melihat data akademiknya |
| FR-11 | Sistem mencatat audit log untuk aktivitas penting |
| FR-12 | Admin dapat mengimpor data siswa dari CSV dengan validasi |

### 7.2 Non-Functional Requirements
| Kode | Kebutuhan |
|---|---|
| NFR-01 | Aplikasi responsif di desktop dan mobile |
| NFR-02 | Data diakses melalui Row Level Security agar aman antar-role |
| NFR-03 | Waktu muat halaman dashboard < 2 detik pada koneksi normal |
| NFR-04 | UI mendukung mode terang & gelap |
| NFR-05 | Semua kredensial sensitif (service_role key) tidak pernah berada di frontend |

## 8. Use Case Diagram
Lihat `docs/02-use-case-diagram.md`.

## 9. Activity Diagram
Lihat `docs/03-activity-diagrams.md`.

## 10. ERD
Lihat `docs/04-erd.md` (sesuai skema di `supabase/migrations/001_schema.sql`).

## 11. Flowchart
Lihat `docs/05-flowchart.md`.

## 12. Class/Component Diagram
Lihat `docs/06-component-diagram.md`.

## 13. UI Design
Lihat `docs/07-ui-design.md` untuk daftar seluruh halaman dan komponennya.

## 14. Testing
Lihat `docs/08-testing.md`.

## 15. Deployment
GitHub → Vercel → Supabase. Lihat panduan lengkap di `README.md` bagian "Deploy ke Vercel".
