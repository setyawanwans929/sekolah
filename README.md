# EduTrack — Sistem Informasi Akademik Sekolah

EduTrack adalah aplikasi web full-stack untuk manajemen akademik sekolah, dibangun
sebagai proyek Rekayasa Perangkat Lunak (RPL) dengan arsitektur nyata (bukan sekadar
CRUD template): React + Vite di frontend, Supabase (PostgreSQL, Auth, Storage) di
backend, dan Row Level Security untuk otorisasi multi-role.

## Fitur Utama

- **Auth & multi-role**: Admin, Guru, Wali Kelas, Siswa, Orang Tua — dengan RLS di level database
- **Manajemen data induk**: Siswa, Guru, Orang Tua, Kelas, Mata Pelajaran, Tahun Ajaran/Semester
- **Pembagian kelas & kenaikan kelas** dengan histori permanen
- **Jadwal pelajaran** dengan deteksi bentrok otomatis (guru/kelas/ruangan) — divalidasi di frontend & database
- **Absensi manual & QR Code** (sesi absensi, scan mandiri siswa, anti-duplikasi)
- **Nilai** dengan bobot dapat dikonfigurasi, penguncian nilai, dan rekap otomatis
- **Rapor** dengan layout cetak, deskripsi nilai otomatis, catatan wali kelas
- **Kalender akademik, pengumuman bertarget, jadwal ujian dengan countdown**
- **Import/export CSV**, laporan, audit log, dashboard monitoring siswa berisiko

## Teknologi

React 18 · Vite · Tailwind CSS · React Router · Supabase (PostgreSQL, Auth, Storage) ·
Recharts · Lucide React · qrcode.react · html5-qrcode · PapaParse

## Struktur Folder

```
src/
├── components/   # UI reusable (ui, layout, common)
├── pages/        # Halaman per role (admin, teacher, homeroom, student, parent, auth, common)
├── layouts/      # DashboardLayout, ParentLayout, menuConfig
├── lib/          # Supabase client
├── services/     # Semua query Supabase, dikelompokkan per domain
├── hooks/        # Custom hooks
├── utils/        # csv, format, roles
├── context/      # Auth, Theme, Toast, ParentChild
└── routes/       # ProtectedRoute
supabase/
├── migrations/   # 001_schema, 002_functions_triggers, 003_rls_policies, 004_storage
└── seed/         # Skrip seed data demo
docs/             # Dokumentasi RPL lengkap
```

## Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan berurutan:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_functions_triggers.sql`
   - `supabase/migrations/003_rls_policies.sql`
   - `supabase/migrations/004_storage.sql`
3. Buka **Project Settings > API**, salin `Project URL` dan `anon public key`.
4. (Opsional) Isi data contoh: lihat `supabase/seed/README.md`.

## Setup Lokal

```bash
npm install
cp .env.example .env
# isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env
npm run dev
```

Buka `http://localhost:5173`. Jika belum ada akun, buat user pertama (role admin)
lewat Supabase Dashboard > Authentication > Add User, lalu set `role = 'admin'`
pada baris yang otomatis dibuat di tabel `profiles` (Table Editor).

### Membuat Akun Pengguna (tanpa seed script)

1. Supabase Dashboard > Authentication > Users > Add User (isi email & password, centang "Auto Confirm").
2. Trigger `handle_new_auth_user` otomatis membuat baris di `profiles` dengan role default `student`.
3. Edit baris tersebut di Table Editor: set `role` (admin/teacher/homeroom/student/parent)
   dan isi `teacher_id`/`student_id`/`parent_id` sesuai data yang relevan.

## Environment Variables

| Variabel | Keterangan |
|---|---|
| `VITE_SUPABASE_URL` | URL project Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key — **aman untuk frontend** |

`service_role` key **tidak pernah** dipakai di frontend — hanya dipakai lokal untuk
skrip seed (`supabase/seed/run-seed.mjs`), lihat panduan di sana.

## Deploy ke Vercel

1. Push project ke GitHub (`git init && git add . && git commit -m "init" && git push`).
2. Import repo di [vercel.com](https://vercel.com/new).
3. Set Environment Variables di Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Build command: `npm run build`, Output directory: `dist` (otomatis terdeteksi Vite).
5. `vercel.json` sudah berisi rewrite rule agar React Router bekerja saat refresh halaman.

## Troubleshooting

**Error "Konfigurasi Supabase Belum Lengkap" saat membuka aplikasi**
→ `.env` belum diisi atau salah nama variabel. Pastikan persis `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`, lalu restart `npm run dev`.

**Login berhasil tapi diarahkan ke halaman kosong / redirect loop**
→ Baris di tabel `profiles` untuk user tersebut belum punya `role`, atau role tidak sesuai salah satu dari: admin/teacher/homeroom/student/parent.

**404 saat refresh halaman di Vercel**
→ Pastikan `vercel.json` ter-deploy (rewrite ke `/index.html`). Untuk hosting lain, konfigurasikan SPA fallback serupa.

**RLS error / "new row violates row-level security policy"**
→ Periksa apakah user login memiliki role yang tepat dan `teacher_id`/`student_id`/`parent_id` di `profiles` sudah terisi sesuai. Cek juga apakah migrasi `003_rls_policies.sql` sudah dijalankan lengkap.

**API key / anon key error**
→ Anon key hanya bekerja untuk operasi yang diizinkan RLS. Jika butuh operasi admin (mis. membuat user), gunakan Supabase Dashboard atau skrip seed dengan service_role key — jangan taruh service_role key di frontend.

## Keterbatasan yang Diketahui

- Modul deteksi bentrok jadwal memeriksa overlap waktu pada hari & semester yang sama; belum menangani kasus jadwal lintas semester atau jadwal blok multi-hari.
- QR absensi menggunakan token per-sesi dengan masa berlaku 15 menit; ini bukan mekanisme kriptografis anti-spoofing tingkat lanjut, cukup untuk kebutuhan sekolah menengah.
- "Backup" di aplikasi ini terbatas pada export CSV dan backup native Supabase (Point-in-Time Recovery tersedia di paket berbayar Supabase) — aplikasi frontend tidak melakukan backup database secara mandiri.
- Rapor dihitung on-the-fly dari data nilai & absensi terkini; tabel `report_cards` disediakan untuk pengarsipan versi resmi jika sekolah membutuhkannya di kemudian hari.

## Dokumentasi RPL

Lihat folder `docs/` untuk: latar belakang, analisis kebutuhan, use case diagram,
activity diagram, ERD, flowchart, rencana pengujian, dan dokumentasi UI.
