// Skrip seed data EduTrack — dijalankan lokal via `npm run seed`.
// Menggunakan service_role key (hanya di lingkungan lokal, TIDAK PERNAH untuk frontend).
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Set VITE_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sebagai environment variable terlebih dahulu.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const FIRST_NAMES = ['Andi','Budi','Citra','Dewi','Eka','Fajar','Gita','Hadi','Indah','Joko','Kiki','Lina','Made','Nia','Oki','Putri','Rian','Sari','Tono','Umi','Vera','Wahyu','Yani','Zaki','Rina','Bayu','Dian','Farhan','Gina','Hendra']
const LAST_NAMES = ['Saputra','Wijaya','Kusuma','Pratama','Lestari','Santoso','Hidayat','Rahayu','Nugroho','Wati']

function randomName(i) { return `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}` }

async function createAuthUser(email, password, role) {
  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { role },
  })
  if (error && !error.message.includes('already been registered')) throw error
  if (error) {
    const { data: list } = await supabase.auth.admin.listUsers()
    return list.users.find((u) => u.email === email)
  }
  return data.user
}

async function main() {
  console.log('🌱 Memulai seeding EduTrack...')

  // 1. Tahun ajaran & semester
  const { data: year } = await supabase.from('academic_years').upsert({ name: '2026/2027', is_active: true }, { onConflict: 'name' }).select().single()
  const { data: sem } = await supabase.from('semesters').upsert({ academic_year_id: year.id, name: 'Ganjil', is_active: true }, { onConflict: 'academic_year_id,name' }).select().single()
  console.log('✔ Tahun ajaran & semester dibuat')

  // 2. Mata pelajaran
  const subjectDefs = [
    ['PWEB', 'Pemrograman Web', 90], ['BD', 'Basis Data', 85], ['PBO', 'Pemrograman Berorientasi Objek', 80],
    ['MTK', 'Matematika', 75], ['BINDO', 'Bahasa Indonesia', 75], ['BING', 'Bahasa Inggris', 75],
    ['PRPL', 'Produktif RPL', 85], ['PKN', 'PPKn', 75], ['PJOK', 'PJOK', 75], ['SENI', 'Seni Budaya', 75],
  ]
  const subjects = []
  for (const [code, name, kkm] of subjectDefs) {
    const { data } = await supabase.from('subjects').upsert({ code, name, kkm, group_name: 'Produktif' }, { onConflict: 'code' }).select().single()
    subjects.push(data)
  }
  console.log(`✔ ${subjects.length} mata pelajaran dibuat`)

  // 3. Guru (10, akun 1-3 dipakai untuk login demo)
  const teachers = []
  for (let i = 0; i < 10; i++) {
    const name = `${randomName(i)}, S.Pd.`
    const { data: teacher } = await supabase.from('teachers').upsert(
      { nip: `19800101${String(i).padStart(4, '0')}`, full_name: name, main_subject_id: subjects[i % subjects.length].id, email: `guru${i + 1}@edutrack.sch.id` },
      { onConflict: 'nip' }
    ).select().single()
    teachers.push(teacher)
    if (i < 3) {
      const authUser = await createAuthUser(`guru${i + 1}@edutrack.sch.id`, 'Guru123!', i === 0 ? 'homeroom' : 'teacher')
      await supabase.from('profiles').upsert({ id: authUser.id, email: authUser.email, full_name: name, role: i === 0 ? 'homeroom' : 'teacher', teacher_id: teacher.id })
    }
  }
  console.log('✔ 10 guru dibuat (3 akun login demo)')

  // 4. Admin
  const adminUser = await createAuthUser('admin@edutrack.sch.id', 'Admin123!', 'admin')
  await supabase.from('profiles').upsert({ id: adminUser.id, email: adminUser.email, full_name: 'Administrator Sekolah', role: 'admin' })
  console.log('✔ Akun admin dibuat')

  // 5. Kelas (5 kelas)
  const classDefs = [['X RPL 1', 'X'], ['X RPL 2', 'X'], ['XI RPL 1', 'XI'], ['XII RPL 1', 'XII'], ['XII RPL 2', 'XII']]
  const classes = []
  for (let i = 0; i < classDefs.length; i++) {
    const [name, level] = classDefs[i]
    const { data } = await supabase.from('classes').upsert(
      { name, grade_level: level, major: 'RPL', academic_year_id: year.id, homeroom_teacher_id: teachers[i].id, capacity: 36 },
      { onConflict: 'name,academic_year_id' }
    ).select().single()
    classes.push(data)
  }
  // Kelas pertama diwalikan oleh guru dengan akun homeroom demo
  await supabase.from('classes').update({ homeroom_teacher_id: teachers[0].id }).eq('id', classes[0].id)
  console.log(`✔ ${classes.length} kelas dibuat`)

  // 6. Siswa (50), 3 akun login demo + orang tua
  const students = []
  for (let i = 0; i < 50; i++) {
    const name = randomName(i)
    const cls = classes[i % classes.length]
    const { data: student } = await supabase.from('students').upsert(
      { nis: `2026${String(i + 1).padStart(4, '0')}`, nisn: `00${String(i + 1).padStart(8, '0')}`, full_name: name, gender: i % 2 === 0 ? 'L' : 'P', entry_year: 2026, status: 'aktif' },
      { onConflict: 'nis' }
    ).select().single()
    students.push({ student, cls })
    // Catatan: student_class_history hanya punya unique index PARSIAL (is_active=true),
    // sehingga upsert biasa tidak bisa menargetkannya. Karena seed berjalan pada DB baru,
    // cukup insert langsung; abaikan error jika baris memang sudah ada (re-run seed).
    const { error: schErr } = await supabase.from('student_class_history').insert(
      { student_id: student.id, class_id: cls.id, academic_year_id: year.id, semester_id: sem.id, is_active: true }
    )
    if (schErr && !schErr.message.includes('duplicate')) console.warn('  (peringatan) student_class_history:', schErr.message)
    if (i < 3) {
      const authUser = await createAuthUser(`siswa${i + 1}@edutrack.sch.id`, 'Siswa123!', 'student')
      await supabase.from('profiles').upsert({ id: authUser.id, email: authUser.email, full_name: name, role: 'student', student_id: student.id })
    }
  }
  console.log('✔ 50 siswa dibuat (3 akun login demo)')

  // 7. Orang tua demo untuk siswa pertama
  const { data: parent } = await supabase.from('parents').insert({ full_name: 'Bapak/Ibu ' + students[0].student.full_name, relation: 'Wali', phone: '08123456789' }).select().single()
  await supabase.from('students').update({ parent_id: parent.id }).eq('id', students[0].student.id)
  const parentUser = await createAuthUser('ortu1@edutrack.sch.id', 'Ortu123!', 'parent')
  await supabase.from('profiles').upsert({ id: parentUser.id, email: parentUser.email, full_name: parent.full_name, role: 'parent', parent_id: parent.id })
  console.log('✔ Akun orang tua demo dibuat')

  // 8. Jadwal (±30) — sebar per kelas x mapel x hari, hindari bentrok sederhana
  const days = [1, 2, 3, 4, 5]
  const slots = [['07:00', '08:30'], ['08:30', '10:00'], ['10:15', '11:45']]
  let scheduleCount = 0
  for (const cls of classes) {
    let s = 0
    for (const day of days) {
      const [start, end] = slots[s % slots.length]
      const subj = subjects[(s + classes.indexOf(cls)) % subjects.length]
      const teacher = teachers[(s + classes.indexOf(cls)) % teachers.length]
      const { error } = await supabase.from('schedules').insert({
        day_of_week: day, start_time: start, end_time: end, teacher_id: teacher.id, subject_id: subj.id,
        class_id: cls.id, room: `Lab ${classes.indexOf(cls) + 1}`, academic_year_id: year.id, semester_id: sem.id,
      })
      if (!error) scheduleCount++
      s++
    }
  }
  console.log(`✔ ${scheduleCount} jadwal dibuat`)

  // 9. Absensi contoh (3 pertemuan pertama tiap kelas)
  for (const cls of classes) {
    const members = students.filter((s) => s.cls.id === cls.id)
    for (let meeting = 1; meeting <= 3; meeting++) {
      const { data: session } = await supabase.from('attendance_sessions').insert({
        class_id: cls.id, subject_id: subjects[0].id, teacher_id: teachers[0].id, session_date: `2026-08-0${meeting}`,
        meeting_number: meeting, academic_year_id: year.id, semester_id: sem.id,
      }).select().single()
      const rows = members.map((m) => ({ session_id: session.id, student_id: m.student.id, status: Math.random() > 0.1 ? 'hadir' : 'sakit' }))
      await supabase.from('attendance').insert(rows)
    }
  }
  console.log('✔ Data absensi contoh dibuat')

  // 10. Nilai contoh
  for (const { student } of students) {
    for (const subj of subjects.slice(0, 4)) {
      for (const component of ['tugas', 'uts', 'uas']) {
        await supabase.from('grades').upsert({
          student_id: student.id, subject_id: subj.id, teacher_id: teachers[0].id, component,
          score: Math.floor(65 + Math.random() * 35), semester_id: sem.id, academic_year_id: year.id,
        }, { onConflict: 'student_id,subject_id,component,semester_id' })
      }
    }
  }
  console.log('✔ Data nilai contoh dibuat')

  // 11. Pengumuman & ujian contoh
  await supabase.from('announcements').insert([
    { title: 'Libur Semester Ganjil', content: 'Libur semester ganjil dimulai 20 Desember 2026.', target: 'semua' },
    { title: 'Rapat Wali Murid', content: 'Rapat wali murid akan diadakan pekan depan.', target: 'orang tua' },
  ])
  await supabase.from('exams').insert([
    { name: 'UTS Ganjil - Pemrograman Web', exam_type: 'UTS', subject_id: subjects[0].id, class_id: classes[0].id, teacher_id: teachers[0].id, exam_date: '2026-10-10', start_time: '08:00' },
  ])
  console.log('✔ Pengumuman & jadwal ujian contoh dibuat')

  console.log('\n🎉 Seeding selesai! Lihat supabase/seed/README.md untuk daftar akun demo.')
}

main().catch((err) => { console.error('❌ Seeding gagal:', err.message); process.exit(1) })
