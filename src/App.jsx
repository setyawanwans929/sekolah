import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isSupabaseConfigured } from './lib/supabase'
import { useAuth } from './context/AuthContext'
import ConfigWarning from './components/common/ConfigWarning'
import ProtectedRoute from './routes/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'
import ParentLayout from './layouts/ParentLayout'

import Login from './pages/auth/Login'
import Unauthorized from './pages/auth/Unauthorized'
import NotificationsPage from './pages/common/NotificationsPage'
import ReportCardPage from './pages/common/ReportCardPage'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentsPage from './pages/admin/StudentsPage'
import StudentDetailPage from './pages/admin/StudentDetailPage'
import StudentsImportPage from './pages/admin/StudentsImportPage'
import TeachersPage from './pages/admin/TeachersPage'
import ParentsPage from './pages/admin/ParentsPage'
import ClassesPage from './pages/admin/ClassesPage'
import ClassAssignmentPage from './pages/admin/ClassAssignmentPage'
import SubjectsPage from './pages/admin/SubjectsPage'
import AcademicYearsPage from './pages/admin/AcademicYearsPage'
import CalendarPage from './pages/admin/CalendarPage'
import SchedulesPage from './pages/admin/SchedulesPage'
import AttendanceRecapPage from './pages/admin/AttendanceRecapPage'
import GradeRecapPage from './pages/admin/GradeRecapPage'
import GradeWeightsPage from './pages/admin/GradeWeightsPage'
import PromotionPage from './pages/admin/PromotionPage'
import ExamsPage from './pages/admin/ExamsPage'
import AnnouncementsPage from './pages/admin/AnnouncementsPage'
import ReportsPage from './pages/admin/ReportsPage'
import AuditLogPage from './pages/admin/AuditLogPage'
import SettingsPage from './pages/admin/SettingsPage'

// Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherSchedulesPage from './pages/teacher/TeacherSchedulesPage'
import TeacherAttendancePage from './pages/teacher/TeacherAttendancePage'
import TeacherGradesPage from './pages/teacher/TeacherGradesPage'
import TeacherExamsPage from './pages/teacher/TeacherExamsPage'
import TeacherAnnouncementsPage from './pages/teacher/TeacherAnnouncementsPage'

// Homeroom
import HomeroomDashboard from './pages/homeroom/HomeroomDashboard'
import HomeroomStudentsPage from './pages/homeroom/HomeroomStudentsPage'
import HomeroomAttendancePage from './pages/homeroom/HomeroomAttendancePage'
import HomeroomGradesPage from './pages/homeroom/HomeroomGradesPage'
import HomeroomNotesPage from './pages/homeroom/HomeroomNotesPage'
import HomeroomReportCardsPage from './pages/homeroom/HomeroomReportCardsPage'
import HomeroomPromotionPage from './pages/homeroom/HomeroomPromotionPage'

// Student
import StudentDashboard from './pages/student/StudentDashboard'
import StudentProfilePage from './pages/student/StudentProfilePage'
import StudentSchedulePage from './pages/student/StudentSchedulePage'
import StudentAttendancePage from './pages/student/StudentAttendancePage'
import StudentGradesPage from './pages/student/StudentGradesPage'
import StudentExamsPage from './pages/student/StudentExamsPage'
import StudentAnnouncementsPage from './pages/student/StudentAnnouncementsPage'
import StudentCalendarPage from './pages/student/StudentCalendarPage'
import StudentQrPage from './pages/student/StudentQrPage'
import StudentScanQrPage from './pages/student/StudentScanQrPage'

// Parent
import ParentDashboard from './pages/parent/ParentDashboard'
import ParentGradesPage from './pages/parent/ParentGradesPage'
import ParentAttendancePage from './pages/parent/ParentAttendancePage'
import ParentSchedulePage from './pages/parent/ParentSchedulePage'
import ParentExamsPage from './pages/parent/ParentExamsPage'
import ParentReportCardPage from './pages/parent/ParentReportCardPage'
import ParentAnnouncementsPage from './pages/parent/ParentAnnouncementsPage'

export default function App() {
  if (!isSupabaseConfigured) return <ConfigWarning />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<DashboardLayout role="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<StudentsPage />} />
            <Route path="/admin/students/import" element={<StudentsImportPage />} />
            <Route path="/admin/students/:id" element={<StudentDetailPage />} />
            <Route path="/admin/teachers" element={<TeachersPage />} />
            <Route path="/admin/parents" element={<ParentsPage />} />
            <Route path="/admin/classes" element={<ClassesPage />} />
            <Route path="/admin/classes/assign" element={<ClassAssignmentPage />} />
            <Route path="/admin/subjects" element={<SubjectsPage />} />
            <Route path="/admin/academic-years" element={<AcademicYearsPage />} />
            <Route path="/admin/calendar" element={<CalendarPage />} />
            <Route path="/admin/schedules" element={<SchedulesPage />} />
            <Route path="/admin/attendance" element={<AttendanceRecapPage />} />
            <Route path="/admin/grades" element={<GradeRecapPage />} />
            <Route path="/admin/grades/weights" element={<GradeWeightsPage />} />
            <Route path="/admin/report-cards/:studentId" element={<ReportCardPage />} />
            <Route path="/admin/promotion" element={<PromotionPage />} />
            <Route path="/admin/exams" element={<ExamsPage />} />
            <Route path="/admin/announcements" element={<AnnouncementsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/audit-log" element={<AuditLogPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* TEACHER */}
        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route element={<DashboardLayout role="teacher" />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/schedules" element={<TeacherSchedulesPage />} />
            <Route path="/teacher/attendance" element={<TeacherAttendancePage />} />
            <Route path="/teacher/grades" element={<TeacherGradesPage />} />
            <Route path="/teacher/exams" element={<TeacherExamsPage />} />
            <Route path="/teacher/announcements" element={<TeacherAnnouncementsPage />} />
            <Route path="/teacher/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* HOMEROOM */}
        <Route element={<ProtectedRoute allowedRoles={['homeroom']} />}>
          <Route element={<DashboardLayout role="homeroom" />}>
            <Route path="/homeroom/dashboard" element={<HomeroomDashboard />} />
            <Route path="/homeroom/students" element={<HomeroomStudentsPage />} />
            <Route path="/homeroom/attendance" element={<HomeroomAttendancePage />} />
            <Route path="/homeroom/grades" element={<HomeroomGradesPage />} />
            <Route path="/homeroom/notes" element={<HomeroomNotesPage />} />
            <Route path="/homeroom/report-cards" element={<HomeroomReportCardsPage />} />
            <Route path="/homeroom/report-cards/:studentId" element={<ReportCardPage />} />
            <Route path="/homeroom/promotion" element={<HomeroomPromotionPage />} />
            <Route path="/homeroom/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* STUDENT */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route element={<DashboardLayout role="student" />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
            <Route path="/student/schedule" element={<StudentSchedulePage />} />
            <Route path="/student/attendance" element={<StudentAttendancePage />} />
            <Route path="/student/attendance/scan" element={<StudentScanQrPage />} />
            <Route path="/student/grades" element={<StudentGradesPage />} />
            <Route path="/student/report-card" element={<ReportCardPageForSelf />} />
            <Route path="/student/exams" element={<StudentExamsPage />} />
            <Route path="/student/announcements" element={<StudentAnnouncementsPage />} />
            <Route path="/student/calendar" element={<StudentCalendarPage />} />
            <Route path="/student/qr" element={<StudentQrPage />} />
            <Route path="/student/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* PARENT */}
        <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
          <Route element={<DashboardLayout role="parent" />}>
            <Route element={<ParentLayout />}>
              <Route path="/parent/dashboard" element={<ParentDashboard />} />
              <Route path="/parent/grades" element={<ParentGradesPage />} />
              <Route path="/parent/report-card" element={<ParentReportCardPage />} />
              <Route path="/parent/attendance" element={<ParentAttendancePage />} />
              <Route path="/parent/schedule" element={<ParentSchedulePage />} />
              <Route path="/parent/exams" element={<ParentExamsPage />} />
              <Route path="/parent/announcements" element={<ParentAnnouncementsPage />} />
              <Route path="/parent/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

// Wrapper kecil agar siswa melihat rapornya sendiri tanpa perlu :studentId di URL
function ReportCardPageForSelf() {
  const { profile } = useAuth()
  return <ReportCardPage studentIdOverride={profile.student_id} />
}
