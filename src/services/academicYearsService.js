import { supabase } from '../lib/supabase'

export async function listAcademicYears() {
  const { data, error } = await supabase.from('academic_years').select('*, semesters(*)').order('name', { ascending: false })
  if (error) throw error
  return data
}

export async function getActiveAcademicYear() {
  const { data, error } = await supabase.from('academic_years').select('*, semesters(*)').eq('is_active', true).maybeSingle()
  if (error) throw error
  return data
}

export async function getActiveSemester() {
  const { data, error } = await supabase.from('semesters').select('*, academic_year:academic_year_id(*)').eq('is_active', true).maybeSingle()
  if (error) throw error
  return data
}

export async function createAcademicYear(payload) {
  const { data, error } = await supabase.from('academic_years').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function setActiveAcademicYear(id) {
  // Hanya boleh 1 tahun ajaran aktif — nonaktifkan semua lalu aktifkan target (juga ditegakkan oleh trigger DB)
  const { error: e1 } = await supabase.from('academic_years').update({ is_active: false }).neq('id', id)
  if (e1) throw e1
  const { error: e2 } = await supabase.from('academic_years').update({ is_active: true }).eq('id', id)
  if (e2) throw e2
}

export async function createSemester(payload) {
  const { data, error } = await supabase.from('semesters').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function setActiveSemester(id, academicYearId) {
  const { error: e1 } = await supabase.from('semesters').update({ is_active: false }).eq('academic_year_id', academicYearId)
  if (e1) throw e1
  const { error: e2 } = await supabase.from('semesters').update({ is_active: true }).eq('id', id)
  if (e2) throw e2
}
