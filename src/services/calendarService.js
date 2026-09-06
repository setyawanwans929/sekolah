import { supabase } from '../lib/supabase'

export async function listCalendarEvents({ academicYearId } = {}) {
  let query = supabase.from('calendar_events').select('*').order('start_date')
  if (academicYearId) query = query.eq('academic_year_id', academicYearId)
  const { data, error } = await query
  if (error) throw error
  return data
}
export async function createCalendarEvent(payload) {
  const { data, error } = await supabase.from('calendar_events').insert(payload).select().single()
  if (error) throw error
  return data
}
export async function deleteCalendarEvent(id) {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) throw error
}
