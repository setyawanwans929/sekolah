import { supabase } from '../lib/supabase'

export async function listNotifications(userId) {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
  if (error) throw error
  return data
}
export async function markAsRead(id) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  if (error) throw error
}
export async function markAllAsRead(userId) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
  if (error) throw error
}
export async function createNotification(payload) {
  const { error } = await supabase.from('notifications').insert(payload)
  if (error) throw error
}
