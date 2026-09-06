import { supabase } from '../lib/supabase'

export async function createSession({ classId, subjectId, teacherId, date, meetingNumber, academicYearId, semesterId, qrEnabled }) {
  const { data, error } = await supabase.from('attendance_sessions').insert({
    class_id: classId, subject_id: subjectId, teacher_id: teacherId, session_date: date,
    meeting_number: meetingNumber, academic_year_id: academicYearId, semester_id: semesterId,
    qr_enabled: !!qrEnabled, qr_token: qrEnabled ? crypto.randomUUID() : null,
    qr_expires_at: qrEnabled ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
  }).select().single()
  if (error) throw error
  return data
}

export async function getSession(id) {
  const { data, error } = await supabase.from('attendance_sessions').select('*, class:class_id(name), subject:subject_id(name)').eq('id', id).single()
  if (error) throw error
  return data
}

export async function listSessionAttendance(sessionId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('id, status, note, marked_via, student:student_id(id, nis, full_name, photo_url)')
    .eq('session_id', sessionId)
  if (error) throw error
  return data
}

export async function upsertAttendance({ sessionId, studentId, status, note, markedVia = 'manual' }) {
  // Unique constraint (session_id, student_id) di DB mencegah duplikasi absensi.
  const { data, error } = await supabase
    .from('attendance')
    .upsert({ session_id: sessionId, student_id: studentId, status, note, marked_via: markedVia }, { onConflict: 'session_id,student_id' })
    .select().single()
  if (error) throw error
  return data
}

export async function markAllPresent(sessionId, studentIds) {
  const rows = studentIds.map((student_id) => ({ session_id: sessionId, student_id, status: 'hadir', marked_via: 'manual' }))
  const { data, error } = await supabase.from('attendance').upsert(rows, { onConflict: 'session_id,student_id' }).select()
  if (error) throw error
  return data
}

// Absensi via QR: memvalidasi token & masa berlaku sesi, lalu mencatat kehadiran siswa yang login.
export async function markAttendanceByQr({ qrToken, studentId }) {
  const { data: session, error: e1 } = await supabase
    .from('attendance_sessions').select('*').eq('qr_token', qrToken).single()
  if (e1 || !session) throw new Error('Sesi QR tidak ditemukan.')
  if (!session.qr_enabled) throw new Error('Sesi ini tidak menggunakan QR.')
  if (new Date(session.qr_expires_at) < new Date()) throw new Error('Waktu absensi QR sudah berakhir.')

  const { data: existing } = await supabase.from('attendance').select('id').eq('session_id', session.id).eq('student_id', studentId).maybeSingle()
  if (existing) throw new Error('Kamu sudah tercatat hadir untuk sesi ini.')

  const { data, error } = await supabase.from('attendance').insert({
    session_id: session.id, student_id: studentId, status: 'hadir', marked_via: 'qr',
  }).select().single()
  if (error) throw error
  return { session, attendance: data }
}

export async function attendanceRecap({ studentId, classId, from, to, academicYearId, semesterId }) {
  let query = supabase.from('attendance').select('status, session:session_id(session_date, class_id, academic_year_id, semester_id)')
  if (studentId) query = query.eq('student_id', studentId)
  const { data, error } = await query
  if (error) throw error
  let rows = data
  if (classId) rows = rows.filter((r) => r.session?.class_id === classId)
  if (academicYearId) rows = rows.filter((r) => r.session?.academic_year_id === academicYearId)
  if (semesterId) rows = rows.filter((r) => r.session?.semester_id === semesterId)
  if (from) rows = rows.filter((r) => r.session?.session_date >= from)
  if (to) rows = rows.filter((r) => r.session?.session_date <= to)

  const summary = { hadir: 0, sakit: 0, izin: 0, alpa: 0, terlambat: 0 }
  rows.forEach((r) => { if (summary[r.status] !== undefined) summary[r.status]++ })
  const total = rows.length
  const percentage = total ? Math.round((summary.hadir / total) * 1000) / 10 : 0
  return { ...summary, total, percentage }
}
