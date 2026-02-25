// frontend/src/components/Topbar.jsx
import { AppBar, Toolbar, Typography, IconButton, Box } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useNavigate, useLocation } from "react-router-dom";

export default function Topbar({ title = "Scheduling" }) {
  const nav = useNavigate();
  const location = useLocation();

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <IconButton
          color="inherit"
          onClick={() =>
            nav("/backoffice/login", { state: { from: location.pathname } })
          }
        >
          <AccountCircleIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}