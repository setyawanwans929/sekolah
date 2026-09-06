import { supabase } from '../lib/supabase'

export async function adminStats() {
  const [{ count: totalStudents }, { count: totalTeachers }, { count: totalClasses }, { count: totalSubjects }] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'aktif'),
    supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('status', 'aktif'),
    supabase.from('classes').select('*', { count: 'exact', head: true }),
    supabase.from('subjects').select('*', { count: 'exact', head: true }),
  ])

  const today = new Date().toISOString().slice(0, 10)
  const { data: sessionsToday } = await supabase.from('attendance_sessions').select('id').eq('session_date', today)
  const sessionIds = (sessionsToday || []).map((s) => s.id)
  let todayAttendance = { hadir: 0, sakit: 0, izin: 0, alpa: 0, terlambat: 0 }
  if (sessionIds.length) {
    const { data } = await supabase.from('attendance').select('status').in('session_id', sessionIds)
    ;(data || []).forEach((a) => { todayAttendance[a.status] = (todayAttendance[a.status] || 0) + 1 })
  }

  return { totalStudents, totalTeachers, totalClasses, totalSubjects, todayAttendance }
}

export async function studentsPerClass() {
  const { data, error } = await supabase.from('classes').select('name, student_class_history(count)')
  if (error) throw error
  return (data || []).map((c) => ({ name: c.name, count: c.student_class_history?.[0]?.count ?? 0 }))
}

export async function recentActivity(limit = 10) {
  const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data
}

export async function atRiskStudents({ attendanceThreshold = 75, gradeThreshold = 65 } = {}) {
  const { data: grades } = await supabase.from('grades').select('student_id, score, student:student_id(full_name)')
  const byStudent = {}
  for (const g of grades || []) {
    byStudent[g.student_id] ??= { name: g.student?.full_name, scores: [] }
    byStudent[g.student_id].scores.push(g.score)
  }
  const risky = []
  for (const [id, v] of Object.entries(byStudent)) {
    const avg = v.scores.reduce((a, b) => a + b, 0) / v.scores.length
    if (avg < gradeThreshold) risky.push({ studentId: id, name: v.name, reason: 'Perlu perhatian akademik (nilai)', value: avg.toFixed(1) })
  }
  return risky
}
