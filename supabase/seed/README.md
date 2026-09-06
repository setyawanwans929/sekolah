# Seed Data EduTrack

Skrip `run-seed.mjs` mengisi database dengan data contoh yang **konsisten dengan foreign key**:

- 5 mata pelajaran, 10 guru (akun login), 5 kelas, ~50 siswa, ~30 jadwal
- Data absensi & nilai beberapa pertemuan
- 1 tahun ajaran aktif (2026/2027) + semester Ganjil aktif
- Pengumuman & jadwal ujian contoh

## Persyaratan

Skrip ini menggunakan **service_role key** (bukan anon key) karena perlu membuat akun
Supabase Auth untuk setiap guru/siswa/orang tua contoh. **Jangan pernah** menaruh
service_role key di frontend atau commit ke GitHub — jalankan skrip ini hanya secara
lokal dari terminal Anda.

## Cara menjalankan

```bash
# 1. Set environment variable (jangan taruh di file .env yang ter-commit)
export VITE_SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="isi-dengan-service-role-key-dari-dashboard"

# 2. Jalankan migrasi SQL terlebih dahulu (lihat README.md utama)

# 3. Jalankan seed
npm run seed
```

## Akun demo yang dibuat

| Role       | Email                     | Password    |
|------------|---------------------------|-------------|
| Admin      | admin@edutrack.sch.id     | Admin123!   |
| Guru       | guru1@edutrack.sch.id     | Guru123!    |
| Wali Kelas | wali1@edutrack.sch.id     | Wali123!    |
| Siswa      | siswa1@edutrack.sch.id    | Siswa123!   |
| Orang Tua  | ortu1@edutrack.sch.id     | Ortu123!    |

Segera ganti password akun-akun ini setelah demo/presentasi selesai.
