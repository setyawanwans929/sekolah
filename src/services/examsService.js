import { supabase } from '../lib/supabase'

export async function listExams({ classId } = {}) {
  let query = supabase.from('exams').select('*, subject:subject_id(name), class:class_id(name), teacher:teacher_id(full_name)').order('exam_date')
  if (classId) query = query.eq('class_id', classId)
  const { data, error } = await query
  if (error) throw error
  return data
}
export async function createExam(payload) {
  const { data, error } = await supabase.from('exams').insert(payload).select().single()
  if (error) throw error
  return data
}
export async function updateExam(id, payload) {
  const { data, error } = await supabase.from('exams').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function deleteExam(id) {
  const { error } = await supabase.from('exams').delete().eq('id', id)
  if (error) throw error
}
