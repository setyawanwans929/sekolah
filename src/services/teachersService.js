import { supabase } from '../lib/supabase'

export async function listTeachers({ search = '', page = 1, pageSize = 10 } = {}) {
  let query = supabase.from('teachers').select('*, subject:main_subject_id(name)', { count: 'exact' })
  if (search) query = query.or(`full_name.ilike.%${search}%,nip.ilike.%${search}%`)
  const from = (page - 1) * pageSize
  query = query.order('full_name').range(from, from + pageSize - 1)
  const { data, error, count } = await query
  if (error) throw error
  return { data, count }
}

export async function getTeacher(id) {
  const { data, error } = await supabase.from('teachers').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createTeacher(payload) {
  const { data, error } = await supabase.from('teachers').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateTeacher(id, payload) {
  const { data, error } = await supabase.from('teachers').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTeacher(id) {
  const { error } = await supabase.from('teachers').delete().eq('id', id)
  if (error) throw error
}
