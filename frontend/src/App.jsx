// frontend/src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline } from "@mui/material";

import SchedulePage from "./contents/pages/SchedulePage.jsx";
import BackofficeLogin from "./contents/pages/BackofficeLogin.jsx";
import BackofficeLayout from "./contents/pages/BackofficeLayout.jsx";
import AdminDashboard from "./contents/pages/AdminDashboard.jsx";
import EventTypesPage from "./contents/pages/EventTypesPage.jsx";
import SettingsPage from "./contents/pages/SettingsPage.jsx";
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
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}