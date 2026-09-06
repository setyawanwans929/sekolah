-- ============================================================================
-- EduTrack — Row Level Security (RLS)
-- Jalankan setelah 001_schema.sql dan 002_functions_triggers.sql
-- Prinsip: ADMIN akses penuh; GURU hanya data kelas/mapel yang diampu;
-- WALI KELAS hanya siswa kelasnya; SISWA hanya data dirinya; ORANG TUA hanya data anaknya.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper functions (security definer agar bisa dipakai lintas tabel tanpa
-- terjebak rekursi RLS pada tabel profiles)
-- ----------------------------------------------------------------------------
create or replace function auth_role() returns text
language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function auth_teacher_id() returns uuid
language sql security definer stable as $$
  select teacher_id from profiles where id = auth.uid();
$$;

create or replace function auth_student_id() returns uuid
language sql security definer stable as $$
  select student_id from profiles where id = auth.uid();
$$;

create or replace function auth_parent_id() returns uuid
language sql security definer stable as $$
  select parent_id from profiles where id = auth.uid();
$$;

-- Kelas-kelas yang diajar oleh guru yang sedang login (dari tabel schedules)
create or replace function auth_teacher_class_ids() returns setof uuid
language sql security definer stable as $$
  select distinct class_id from schedules where teacher_id = auth_teacher_id();
$$;

-- Kelas yang diwalikan oleh guru yang sedang login
create or replace function auth_homeroom_class_ids() returns setof uuid
language sql security definer stable as $$
  select id from classes where homeroom_teacher_id = auth_teacher_id();
$$;

-- Siswa-siswa pada kelas yang diwalikan (aktif)
create or replace function auth_homeroom_student_ids() returns setof uuid
language sql security definer stable as $$
  select student_id from student_class_history
  where class_id in (select auth_homeroom_class_ids()) and is_active = true;
$$;

-- Siswa-siswa pada kelas yang diajar guru (aktif)
create or replace function auth_teacher_student_ids() returns setof uuid
language sql security definer stable as $$
  select student_id from student_class_history
  where class_id in (select auth_teacher_class_ids()) and is_active = true;
$$;

-- ----------------------------------------------------------------------------
-- Aktifkan RLS di semua tabel
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;
alter table academic_years enable row level security;
alter table semesters enable row level security;
alter table parents enable row level security;
alter table students enable row level security;
alter table teachers enable row level security;
alter table subjects enable row level security;
alter table classes enable row level security;
alter table student_class_history enable row level security;
alter table schedules enable row level security;
alter table calendar_events enable row level security;
alter table attendance_sessions enable row level security;
alter table attendance enable row level security;
alter table grade_weights enable row level security;
alter table grades enable row level security;
alter table predicate_ranges enable row level security;
alter table report_cards enable row level security;
alter table homeroom_notes enable row level security;
alter table class_promotions enable row level security;
alter table exams enable row level security;
alter table announcements enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- ----------------------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------------------
create policy "profiles_self_select" on profiles for select using (id = auth.uid());
create policy "profiles_admin_all" on profiles for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "profiles_self_update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- REFERENSI YANG BOLEH DIBACA SEMUA ROLE TERAUTENTIKASI (read-only umum)
-- ----------------------------------------------------------------------------
create policy "academic_years_read_all" on academic_years for select using (auth.role() = 'authenticated');
create policy "academic_years_admin_write" on academic_years for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

create policy "semesters_read_all" on semesters for select using (auth.role() = 'authenticated');
create policy "semesters_admin_write" on semesters for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

create policy "subjects_read_all" on subjects for select using (auth.role() = 'authenticated');
create policy "subjects_admin_write" on subjects for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

create policy "classes_read_all" on classes for select using (auth.role() = 'authenticated');
create policy "classes_admin_write" on classes for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

create policy "teachers_read_all" on teachers for select using (auth.role() = 'authenticated');
create policy "teachers_admin_write" on teachers for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

create policy "calendar_read_all" on calendar_events for select using (auth.role() = 'authenticated');
create policy "calendar_admin_write" on calendar_events for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

create policy "grade_weights_read_all" on grade_weights for select using (auth.role() = 'authenticated');
create policy "grade_weights_admin_write" on grade_weights for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

create policy "predicate_ranges_read_all" on predicate_ranges for select using (auth.role() = 'authenticated');
create policy "predicate_ranges_admin_write" on predicate_ranges for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

create policy "exams_read_all" on exams for select using (auth.role() = 'authenticated');
create policy "exams_admin_write" on exams for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "exams_teacher_write" on exams for insert with check (auth_role() in ('teacher','homeroom') and teacher_id = auth_teacher_id());
create policy "exams_teacher_update" on exams for update using (auth_role() in ('teacher','homeroom') and teacher_id = auth_teacher_id());

create policy "announcements_read_targeted" on announcements for select using (
  auth.role() = 'authenticated' and (
    target = 'semua' or target = auth_role()
    or (target = 'kelas tertentu' and class_id in (
      select class_id from student_class_history where student_id = auth_student_id() and is_active = true
      union
      select auth_homeroom_class_ids()
      union
      select auth_teacher_class_ids()
    ))
  )
);
create policy "announcements_admin_write" on announcements for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "announcements_teacher_write" on announcements for insert with check (auth_role() in ('teacher','homeroom'));

-- ----------------------------------------------------------------------------
-- PARENTS
-- ----------------------------------------------------------------------------
create policy "parents_admin_all" on parents for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "parents_self_select" on parents for select using (auth_role() = 'parent' and id = auth_parent_id());
create policy "parents_staff_select" on parents for select using (auth_role() in ('teacher','homeroom'));

-- ----------------------------------------------------------------------------
-- STUDENTS
-- ----------------------------------------------------------------------------
create policy "students_admin_all" on students for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "students_self_select" on students for select using (auth_role() = 'student' and id = auth_student_id());
create policy "students_parent_select" on students for select using (auth_role() = 'parent' and parent_id = auth_parent_id());
create policy "students_teacher_select" on students for select using (auth_role() = 'teacher' and id in (select auth_teacher_student_ids()));
create policy "students_homeroom_select" on students for select using (auth_role() = 'homeroom' and id in (select auth_homeroom_student_ids()));

-- ----------------------------------------------------------------------------
-- STUDENT_CLASS_HISTORY
-- ----------------------------------------------------------------------------
create policy "sch_admin_all" on student_class_history for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "sch_self_select" on student_class_history for select using (auth_role() = 'student' and student_id = auth_student_id());
create policy "sch_parent_select" on student_class_history for select using (
  auth_role() = 'parent' and student_id in (select id from students where parent_id = auth_parent_id())
);
create policy "sch_homeroom_select" on student_class_history for select using (
  auth_role() = 'homeroom' and class_id in (select auth_homeroom_class_ids())
);
create policy "sch_teacher_select" on student_class_history for select using (
  auth_role() = 'teacher' and class_id in (select auth_teacher_class_ids())
);

-- ----------------------------------------------------------------------------
-- SCHEDULES
-- ----------------------------------------------------------------------------
create policy "schedules_read_all" on schedules for select using (auth.role() = 'authenticated');
create policy "schedules_admin_write" on schedules for all using (auth_role() = 'admin') with check (auth_role() = 'admin');

-- ----------------------------------------------------------------------------
-- ATTENDANCE SESSIONS & ATTENDANCE
-- ----------------------------------------------------------------------------
create policy "att_sessions_admin_all" on attendance_sessions for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "att_sessions_teacher_all" on attendance_sessions for all using (
  auth_role() in ('teacher','homeroom') and teacher_id = auth_teacher_id()
) with check (auth_role() in ('teacher','homeroom') and teacher_id = auth_teacher_id());
create policy "att_sessions_student_select" on attendance_sessions for select using (
  auth_role() = 'student' and class_id in (select class_id from student_class_history where student_id = auth_student_id() and is_active = true)
);
create policy "att_sessions_homeroom_select" on attendance_sessions for select using (
  auth_role() = 'homeroom' and class_id in (select auth_homeroom_class_ids())
);
create policy "att_sessions_parent_select" on attendance_sessions for select using (
  auth_role() = 'parent' and class_id in (
    select class_id from student_class_history where student_id in (select id from students where parent_id = auth_parent_id()) and is_active = true
  )
);

create policy "attendance_admin_all" on attendance for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "attendance_teacher_all" on attendance for all using (
  auth_role() in ('teacher','homeroom') and session_id in (select id from attendance_sessions where teacher_id = auth_teacher_id())
) with check (
  auth_role() in ('teacher','homeroom') and session_id in (select id from attendance_sessions where teacher_id = auth_teacher_id())
);
create policy "attendance_student_select" on attendance for select using (auth_role() = 'student' and student_id = auth_student_id());
create policy "attendance_student_insert_qr" on attendance for insert with check (auth_role() = 'student' and student_id = auth_student_id() and marked_via = 'qr');
create policy "attendance_parent_select" on attendance for select using (
  auth_role() = 'parent' and student_id in (select id from students where parent_id = auth_parent_id())
);
create policy "attendance_homeroom_select" on attendance for select using (
  auth_role() = 'homeroom' and student_id in (select auth_homeroom_student_ids())
);

-- ----------------------------------------------------------------------------
-- GRADES
-- ----------------------------------------------------------------------------
create policy "grades_admin_all" on grades for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "grades_teacher_all" on grades for all using (
  auth_role() in ('teacher','homeroom') and teacher_id = auth_teacher_id() and status = 'draft'
) with check (
  auth_role() in ('teacher','homeroom') and teacher_id = auth_teacher_id()
);
create policy "grades_teacher_select" on grades for select using (
  auth_role() in ('teacher','homeroom') and teacher_id = auth_teacher_id()
);
create policy "grades_student_select" on grades for select using (auth_role() = 'student' and student_id = auth_student_id());
create policy "grades_parent_select" on grades for select using (
  auth_role() = 'parent' and student_id in (select id from students where parent_id = auth_parent_id())
);
create policy "grades_homeroom_select" on grades for select using (
  auth_role() = 'homeroom' and student_id in (select auth_homeroom_student_ids())
);

-- ----------------------------------------------------------------------------
-- REPORT CARDS & HOMEROOM NOTES
-- ----------------------------------------------------------------------------
create policy "report_cards_admin_all" on report_cards for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "report_cards_self_select" on report_cards for select using (auth_role() = 'student' and student_id = auth_student_id());
create policy "report_cards_parent_select" on report_cards for select using (
  auth_role() = 'parent' and student_id in (select id from students where parent_id = auth_parent_id())
);
create policy "report_cards_homeroom_all" on report_cards for all using (
  auth_role() = 'homeroom' and student_id in (select auth_homeroom_student_ids())
) with check (auth_role() = 'homeroom' and student_id in (select auth_homeroom_student_ids()));

create policy "homeroom_notes_admin_all" on homeroom_notes for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "homeroom_notes_homeroom_all" on homeroom_notes for all using (
  auth_role() = 'homeroom' and student_id in (select auth_homeroom_student_ids())
) with check (auth_role() = 'homeroom' and student_id in (select auth_homeroom_student_ids()));
create policy "homeroom_notes_self_select" on homeroom_notes for select using (auth_role() = 'student' and student_id = auth_student_id());
create policy "homeroom_notes_parent_select" on homeroom_notes for select using (
  auth_role() = 'parent' and student_id in (select id from students where parent_id = auth_parent_id())
);

-- ----------------------------------------------------------------------------
-- CLASS PROMOTIONS
-- ----------------------------------------------------------------------------
create policy "promotions_admin_all" on class_promotions for all using (auth_role() = 'admin') with check (auth_role() = 'admin');
create policy "promotions_homeroom_all" on class_promotions for all using (
  auth_role() = 'homeroom' and student_id in (select auth_homeroom_student_ids())
) with check (auth_role() = 'homeroom' and student_id in (select auth_homeroom_student_ids()));
create policy "promotions_self_select" on class_promotions for select using (auth_role() = 'student' and student_id = auth_student_id());
create policy "promotions_parent_select" on class_promotions for select using (
  auth_role() = 'parent' and student_id in (select id from students where parent_id = auth_parent_id())
);

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS — hanya milik sendiri
-- ----------------------------------------------------------------------------
create policy "notifications_self_all" on notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_admin_insert" on notifications for insert with check (auth_role() = 'admin');

-- ----------------------------------------------------------------------------
-- AUDIT LOG — hanya admin yang bisa membaca; siapapun boleh insert log aktivitasnya sendiri
-- ----------------------------------------------------------------------------
create policy "audit_admin_select" on audit_logs for select using (auth_role() = 'admin');
create policy "audit_self_insert" on audit_logs for insert with check (user_id = auth.uid());
