-- ============================================================================
-- EduTrack — Skema Database Supabase (PostgreSQL)
-- Jalankan file ini di Supabase Dashboard > SQL Editor (atau via Supabase CLI)
-- Urutan: 001_schema.sql -> 002_functions_triggers.sql -> 003_rls_policies.sql
-- -> supabase/seed/seed.sql (opsional, data contoh)
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. PROFILES — terhubung 1:1 ke auth.users, menyimpan role & tautan ke entitas
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('admin','teacher','homeroom','student','parent')),
  teacher_id uuid,   -- diisi jika role = teacher/homeroom
  student_id uuid,   -- diisi jika role = student
  parent_id uuid,    -- diisi jika role = parent
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. TAHUN AJARAN & SEMESTER
-- ----------------------------------------------------------------------------
create table if not exists academic_years (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,               -- contoh: '2026/2027'
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists semesters (
  id uuid primary key default uuid_generate_v4(),
  academic_year_id uuid not null references academic_years(id) on delete cascade,
  name text not null check (name in ('Ganjil','Genap')),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (academic_year_id, name)
);

-- ----------------------------------------------------------------------------
-- 3. ORANG TUA / WALI
-- ----------------------------------------------------------------------------
create table if not exists parents (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text,
  phone text,
  address text,
  relation text default 'Wali' check (relation in ('Ayah','Ibu','Wali')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 4. SISWA
-- ----------------------------------------------------------------------------
create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  nis text not null unique,
  nisn text not null unique,
  full_name text not null,
  nickname text,
  gender text check (gender in ('L','P')),
  birth_place text,
  birth_date date,
  address text,
  phone text,
  email text,
  photo_url text,
  entry_year int,
  status text not null default 'aktif' check (status in ('aktif','lulus','pindah','tidak aktif')),
  parent_id uuid references parents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_students_status on students(status);
create index if not exists idx_students_parent on students(parent_id);

-- ----------------------------------------------------------------------------
-- 5. GURU
-- ----------------------------------------------------------------------------
create table if not exists teachers (
  id uuid primary key default uuid_generate_v4(),
  nip text not null unique,
  full_name text not null,
  email text,
  phone text,
  gender text check (gender in ('L','P')),
  photo_url text,
  main_subject_id uuid,  -- FK ditambahkan setelah tabel subjects dibuat
  status text not null default 'aktif' check (status in ('aktif','tidak aktif')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. MATA PELAJARAN
-- ----------------------------------------------------------------------------
create table if not exists subjects (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name text not null,
  group_name text default 'Umum',
  kkm int not null default 75 check (kkm between 0 and 100),
  hours_per_week int default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table teachers add constraint fk_teachers_subject
  foreign key (main_subject_id) references subjects(id) on delete set null;

-- ----------------------------------------------------------------------------
-- 7. KELAS
-- ----------------------------------------------------------------------------
create table if not exists classes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,                     -- contoh: 'X RPL 1'
  grade_level text not null check (grade_level in ('X','XI','XII')),
  major text,
  homeroom_teacher_id uuid references teachers(id) on delete set null,
  academic_year_id uuid not null references academic_years(id) on delete cascade,
  capacity int not null default 36,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, academic_year_id)
);
create index if not exists idx_classes_year on classes(academic_year_id);

-- ----------------------------------------------------------------------------
-- 8. RIWAYAT KELAS SISWA (pembagian kelas & histori kenaikan)
-- ----------------------------------------------------------------------------
create table if not exists student_class_history (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  academic_year_id uuid not null references academic_years(id) on delete cascade,
  semester_id uuid references semesters(id) on delete set null,
  is_active boolean not null default true,
  entry_date date default current_date,
  created_at timestamptz not null default now()
);
create index if not exists idx_sch_student on student_class_history(student_id);
create index if not exists idx_sch_class on student_class_history(class_id);
-- Mencegah siswa berada di 2 kelas aktif pada tahun ajaran yang sama
create unique index if not exists uniq_active_class_per_student_year
  on student_class_history(student_id, academic_year_id)
  where (is_active = true);

-- ----------------------------------------------------------------------------
-- 9. JADWAL
-- ----------------------------------------------------------------------------
create table if not exists schedules (
  id uuid primary key default uuid_generate_v4(),
  day_of_week int not null check (day_of_week between 0 and 6), -- 0=Minggu..6=Sabtu
  start_time time not null,
  end_time time not null,
  teacher_id uuid not null references teachers(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  room text,
  academic_year_id uuid not null references academic_years(id) on delete cascade,
  semester_id uuid not null references semesters(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index if not exists idx_schedules_teacher on schedules(teacher_id, day_of_week);
create index if not exists idx_schedules_class on schedules(class_id, day_of_week);

-- ----------------------------------------------------------------------------
-- 10. KALENDER AKADEMIK
-- ----------------------------------------------------------------------------
create table if not exists calendar_events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  event_type text not null default 'Kegiatan Sekolah',
  start_date date not null,
  end_date date,
  description text,
  academic_year_id uuid references academic_years(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 11. ABSENSI (sesi + detail)
-- ----------------------------------------------------------------------------
create table if not exists attendance_sessions (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references classes(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  teacher_id uuid not null references teachers(id) on delete cascade,
  session_date date not null,
  meeting_number int not null default 1,
  academic_year_id uuid not null references academic_years(id),
  semester_id uuid not null references semesters(id),
  qr_enabled boolean not null default false,
  qr_token uuid,
  qr_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists attendance (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references attendance_sessions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status text not null default 'hadir' check (status in ('hadir','sakit','izin','alpa','terlambat')),
  note text,
  marked_via text not null default 'manual' check (marked_via in ('manual','qr')),
  created_at timestamptz not null default now(),
  unique (session_id, student_id)   -- mencegah absensi duplikat pada sesi yang sama
);
create index if not exists idx_attendance_student on attendance(student_id);

-- ----------------------------------------------------------------------------
-- 12. NILAI
-- ----------------------------------------------------------------------------
create table if not exists grade_weights (
  component text primary key check (component in ('tugas','kuis','ulangan','uts','uas','praktik','proyek')),
  weight numeric not null default 0 check (weight between 0 and 100)
);

create table if not exists grades (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  teacher_id uuid references teachers(id) on delete set null,
  component text not null check (component in ('tugas','kuis','ulangan','uts','uas','praktik','proyek')),
  score numeric not null check (score between 0 and 100),
  status text not null default 'draft' check (status in ('draft','terkunci')),
  locked_by uuid references profiles(id),
  locked_at timestamptz,
  semester_id uuid not null references semesters(id),
  academic_year_id uuid not null references academic_years(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, subject_id, component, semester_id)
);
create index if not exists idx_grades_student on grades(student_id, semester_id);

create table if not exists predicate_ranges (
  id uuid primary key default uuid_generate_v4(),
  label text not null unique,
  min_score numeric not null,
  max_score numeric not null
);

-- ----------------------------------------------------------------------------
-- 13. RAPOR (ringkasan tersimpan opsional — perhitungan utama dilakukan on-the-fly
--     di aplikasi dari tabel grades/attendance; tabel ini untuk arsip/cetak resmi)
-- ----------------------------------------------------------------------------
create table if not exists report_cards (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  semester_id uuid not null references semesters(id) on delete cascade,
  class_id uuid references classes(id),
  generated_at timestamptz not null default now(),
  generated_by uuid references profiles(id),
  unique (student_id, semester_id)
);

create table if not exists homeroom_notes (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  semester_id uuid not null references semesters(id) on delete cascade,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, semester_id)
);

-- ----------------------------------------------------------------------------
-- 14. KENAIKAN KELAS
-- ----------------------------------------------------------------------------
create table if not exists class_promotions (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  previous_class_id uuid references classes(id),
  new_class_id uuid references classes(id),
  academic_year_id uuid not null references academic_years(id),
  semester_id uuid references semesters(id),
  decision text not null check (decision in ('naik','tinggal','lulus','pindah')),
  decided_by uuid references profiles(id),
  decided_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 15. UJIAN
-- ----------------------------------------------------------------------------
create table if not exists exams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  exam_type text not null check (exam_type in ('Ulangan','UTS','UAS','Praktik','Ujian Lainnya')),
  subject_id uuid references subjects(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  teacher_id uuid references teachers(id),
  exam_date date not null,
  start_time time,
  room text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 16. PENGUMUMAN
-- ----------------------------------------------------------------------------
create table if not exists announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  author_id uuid references profiles(id),
  target text not null default 'semua' check (target in ('semua','guru','siswa','orang tua','kelas tertentu')),
  class_id uuid references classes(id),
  status text not null default 'terbit',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 17. NOTIFIKASI
-- ----------------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id, is_read);

-- ----------------------------------------------------------------------------
-- 18. AUDIT LOG
-- ----------------------------------------------------------------------------
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  role text,
  action text not null,
  related_table text,
  related_id uuid,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_created on audit_logs(created_at desc);

-- ----------------------------------------------------------------------------
-- Data awal untuk grade_weights & predicate_ranges (bisa diubah Admin di UI)
-- ----------------------------------------------------------------------------
insert into grade_weights (component, weight) values
  ('tugas', 20), ('kuis', 10), ('uts', 30), ('uas', 40),
  ('ulangan', 0), ('praktik', 0), ('proyek', 0)
on conflict (component) do nothing;

insert into predicate_ranges (label, min_score, max_score) values
  ('A', 90, 100), ('B', 80, 89), ('C', 70, 79), ('D', 0, 69)
on conflict (label) do nothing;

-- ----------------------------------------------------------------------------
-- FK tertunda pada profiles (tabel teachers/students/parents dibuat belakangan)
-- ----------------------------------------------------------------------------
alter table profiles add constraint fk_profiles_teacher foreign key (teacher_id) references teachers(id) on delete set null;
alter table profiles add constraint fk_profiles_student foreign key (student_id) references students(id) on delete set null;
alter table profiles add constraint fk_profiles_parent foreign key (parent_id) references parents(id) on delete set null;
