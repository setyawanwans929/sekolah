-- ============================================================================
-- EduTrack — Supabase Storage: bucket 'avatars' untuk foto siswa & guru
-- Jalankan setelah migrasi lain. Bisa juga dibuat via Dashboard > Storage.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Siapa saja yang sudah login boleh melihat foto (bucket bersifat publik untuk foto profil sekolah)
create policy "avatars_read_all" on storage.objects for select
  using (bucket_id = 'avatars');

-- Hanya admin yang boleh mengunggah/mengubah/menghapus foto
create policy "avatars_admin_write" on storage.objects for insert
  with check (bucket_id = 'avatars' and (select role from profiles where id = auth.uid()) = 'admin');

create policy "avatars_admin_update" on storage.objects for update
  using (bucket_id = 'avatars' and (select role from profiles where id = auth.uid()) = 'admin');

create policy "avatars_admin_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and (select role from profiles where id = auth.uid()) = 'admin');
