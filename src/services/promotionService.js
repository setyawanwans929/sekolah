import { supabase } from '../lib/supabase'

export async function promoteStudents({ studentIds, fromClassId, toClassId, decision, academicYearId, semesterId, decidedBy }) {
  // decision: 'naik' | 'tinggal' | 'lulus' | 'pindah'
  const rows = studentIds.map((student_id) => ({
    student_id, previous_class_id: fromClassId, new_class_id: decision === 'naik' ? toClassId : fromClassId,
    academic_year_id: academicYearId, semester_id: semesterId, decision, decided_by: decidedBy,
    decided_at: new Date().toISOString(),
  }))
  const { data, error } = await supabase.from('class_promotions').insert(rows).select()
  if (error) throw error

  if (decision === 'naik' && toClassId) {
    await supabase.from('student_class_history').update({ is_active: false }).in('student_id', studentIds).eq('class_id', fromClassId).eq('is_active', true)
    const newHist = studentIds.map((student_id) => ({
      student_id, class_id: toClassId, academic_year_id: academicYearId, semester_id: semesterId,
      is_active: true, entry_date: new Date().toISOString().slice(0, 10),
    }))
    await supabase.from('student_class_history').insert(newHist)
  } else if (decision === 'lulus') {
    await supabase.from('students').update({ status: 'lulus' }).in('id', studentIds)
    await supabase.from('student_class_history').update({ is_active: false }).in('student_id', studentIds).eq('is_active', true)
  } else if (decision === 'pindah') {
    await supabase.from('students').update({ status: 'pindah' }).in('id', studentIds)
    await supabase.from('student_class_history').update({ is_active: false }).in('student_id', studentIds).eq('is_active', true)
  }
  // 'tinggal' (tidak naik): histori kelas lama tetap aktif, tidak dihapus — sesuai ketentuan.
  return data
}

export async function promotionHistory(studentId) {
  const { data, error } = await supabase.from('class_promotions')
    .select('*, previous_class:previous_class_id(name), new_class:new_class_id(name)')
    .eq('student_id', studentId).order('decided_at', { ascending: false })
  if (error) throw error
  return data
}
