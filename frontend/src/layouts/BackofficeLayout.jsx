// frontend/src/layouts/BackofficeLayout.jsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "../components/Sidebar";
import AppHeader from "../components/AppHeader";

export default function BackofficeLayout() {
  const nav = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  function logout() {
    localStorage.removeItem("adminToken");
    nav("/backoffice/login");
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar collapsed={sidebarCollapsed} />

      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          transition: "margin 260ms ease", // ✅ smooth shift (optional)
        }}
      >
        <AppHeader
          onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
          onLogout={logout}
        />

        <Box component="main" sx={{ p: 3, minWidth: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}