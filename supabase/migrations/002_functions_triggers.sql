-- ============================================================================
-- EduTrack — Functions & Triggers
-- Jalankan setelah 001_schema.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- updated_at otomatis
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','academic_years','students','teachers','subjects',
    'classes','grades','parents','report_cards','homeroom_notes'] loop
    execute format('drop trigger if exists trg_updated_at on %I;', t);
    execute format('create trigger trg_updated_at before update on %I for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Hanya satu tahun ajaran aktif & satu semester aktif per tahun ajaran
-- ----------------------------------------------------------------------------
create or replace function enforce_single_active_academic_year()
returns trigger language plpgsql as $$
begin
  if new.is_active then
    update academic_years set is_active = false where id <> new.id and is_active = true;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_single_active_year on academic_years;
create trigger trg_single_active_year
  after insert or update of is_active on academic_years
  for each row when (new.is_active) execute function enforce_single_active_academic_year();

create or replace function enforce_single_active_semester()
returns trigger language plpgsql as $$
begin
  if new.is_active then
    update semesters set is_active = false
      where academic_year_id = new.academic_year_id and id <> new.id and is_active = true;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_single_active_semester on semesters;
create trigger trg_single_active_semester
  after insert or update of is_active on semesters
  for each row when (new.is_active) execute function enforce_single_active_semester();

-- ----------------------------------------------------------------------------
-- Deteksi bentrok jadwal (guru / kelas / ruangan) — lapis pertahanan kedua
-- di database, selain validasi di frontend (lihat src/services/schedulesService.js)
-- ----------------------------------------------------------------------------
create or replace function prevent_schedule_conflict()
returns trigger language plpgsql as $$
declare conflict_count int;
begin
  select count(*) into conflict_count
  from schedules s
  where s.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and s.day_of_week = new.day_of_week
    and s.semester_id = new.semester_id
    and (s.start_time, s.end_time) overlaps (new.start_time, new.end_time)
    and (
      s.teacher_id = new.teacher_id
      or s.class_id = new.class_id
      or (new.room is not null and s.room = new.room)
    );

  if conflict_count > 0 then
    raise exception 'Jadwal bentrok dengan jadwal lain.';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_schedule_conflict on schedules;
create trigger trg_schedule_conflict
  before insert or update on schedules
  for each row execute function prevent_schedule_conflict();

-- ----------------------------------------------------------------------------
-- Audit log otomatis untuk login (dipanggil dari aplikasi setelah signIn sukses
-- karena trigger tidak bisa mengakses event auth secara langsung tanpa webhook).
-- Fungsi ini disediakan agar bisa dipanggil manual via RPC bila diperlukan.
-- ----------------------------------------------------------------------------
create or replace function log_audit(
  p_user_id uuid, p_role text, p_action text, p_related_table text, p_related_id uuid, p_detail text
) returns void language plpgsql security definer as $$
begin
  insert into audit_logs(user_id, role, action, related_table, related_id, detail)
  values (p_user_id, p_role, p_action, p_related_table, p_related_id, p_detail);
end;
$$;

-- ----------------------------------------------------------------------------
-- Buat baris profiles otomatis saat user baru dibuat di Supabase Auth.
-- Admin mengisi role & tautan entitas (teacher_id/student_id/parent_id) setelahnya
-- melalui halaman Pengaturan > Pengguna, atau langsung lewat SQL/Table Editor.
-- ----------------------------------------------------------------------------
create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'student'))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists trg_new_auth_user on auth.users;
create trigger trg_new_auth_user
  after insert on auth.users
  for each row execute function handle_new_auth_user();
