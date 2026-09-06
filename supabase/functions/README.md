# Edge Function: create-user

Fungsi ini memungkinkan Admin membuat akun pengguna (siswa/guru/wali kelas/orang
tua/admin) **langsung dari dalam aplikasi EduTrack** (menu Pengguna), tanpa perlu
membuka Supabase Dashboard sama sekali.

## Kenapa perlu Edge Function (bukan langsung dari frontend)?

Membuat user Supabase Auth secara terprogram membutuhkan `service_role` key.
Key ini **tidak boleh pernah** berada di kode frontend (bisa dilihat siapa saja
lewat DevTools browser). Edge Function berjalan di server Supabase, menyimpan
`service_role` key sebagai *secret* yang aman, dan hanya bisa dipanggil lewat
API — frontend hanya mengirim permintaan biasa lewat sesi login Admin.

## Cara Deploy (sekali saja, dari terminal lokal)

### 1. Install Supabase CLI (jika belum)
```bash
npm install -g supabase
```

### 2. Login ke Supabase CLI
```bash
supabase login
```

### 3. Hubungkan ke project Anda
```bash
supabase link --project-ref <project-ref-anda>
```
`<project-ref-anda>` bisa dilihat di URL Dashboard: `https://supabase.com/dashboard/project/<project-ref-anda>`

### 4. Deploy function
```bash
supabase functions deploy create-user
```

Secret `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` **otomatis tersedia**
untuk semua Edge Function di project Supabase — Anda tidak perlu set manual.

### 5. Tes
Buka aplikasi EduTrack, login sebagai Admin, buka menu **Pengguna**, coba buat
satu akun. Jika ada error, cek log function:
```bash
supabase functions logs create-user
```

## Troubleshooting

**"Failed to send a request to the Edge Function"**
→ Function belum ter-deploy, atau nama function salah ketik. Jalankan ulang `supabase functions deploy create-user`.

**"Hanya Admin yang boleh membuat akun pengguna."**
→ Akun yang sedang login bukan role admin, atau baris `profiles`-nya belum ter-update jadi admin.

**Masih tidak bisa deploy / tidak punya akses terminal**
→ Sebagai alternatif sementara, tetap bisa pakai cara manual lewat Supabase
Dashboard (Authentication > Add User, lalu edit tabel `profiles` seperti
dijelaskan di README.md utama).
