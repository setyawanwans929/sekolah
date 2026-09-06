import { supabase } from '../lib/supabase'

export async function listSubjects() {
  const { data, error } = await supabase.from('subjects').select('*').order('name')
  if (error) throw error
  return data
}
export async function createSubject(payload) {
  const { data, error } = await supabase.from('subjects').insert(payload).select().single()
  if (error) throw error
  return data
}
export async function updateSubject(id, payload) {
  const { data, error } = await supabase.from('subjects').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function deleteSubject(id) {
  const { error } = await supabase.from('subjects').delete().eq('id', id)
  if (error) throw error
}
