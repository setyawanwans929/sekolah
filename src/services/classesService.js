import { supabase } from '../lib/supabase'

export async function listClasses({ academicYearId } = {}) {
  let query = supabase.from('classes').select('*, homeroom_teacher:homeroom_teacher_id(full_name)')
  if (academicYearId) query = query.eq('academic_year_id', academicYearId)
  const { data, error } = await query.order('name')
  if (error) throw error
  return data
}

export async function getClass(id) {
  const { data, error } = await supabase.from('classes').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createClass(payload) {
  const { data, error } = await supabase.from('classes').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateClass(id, payload) {
  const { data, error } = await supabase.from('classes').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteClass(id) {
  const { error } = await supabase.from('classes').delete().eq('id', id)
  if (error) throw error
}

export async function classStudents(classId) {
  const { data, error } = await supabase
    .from('student_class_history')
    .select('id, student:student_id(id, nis, full_name, photo_url, status)')
    .eq('class_id', classId)
    .eq('is_active', true)
  if (error) throw error
  return data
}

export async function unassignedStudents(academicYearId) {
  // Siswa aktif yang belum punya baris student_class_history aktif pada tahun ajaran ini
  const { data: assigned, error: e1 } = await supabase
    .from('student_class_history')
    .select('student_id')
    .eq('academic_year_id', academicYearId)
    .eq('is_active', true)
  if (e1) throw e1
  const assignedIds = assigned.map((r) => r.student_id)
  let query = supabase.from('students').select('id, nis, full_name').eq('status', 'aktif')
  if (assignedIds.length) query = query.not('id', 'in', `(${assignedIds.join(',')})`)
  const { data, error } = await query
  if (error) throw error
  return data
}

// Menempatkan/memindahkan siswa ke kelas. Menonaktifkan penempatan aktif sebelumnya
// pada tahun ajaran & semester yang sama sebelum membuat yang baru (mencegah double-kelas).
export async function assignStudentsToClass({ studentIds, classId, academicYearId, semesterId }) {
  const { error: deactivateErr } = await supabase
    .from('student_class_history')
    .update({ is_active: false })
    .in('student_id', studentIds)
    .eq('academic_year_id', academicYearId)
    .eq('is_active', true)
  if (deactivateErr) throw deactivateErr

  const rows = studentIds.map((student_id) => ({
    student_id, class_id: classId, academic_year_id: academicYearId,
    semester_id: semesterId, is_active: true, entry_date: new Date().toISOString().slice(0, 10),
  }))
  const { data, error } = await supabase.from('student_class_history').insert(rows).select()
  if (error) throw error
  return data
}

export async function removeStudentFromClass(historyId) {
  const { error } = await supabase.from('student_class_history').update({ is_active: false }).eq('id', historyId)
  if (error) throw error
}
