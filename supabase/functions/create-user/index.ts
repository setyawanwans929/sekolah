// Supabase Edge Function: create-user
// Dipanggil dari halaman Admin > Kelola Pengguna di aplikasi EduTrack.
// Membuat akun Supabase Auth baru DAN menghubungkannya ke tabel profiles,
// semua dalam satu langkah, tanpa Admin perlu membuka Supabase Dashboard.
//
// PENTING: Fungsi ini memakai SERVICE_ROLE_KEY yang hanya tersimpan sebagai
// secret di sisi server Supabase (bukan di frontend), dan HANYA mengizinkan
// pemanggil yang terverifikasi sebagai role 'admin' di tabel profiles.

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Verifikasi pemanggil adalah admin yang sedang login (pakai token dari header Authorization)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Tidak ada token otorisasi.')

    const callerClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !userData?.user) throw new Error('Token tidak valid atau sesi berakhir.')

    const { data: callerProfile, error: profileErr } = await callerClient
      .from('profiles').select('role').eq('id', userData.user.id).single()
    if (profileErr || callerProfile?.role !== 'admin') {
      throw new Error('Hanya Admin yang boleh membuat akun pengguna.')
    }

    // 2. Ambil data dari body request
    const body = await req.json()
    const { email, password, fullName, role, teacherId, studentId, parentId } = body

    if (!email || !password || !role) throw new Error('Email, password, dan role wajib diisi.')
    if (!['admin', 'teacher', 'homeroom', 'student', 'parent'].includes(role)) {
      throw new Error('Role tidak valid.')
    }

    // 3. Buat client dengan service_role key (bypass RLS, hanya di server)
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 4. Buat user di Supabase Auth (langsung terkonfirmasi, tidak perlu verifikasi email)
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { role },
    })
    if (createErr) throw new Error('Gagal membuat akun: ' + createErr.message)

    // 5. Update baris profiles yang otomatis dibuat oleh trigger handle_new_auth_user,
    //    isi role yang benar & hubungkan ke entitas (teacher_id/student_id/parent_id)
    const { error: updateErr } = await adminClient.from('profiles').update({
      full_name: fullName || null,
      role,
      teacher_id: role === 'teacher' || role === 'homeroom' ? teacherId : null,
      student_id: role === 'student' ? studentId : null,
      parent_id: role === 'parent' ? parentId : null,
    }).eq('id', created.user.id)
    if (updateErr) throw new Error('Akun dibuat tapi gagal menghubungkan profil: ' + updateErr.message)

    return new Response(JSON.stringify({ success: true, userId: created.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
