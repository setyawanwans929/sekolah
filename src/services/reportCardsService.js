import { supabase } from '../lib/supabase'
import { computeFinalScore, autoDescription } from './gradesService'

export async function getReportCardData({ studentId, semesterId }) {
  const { data: student, error: e1 } = await supabase.from('students').select('*, parent:parent_id(full_name)').eq('id', studentId).single()
  if (e1) throw e1

  const { data: hist } = await supabase.from('student_class_history')
    .select('class:class_id(id, name, homeroom_teacher:homeroom_teacher_id(full_name))')
    .eq('student_id', studentId).eq('semester_id', semesterId).eq('is_active', true).maybeSingle()

  const { data: grades } = await supabase.from('grades')
    .select('component, score, subject:subject_id(id, name, kkm)')
    .eq('student_id', studentId).eq('semester_id', semesterId)

  const { data: weights } = await supabase.from('grade_weights').select('*')
  const { data: predicateRanges } = await supabase.from('predicate_ranges').select('*')

  const bySubject = {}
  for (const g of grades || []) {
    const key = g.subject.id
    if (!bySubject[key]) bySubject[key] = { subject: g.subject, components: {} }
    bySubject[key].components[g.component] = g.score
  }
  const subjects = Object.values(bySubject).map((s) => {
    const final = computeFinalScore(s.components, weights || [])
    return {
      name: s.subject.name, kkm: s.subject.kkm, final,
      predicate: final != null ? (predicateRanges || []).find((r) => final >= r.min_score && final <= r.max_score)?.label ?? '-' : '-',
      description: final != null ? autoDescription(final) : '-',
    }
  })

  const { data: noteRow } = await supabase.from('homeroom_notes').select('*').eq('student_id', studentId).eq('semester_id', semesterId).maybeSingle()

  const { data: attendanceRows } = await supabase.from('attendance')
    .select('status, session:session_id(semester_id)')
    .eq('student_id', studentId)
  const semAttendance = (attendanceRows || []).filter((a) => a.session?.semester_id === semesterId)
  const total = semAttendance.length
  const hadir = semAttendance.filter((a) => a.status === 'hadir').length

  return {
    student, class: hist?.class ?? null, subjects,
    homeroomNote: noteRow ?? null,
    attendance: {
      hadir, total,
      sakit: semAttendance.filter((a) => a.status === 'sakit').length,
      izin: semAttendance.filter((a) => a.status === 'izin').length,
      alpa: semAttendance.filter((a) => a.status === 'alpa').length,
      percentage: total ? Math.round((hadir / total) * 1000) / 10 : 0,
    },
  }
}
