import { supabase } from '../lib/supabase'

export async function listParents({ search = '', page = 1, pageSize = 10 } = {}) {
  let query = supabase.from('parents').select('*, students(id, full_name)', { count: 'exact' })
  if (search) query = query.ilike('full_name', `%${search}%`)
  const from = (page - 1) * pageSize
  query = query.order('full_name').range(from, from + pageSize - 1)
  const { data, error, count } = await query
  if (error) throw error
  return { data, count }
}

export async function createParent(payload) {
  const { data, error } = await supabase.from('parents').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateParent(id, payload) {
  const { data, error } = await supabase.from('parents').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteParent(id) {
  const { error } = await supabase.from('parents').delete().eq('id', id)
  if (error) throw error
}

export async function linkChildToParent(parentId, studentId) {
  const { error } = await supabase.from('students').update({ parent_id: parentId }).eq('id', studentId)
  if (error) throw error
}
