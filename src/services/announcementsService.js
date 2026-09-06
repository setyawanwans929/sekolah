import { supabase } from '../lib/supabase'

export async function listAnnouncements({ target } = {}) {
  let query = supabase.from('announcements').select('*, author:author_id(full_name), class:class_id(name)').order('created_at', { ascending: false })
  if (target) query = query.or(`target.eq.semua,target.eq.${target}`)
  const { data, error } = await query
  if (error) throw error
  return data
}
export async function createAnnouncement(payload) {
  const { data, error } = await supabase.from('announcements').insert(payload).select().single()
  if (error) throw error
  return data
}
export async function updateAnnouncement(id, payload) {
  const { data, error } = await supabase.from('announcements').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}
export async function deleteAnnouncement(id) {
  const { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) throw error
}
