// frontend/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline } from "@mui/material";

import SchedulePage from "./pages/SchedulePage.jsx";
import BackofficeLogin from "./pages/Backoffice/BackofficeLogin.jsx";
import BackofficeLayout from "./layouts/BackofficeLayout.jsx";
import AdminDashboard from "./pages/Backoffice/AdminDashboard.jsx";
import EventTypesPage from "./pages/Backoffice/EventTypesPage.jsx";

import AuditTrail from "./pages/Backoffice/AuditTrail.jsx";
import UserManagement from "./pages/Backoffice/UserManagement.jsx";
import BackupAndRestore from "./pages/Backoffice/BackupAndRestore.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<SchedulePage />} />

        <Route path="/backoffice/login" element={<BackofficeLogin />} />

        <Route
          path="/backoffice"
          element={
            <ProtectedRoute>
              <BackofficeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="event-types" element={<EventTypesPage />} />

          {/* Settings dropdown destinations (no SettingsPage anymore) */}
          <Route path="audit-trail" element={<AuditTrail />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="backup-restore" element={<BackupAndRestore />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}