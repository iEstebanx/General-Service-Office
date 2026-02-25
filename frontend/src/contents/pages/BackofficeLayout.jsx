// frontend/src/contents/pages/BackofficeLayout.jsx
import { Outlet, Link, useNavigate } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";

export default function BackofficeLayout() {
  const nav = useNavigate();

  function logout() {
    localStorage.removeItem("adminToken");
    nav("/backoffice/login");
  }

  return (
    <>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Backoffice
          </Typography>

          <Button color="inherit" component={Link} to="/backoffice">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} to="/backoffice/event-types">
            Event Management
          </Button>
          <Button color="inherit" component={Link} to="/backoffice/settings">
            Settings
          </Button>

          <Box sx={{ flex: 1 }} />
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </>
  );
}