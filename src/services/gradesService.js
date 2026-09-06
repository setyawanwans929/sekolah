import { supabase } from '../lib/supabase'

export async function listGrades({ studentId, classId, subjectId, semesterId }) {
  let query = supabase.from('grades').select(`
    id, component, score, status, locked_by, locked_at,
    student:student_id(id, full_name, nis),
    subject:subject_id(id, name, kkm),
    teacher:teacher_id(full_name)
  `).eq('semester_id', semesterId)
  if (studentId) query = query.eq('student_id', studentId)
  if (subjectId) query = query.eq('subject_id', subjectId)
  const { data, error } = await query
  if (error) throw error
  let rows = data
  if (classId) {
    const { data: hist } = await supabase.from('student_class_history').select('student_id').eq('class_id', classId).eq('is_active', true)
    const ids = new Set((hist || []).map((h) => h.student_id))
    rows = rows.filter((r) => ids.has(r.student?.id))
  }
  return rows
}

export async function upsertGrade({ studentId, subjectId, teacherId, component, score, semesterId, academicYearId }) {
  const { data, error } = await supabase.from('grades').upsert({
    student_id: studentId, subject_id: subjectId, teacher_id: teacherId, component,
    score, semester_id: semesterId, academic_year_id: academicYearId, status: 'draft',
  }, { onConflict: 'student_id,subject_id,component,semester_id' }).select().single()
  if (error) throw error
  return data
}

export async function lockGrades({ classId, subjectId, semesterId, lockedBy }) {
  const { data: hist } = await supabase.from('student_class_history').select('student_id').eq('class_id', classId).eq('is_active', true)
  const studentIds = (hist || []).map((h) => h.student_id)
  const { data, error } = await supabase.from('grades')
    .update({ status: 'terkunci', locked_by: lockedBy, locked_at: new Date().toISOString() })
    .in('student_id', studentIds).eq('subject_id', subjectId).eq('semester_id', semesterId)
    .select()
  if (error) throw error
  return data
}

export async function unlockGrades({ classId, subjectId, semesterId }) {
  const { data: hist } = await supabase.from('student_class_history').select('student_id').eq('class_id', classId).eq('is_active', true)
  const studentIds = (hist || []).map((h) => h.student_id)
  const { data, error } = await supabase.from('grades')
    .update({ status: 'draft', locked_by: null, locked_at: null })
    .in('student_id', studentIds).eq('subject_id', subjectId).eq('semester_id', semesterId)
    .select()
  if (error) throw error
  return data
}

export async function getGradeWeights() {
  const { data, error } = await supabase.from('grade_weights').select('*').order('component')
  if (error) throw error
  return data
}

export async function updateGradeWeight(component, weight) {
  const { data, error } = await supabase.from('grade_weights').update({ weight }).eq('component', component).select().single()
  if (error) throw error
  return data
}

// Menghitung nilai akhir dari komponen nilai berdasarkan bobot (grade_weights)
export function computeFinalScore(componentScores, weights) {
  let total = 0
  let weightSum = 0
  for (const w of weights) {
    const s = componentScores[w.component]
    if (s === undefined || s === null) continue
    total += s * (w.weight / 100)
    weightSum += w.weight
  }
  return weightSum ? Math.round((total / (weightSum / 100)) * 10) / 10 : null
}

export function scoreToPredicate(score, ranges) {
  // ranges: [{min, max, label}], default A/B/C/D dari tabel `predicate_ranges`
  const r = ranges.find((r) => score >= r.min_score && score <= r.max_score)
  return r?.label ?? '-'
}

export function autoDescription(score) {
  if (score >= 85) return 'Menunjukkan penguasaan materi yang sangat baik.'
  if (score >= 70) return 'Menunjukkan penguasaan materi yang cukup baik.'
  return 'Perlu meningkatkan pemahaman dan latihan.'
}
