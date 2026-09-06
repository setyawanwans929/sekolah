# Dokumentasi Pengujian

| No | Fitur | Skenario | Expected Result | Status |
|----|-------|----------|------------------|--------|
| 1 | Login | Login dengan kredensial valid | Redirect ke dashboard sesuai role | ✅ Lulus |
| 2 | Login | Login dengan password salah | Pesan error "Email atau password salah" | ✅ Lulus |
| 3 | Logout | Klik tombol logout | Session berakhir, redirect ke /login | ✅ Lulus |
| 4 | Role | Siswa mencoba akses /admin/dashboard | Redirect ke /unauthorized | ✅ Lulus |
| 5 | CRUD Siswa | Tambah siswa dengan NIS duplikat | Ditolak, pesan "NIS sudah digunakan" | ✅ Lulus |
| 6 | CRUD Siswa | Edit & hapus siswa | Data ter-update/terhapus di Supabase | ✅ Lulus |
| 7 | CRUD Guru | Tambah/edit/hapus guru | Berhasil, muncul di daftar | ✅ Lulus |
| 8 | CRUD Kelas | Tambah kelas dengan nama duplikat di tahun sama | Ditolak (unique constraint) | ✅ Lulus |
| 9 | CRUD Mapel | Tambah mapel dengan kode duplikat | Ditolak (unique constraint) | ✅ Lulus |
| 10 | Pembagian Kelas | Pindahkan siswa yang sudah di kelas aktif | Penempatan lama otomatis nonaktif | ✅ Lulus |
| 11 | Kenaikan Kelas | Proses naik kelas massal | Histori lama tetap ada, siswa masuk kelas baru | ✅ Lulus |
| 12 | Jadwal | Tambah jadwal bentrok guru | Ditolak dengan pesan "Jadwal bentrok..." | ✅ Lulus |
| 13 | Deteksi Bentrok | Bentrok kelas & ruangan | Ditolak di frontend & database (trigger) | ✅ Lulus |
| 14 | Absensi Manual | Tandai semua hadir | Semua siswa berstatus hadir tersimpan | ✅ Lulus |
| 15 | Absensi Manual | Input absensi 2x sesi sama | Ditolak (unique constraint session+student) | ✅ Lulus |
| 16 | Absensi QR | Siswa scan QR valid | Absensi tercatat status hadir, marked_via=qr | ✅ Lulus |
| 17 | Absensi QR | Scan QR kadaluarsa (>15 menit) | Ditolak dengan pesan waktu berakhir | ✅ Lulus |
| 18 | Nilai | Input nilai di luar 0-100 | Ditolak (check constraint database) | ✅ Lulus |
| 19 | Penguncian Nilai | Kunci nilai lalu coba edit | Input dinonaktifkan di UI, ditolak RLS jika dipaksa | ✅ Lulus |
| 20 | Penguncian Nilai | Admin buka kunci nilai | Guru bisa edit kembali | ✅ Lulus |
| 21 | Rapor | Generate rapor siswa dengan nilai lengkap | Nilai akhir, predikat, deskripsi tampil benar | ✅ Lulus |
| 22 | Pengumuman | Target "kelas tertentu" | Hanya siswa kelas tsb yang melihat (RLS) | ✅ Lulus |
| 23 | Notifikasi | Tandai semua dibaca | is_read=true untuk semua notifikasi user | ✅ Lulus |
| 24 | Laporan | Export CSV siswa | File CSV terunduh dengan kolom sesuai | ✅ Lulus |
| 25 | Import | Import CSV dengan NIS duplikat dalam file | Validasi menampilkan error sebelum insert | ✅ Lulus |
| 26 | RLS | Guru akses data siswa di luar kelas yang diajar | Query kosong / ditolak RLS | ✅ Lulus |
| 27 | RLS | Orang tua akses data anak orang lain | Query kosong / ditolak RLS | ✅ Lulus |
| 28 | Responsive | Buka di viewport mobile (375px) | Sidebar berubah jadi drawer, tabel scroll horizontal | ✅ Lulus |
| 29 | Dark Mode | Toggle dark mode | Preferensi tersimpan setelah reload | ✅ Lulus |
| 30 | Build | `npm run build` | Build sukses tanpa error | ✅ Lulus |

## Cara Menjalankan Pengujian Manual

1. Jalankan seed data (`npm run seed`) agar tersedia akun & data contoh.
2. Login dengan masing-masing akun demo (lihat `supabase/seed/README.md`).
3. Ikuti skenario pada tabel di atas satu per satu, catat hasil aktual.
4. Untuk pengujian RLS, gunakan Supabase Dashboard > SQL Editor dengan `set role`
   atau uji langsung dari UI menggunakan akun dengan role berbeda.

## Rencana Pengujian Otomatis (Lanjutan)

Proyek ini belum menyertakan test otomatis (unit/integration test). Untuk
pengembangan lanjutan, disarankan menambahkan:
- Vitest + React Testing Library untuk komponen UI
- Pengujian RLS policy menggunakan `supabase test db` atau skrip SQL terpisah
