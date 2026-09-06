import { supabase } from '../lib/supabase'

export async function logActivity({ userId, role, action, relatedTable, relatedId, detail }) {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId, role, action, related_table: relatedTable, related_id: relatedId, detail,
  })
  if (error) console.error('Gagal mencatat audit log:', error.message)
}

export async function listAuditLogs({ page = 1, pageSize = 20 } = {}) {
  const from = (page - 1) * pageSize
  const { data, error, count } = await supabase.from('audit_logs')
    .select('*, user:user_id(full_name:email)', { count: 'exact' })
    .order('created_at', { ascending: false }).range(from, from + pageSize - 1)
  if (error) throw error
  return { data, count }
}
