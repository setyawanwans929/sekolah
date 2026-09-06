# Activity Diagrams

## Login
```mermaid
flowchart TD
  A[Mulai] --> B[Buka halaman /login]
  B --> C[Input email & password]
  C --> D{Kredensial valid?}
  D -- Tidak --> E[Tampilkan pesan error]
  E --> C
  D -- Ya --> F[Ambil profil dari tabel profiles]
  F --> G{Role?}
  G -- admin --> H1[/admin/dashboard]
  G -- teacher --> H2[/teacher/dashboard]
  G -- homeroom --> H3[/homeroom/dashboard]
  G -- student --> H4[/student/dashboard]
  G -- parent --> H5[/parent/dashboard]
```

## Input Absensi (Guru)
```mermaid
flowchart TD
  A[Mulai] --> B[Pilih jadwal mengajar]
  B --> C[Pilih tanggal & pertemuan]
  C --> D{Aktifkan QR?}
  D -- Ya --> E[Sistem generate QR token 15 menit]
  D -- Tidak --> F[Buat sesi absensi manual]
  E --> G[Siswa scan QR]
  F --> H[Guru tandai status per siswa]
  G --> I[Sistem validasi token & cegah duplikasi]
  I --> J[Simpan ke tabel attendance]
  H --> J
  J --> K[Selesai]
```

## Input & Kunci Nilai
```mermaid
flowchart TD
  A[Mulai] --> B[Guru pilih kelas & mapel]
  B --> C[Pilih komponen nilai]
  C --> D[Input nilai 0-100 per siswa]
  D --> E[Simpan sebagai Draft]
  E --> F{Guru yakin nilai final?}
  F -- Ya --> G[Kunci Nilai]
  G --> H[Status = Terkunci, tercatat siapa & kapan]
  H --> I[Guru tidak bisa ubah lagi]
  F -- Tidak --> D
```

## Kenaikan Kelas
```mermaid
flowchart TD
  A[Mulai] --> B[Admin pilih kelas asal]
  B --> C[Pilih siswa yang diproses]
  C --> D[Pilih keputusan: naik/tinggal/lulus/pindah]
  D --> E{Keputusan = naik?}
  E -- Ya --> F[Pilih kelas tujuan]
  F --> G[Nonaktifkan histori kelas lama, buat histori baru]
  E -- Tidak --> H{Keputusan?}
  H -- lulus/pindah --> I[Update status siswa, nonaktifkan histori kelas]
  H -- tinggal --> J[Histori kelas lama tetap aktif]
  G --> K[Simpan riwayat class_promotions]
  I --> K
  J --> K
  K --> L[Selesai]
```

## Rapor
```mermaid
flowchart TD
  A[Mulai] --> B[Pilih siswa & semester]
  B --> C[Ambil semua nilai per mapel]
  C --> D[Hitung nilai akhir sesuai bobot]
  D --> E[Tentukan predikat & deskripsi otomatis]
  E --> F[Ambil rekap absensi semester]
  F --> G[Ambil catatan wali kelas]
  G --> H[Render halaman rapor siap cetak]
  H --> I[Selesai]
```

## Mengelola Siswa
```mermaid
flowchart TD
  A[Mulai] --> B[Admin buka menu Siswa]
  B --> C{Aksi?}
  C -- Tambah --> D[Isi form, validasi NIS/NISN unik]
  C -- Edit --> E[Ubah data, simpan]
  C -- Hapus --> F[Konfirmasi, hapus dari database]
  D --> G[Simpan ke Supabase]
  E --> G
  F --> G
  G --> H[Selesai]
```

## Pembagian Kelas
```mermaid
flowchart TD
  A[Mulai] --> B[Admin buka Pembagian Kelas]
  B --> C[Lihat siswa belum berkelas]
  C --> D[Pilih siswa & kelas tujuan]
  D --> E{Siswa sudah di kelas aktif tahun ini?}
  E -- Ya --> F[Nonaktifkan penempatan lama]
  E -- Tidak --> G[Lanjut]
  F --> G
  G --> H[Buat penempatan baru]
  H --> I[Selesai]
```
