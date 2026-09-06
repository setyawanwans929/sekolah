# Dokumentasi UI

> Catatan: proyek ini tidak menyertakan file gambar screenshot statis. Untuk tangkapan
> layar aktual, jalankan aplikasi (`npm run dev`) dan ambil screenshot tiap halaman
> di bawah untuk dilampirkan pada laporan RPL cetak.

## Halaman Bersama
- `/login` — Form login dengan validasi & pesan error
- Sidebar (desktop) / Drawer (mobile) dengan menu sesuai role
- Topbar: pencarian, toggle dark mode, notifikasi, profil, logout

## Admin
| Halaman | Path | Deskripsi |
|---|---|---|
| Dashboard | /admin/dashboard | Statistik, grafik siswa per kelas, siswa perlu perhatian, aktivitas terbaru |
| Siswa | /admin/students | Tabel CRUD, search, filter status, pagination, import/export CSV |
| Detail Siswa | /admin/students/:id | Biodata lengkap, riwayat kelas & kenaikan |
| Guru | /admin/teachers | CRUD data guru |
| Orang Tua | /admin/parents | CRUD data orang tua & relasi ke anak |
| Kelas | /admin/classes | Card per kelas, kapasitas, wali kelas |
| Pembagian Kelas | /admin/classes/assign | Drag-select siswa belum berkelas → kelas tujuan |
| Mata Pelajaran | /admin/subjects | CRUD mapel, KKM, jam/minggu |
| Tahun Ajaran | /admin/academic-years | Kelola tahun ajaran & semester aktif |
| Kalender | /admin/calendar | List & grid event akademik |
| Jadwal | /admin/schedules | Tabel jadwal dengan validasi bentrok real-time |
| Absensi | /admin/attendance | Rekap kehadiran per kelas |
| Nilai | /admin/grades | Rekap nilai per kelas dengan ranking opsional |
| Bobot Nilai | /admin/grades/weights | Slider/isi persentase komponen nilai |
| Kenaikan Kelas | /admin/promotion | Pilih siswa massal, keputusan naik/tinggal/lulus/pindah |
| Ujian | /admin/exams | CRUD jadwal ujian |
| Pengumuman | /admin/announcements | CRUD pengumuman bertarget |
| Laporan | /admin/reports | Export CSV berbagai entitas |
| Audit Log | /admin/audit-log | Tabel log aktivitas |
| Pengaturan | /admin/settings | Rentang predikat nilai |

## Guru
Dashboard, Jadwal Mengajar, Input Absensi (manual + QR generator), Input & Kunci Nilai,
Jadwal Ujian (read-only), Pengumuman (read-only).

## Wali Kelas
Dashboard, Siswa Kelas, Absensi (rekap), Nilai (rekap), Catatan Siswa, Rapor, Kenaikan Kelas.

## Siswa
Dashboard, Profil, Jadwal, Absensi (rekap + scan QR), Nilai, Rapor (cetak), Jadwal Ujian
(dengan countdown), Pengumuman, Kalender, QR Identitas.

## Orang Tua
Dashboard (dengan selector anak jika >1), Nilai, Rapor, Absensi, Jadwal, Jadwal Ujian,
Pengumuman.

## Desain Visual
- Warna utama: biru (`brand-600 #2563eb`), latar netral abu-abu terang/gelap
- Komponen: Card, Modal, Badge berwarna sesuai status, Toast, ConfirmDialog, Pagination
- Ikon: Lucide React
- Grafik: Recharts (bar chart)
- Mode gelap tersedia di seluruh halaman, preferensi tersimpan di localStorage
