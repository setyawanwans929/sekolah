import { supabase } from '../lib/supabase'

const SELECT = `
  id, nis, nisn, full_name, nickname, gender, birth_place, birth_date,
  address, phone, email, photo_url, entry_year, status, created_at, updated_at,
  parent:parent_id ( id, full_name, phone ),
  current_class:student_class_history!student_class_history_student_id_fkey (
    id, is_active, class:class_id ( id, name, grade_level )
  )
`

export async function listStudents({ search = '', status = '', page = 1, pageSize = 10 } = {}) {
  let query = supabase.from('students').select('*', { count: 'exact' })
  if (search) query = query.or(`full_name.ilike.%${search}%,nis.ilike.%${search}%,nisn.ilike.%${search}%`)
  if (status) query = query.eq('status', status)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.order('full_name', { ascending: true }).range(from, to)
  const { data, error, count } = await query
  if (error) throw error
  return { data, count }
}

export async function getStudent(id) {
  const { data, error } = await supabase.from('students').select(SELECT).eq('id', id).single()
  if (error) throw error
  return data
}

export async function createStudent(payload) {
  const { data, error } = await supabase.from('students').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateStudent(id, payload) {
  const { data, error } = await supabase.from('students').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteStudent(id) {
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) throw error
}

export async function bulkImportStudents(rows) {
  // rows sudah melalui validasi di UI (lihat pages/admin/StudentsImport.jsx)
  const { data, error } = await supabase.from('students').insert(rows).select()
  if (error) throw error
  return data
}
