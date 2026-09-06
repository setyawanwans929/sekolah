# Class / Component Diagram (Frontend)

```mermaid
flowchart TB
  App --> AuthProvider
  App --> ThemeProvider
  App --> ToastProvider
  App --> Router[React Router]

  Router --> ProtectedRoute
  ProtectedRoute --> DashboardLayout
  DashboardLayout --> AdminPages
  DashboardLayout --> TeacherPages
  DashboardLayout --> HomeroomPages
  DashboardLayout --> StudentPages
  DashboardLayout --> ParentLayout --> ParentPages

  AdminPages --> Services[services/*.js]
  TeacherPages --> Services
  HomeroomPages --> Services
  StudentPages --> Services
  ParentPages --> Services

  Services --> SupabaseClient[lib/supabase.js]
  SupabaseClient --> SupabaseBackend[(Supabase: Auth, PostgreSQL, Storage)]
```

Setiap file di `src/services/` merepresentasikan satu "domain service" yang
membungkus query Supabase untuk satu tabel/grup tabel (mis. `studentsService.js`,
`gradesService.js`), sehingga komponen halaman tidak menulis query SQL/Supabase
secara langsung — memudahkan pengujian dan pemeliharaan.
