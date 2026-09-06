import { supabase } from '../lib/supabase'

const SELECT = `
  id, day_of_week, start_time, end_time, room, academic_year_id, semester_id,
  teacher:teacher_id ( id, full_name ),
  subject:subject_id ( id, name, code ),
  class:class_id ( id, name )
`

export async function listSchedules({ classId, teacherId, semesterId } = {}) {
  let query = supabase.from('schedules').select(SELECT)
  if (classId) query = query.eq('class_id', classId)
  if (teacherId) query = query.eq('teacher_id', teacherId)
  if (semesterId) query = query.eq('semester_id', semesterId)
  const { data, error } = await query.order('day_of_week').order('start_time')
  if (error) throw error
  return data
}

// Deteksi bentrok di sisi client sebelum insert/update (pertahanan lapis pertama;
// lapis kedua ditegakkan oleh trigger `prevent_schedule_conflict` di database).
export async function checkScheduleConflict({ id, dayOfWeek, startTime, endTime, teacherId, classId, room, semesterId }) {
  const overlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd

  let query = supabase.from('schedules').select('*').eq('day_of_week', dayOfWeek).eq('semester_id', semesterId)
  if (id) query = query.neq('id', id)
  const { data, error } = await query
  if (error) throw error

  const conflicts = []
  for (const s of data) {
    if (!overlap(startTime, endTime, s.start_time, s.end_time)) continue
    if (s.teacher_id === teacherId) conflicts.push('Guru sudah mengajar kelas lain pada jam ini.')
    if (s.class_id === classId) conflicts.push('Kelas sudah memiliki mata pelajaran lain pada jam ini.')
    if (room && s.room === room) conflicts.push('Ruangan sudah dipakai kelas lain pada jam ini.')
  }
  return conflicts // array kosong = tidak ada bentrok
}

export async function createSchedule(payload) {
  const conflicts = await checkScheduleConflict({
    dayOfWeek: payload.day_of_week, startTime: payload.start_time, endTime: payload.end_time,
    teacherId: payload.teacher_id, classId: payload.class_id, room: payload.room, semesterId: payload.semester_id,
  })
  if (conflicts.length) throw new Error('Jadwal bentrok dengan jadwal lain: ' + conflicts.join(' '))
  const { data, error } = await supabase.from('schedules').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateSchedule(id, payload) {
  const conflicts = await checkScheduleConflict({
    id, dayOfWeek: payload.day_of_week, startTime: payload.start_time, endTime: payload.end_time,
    teacherId: payload.teacher_id, classId: payload.class_id, room: payload.room, semesterId: payload.semester_id,
  })
  if (conflicts.length) throw new Error('Jadwal bentrok dengan jadwal lain: ' + conflicts.join(' '))
  const { data, error } = await supabase.from('schedules').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteSchedule(id) {
  const { error } = await supabase.from('schedules').delete().eq('id', id)
  if (error) throw error
}
