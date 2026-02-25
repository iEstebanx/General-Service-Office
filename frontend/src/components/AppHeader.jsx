// frontend/src/components/AppHeader.jsx
import { Link as RouterLink, useLocation } from "react-router-dom";
import { AppBar, Toolbar, IconButton, Box, Button, Link, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const LABELS = {
  backoffice: "Home",
  "event-types": "Event Management",
  settings: "Settings",
  "audit-trail": "Audit Trail",
  "user-management": "User Management",
  "backup-restore": "Backup & Restore",
};

function buildCrumbs(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [];
  let acc = "";
  for (const p of parts) {
    acc += `/${p}`;
    crumbs.push({ label: LABELS[p] || p, to: acc });
  }
  if (crumbs.length === 0) return [{ label: "Home", to: "/" }];
  return crumbs;
}

export default function AppHeader({ onToggleSidebar, onLogout }) {
  const loc = useLocation();
  const crumbs = buildCrumbs(loc.pathname);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="primary"
      sx={{
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        color: "primary.contrastText",
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <IconButton
          onClick={onToggleSidebar}
          edge="start"
          aria-label="toggle sidebar"
          sx={{
            color: "inherit",
            bgcolor: "rgba(255,255,255,0.12)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
            borderRadius: 999,
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Breadcrumbs like: Home / Inventory */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {crumbs.map((c, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <Box key={c.to} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {idx > 0 && <Typography sx={{ opacity: 0.85, fontWeight: 700 }}>/</Typography>}

                {isLast ? (
                  <Typography sx={{ fontWeight: 800, opacity: 0.95 }}>{c.label}</Typography>
                ) : (
                  <Link
                    component={RouterLink}
                    to={c.to}
                    underline="none"
                    sx={{
                      color: "inherit",
                      opacity: 0.9,
                      fontWeight: 700,
                      "&:hover": { opacity: 1, textDecoration: "underline" },
                    }}
                  >
                    {c.label}
                  </Link>
                )}
              </Box>
            );
          })}
        </Box>

        <Box sx={{ flex: 1 }} />

        <Button onClick={onLogout} sx={{ fontWeight: 900, color: "inherit" }}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}