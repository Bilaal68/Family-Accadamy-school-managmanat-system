import { Navigate, Route, Routes } from "react-router-dom";

import AdminLayout from "@/layouts/AdminLayout";
import CashierLayout from "@/layouts/CashierLayout";
import TeacherLayout from "@/layouts/TeacherLayout";
import RoleGuard from "@/routes/RoleGuard";

import AdminLogin from "@/features/auth/AdminLogin";
import CashierLogin from "@/features/auth/CashierLogin";
import TeacherLogin from "@/features/auth/TeacherLogin";
import Unauthorized from "@/features/auth/Unauthorized";

import SettingsPage from "@/features/shared/pages/SettingsPage";

import Dashboard from "@/features/admin/pages/Dashboard";
import AnnouncementsPage from "@/features/admin/pages/AnnouncementsPage";
import ApprovalsPage from "@/features/admin/pages/ApprovalsPage";
import AttendancePage from "@/features/admin/pages/AttendancePage";
import ClassesList from "@/features/admin/pages/classes/ClassesList";
import ClassDetail from "@/features/admin/pages/classes/ClassDetail";
import MarksPage from "@/features/admin/pages/MarksPage";
import ReportsPage from "@/features/admin/pages/ReportsPage";
import StudentsList from "@/features/admin/pages/students/StudentsList";
import StudentDetail from "@/features/admin/pages/students/StudentDetail";
import TeachersList from "@/features/admin/pages/teachers/TeachersList";
import TeacherDetail from "@/features/admin/pages/teachers/TeacherDetail";
import AdminFormPlaceholder from "@/features/admin/pages/AdminFormPlaceholder";

import TeacherDashboard from "@/features/teacher/pages/Dashboard";
import TeacherClassPage from "@/features/teacher/pages/TeacherClassPage";
import TeacherNotificationsPage from "@/features/teacher/pages/TeacherNotificationsPage";
import TeacherPlaceholderPage from "@/features/teacher/pages/TeacherPlaceholderPage";
import TeacherAttendancePage from "@/features/teacher/pages/AttendancePage";
import TeacherMarksPage from "@/features/teacher/pages/MarksPage";
import TeacherBehaviourPage from "@/features/teacher/pages/BehaviourPage";

import CashierDashboard from "@/features/cashier/pages/Dashboard";
import EnrollmentsPage from "@/features/cashier/pages/EnrollmentsPage";
import EnrollmentDetail from "@/features/cashier/pages/EnrollmentDetail";
import NewEnrollmentPage from "@/features/cashier/pages/NewEnrollmentPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/teacher/login" element={<TeacherLogin />} />
      <Route path="/cashier/login" element={<CashierLogin />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/admin"
        element={
          <RoleGuard role="SUPER_ADMIN">
            <AdminLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<StudentsList />} />
        <Route path="students/:id" element={<StudentDetail />} />
        <Route path="teachers" element={<TeachersList />} />
        <Route path="teachers/:id" element={<TeacherDetail />} />
        <Route path="classes" element={<ClassesList />} />
        <Route path="classes/:id" element={<ClassDetail />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="marks" element={<MarksPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/teacher"
        element={
          <RoleGuard role="CLASS_TEACHER">
            <TeacherLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="class" element={<TeacherClassPage />} />
        <Route path="attendance" element={<TeacherAttendancePage />} />
        <Route path="marks" element={<TeacherMarksPage />} />
        <Route path="behaviour" element={<TeacherBehaviourPage />} />
        <Route path="notifications" element={<TeacherNotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/cashier"
        element={
          <RoleGuard role="CASHIER">
            <CashierLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CashierDashboard />} />
        <Route path="enrollments" element={<EnrollmentsPage />} />
        <Route path="enrollments/new" element={<NewEnrollmentPage />} />
        <Route path="enrollments/:id" element={<EnrollmentDetail />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
