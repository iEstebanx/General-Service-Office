// frontend/src/components/Sidebar.jsx
import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Popover,
  MenuList,
  MenuItem,
  Typography,
  Divider,
  Tooltip,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PeopleIcon from "@mui/icons-material/People";
import BackupIcon from "@mui/icons-material/Backup";
import ListAltIcon from "@mui/icons-material/ListAlt";

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 72;

const ROUTES = {
  dashboard: "/backoffice",
  events: "/backoffice/event-types",

  // settings dropdown pages (no SettingsPage route)
  audit: "/backoffice/audit-trail",
  users: "/backoffice/user-management",
  backup: "/backoffice/backup-restore",
};

const SETTINGS_PATHS = [ROUTES.audit, ROUTES.users, ROUTES.backup];

function isActivePath(current, target) {
  if (target === "/backoffice") return current === "/backoffice";
  return current.startsWith(target);
}

function isSettingsActive(pathname) {
  return SETTINGS_PATHS.some((p) => pathname.startsWith(p));
}

export default function Sidebar({ collapsed }) {
  const loc = useLocation();
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const popOpen = Boolean(anchorEl);

  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  // Auto-open the Settings group when you're inside one of its pages
  React.useEffect(() => {
    if (!collapsed && isSettingsActive(loc.pathname)) setSettingsOpen(true);
  }, [collapsed, loc.pathname]);

  const NavItem = ({ to, icon, label, active }) => {
    const btn = (
      <ListItemButton
        component={RouterLink}
        to={to}
        selected={active}
        sx={{
          mx: 1,
          my: 0.25,
          borderRadius: 3,
          justifyContent: collapsed ? "center" : "flex-start",
          px: collapsed ? 1.25 : 2,
          transition: "padding 220ms ease, justify-content 220ms ease",
          "&.Mui-selected": {
            bgcolor: "action.selected",
            "&:hover": { bgcolor: "action.selected" },
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? "auto" : 40,
            justifyContent: "center",
            color: active ? "primary.main" : "text.secondary",
            transition: "min-width 220ms ease",
          }}
        >
          {icon}
        </ListItemIcon>

        {/* Animate label in/out (no pop) */}
        <Box
          sx={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            maxWidth: collapsed ? 0 : 160,
            opacity: collapsed ? 0 : 1,
            transform: collapsed ? "translateX(-6px)" : "translateX(0)",
            transition: "max-width 220ms ease, opacity 160ms ease, transform 220ms ease",
          }}
        >
          <ListItemText
            primary={label}
            primaryTypographyProps={{
              sx: { fontWeight: active ? 900 : 700, color: "text.primary" },
            }}
          />
        </Box>
      </ListItemButton>
    );

    return collapsed ? (
      <Tooltip title={label} placement="right">
        {btn}
      </Tooltip>
    ) : (
      btn
    );
  };

  const settingsSelected = isSettingsActive(loc.pathname);

  return (
    <Box
      sx={{
        width,
        flexShrink: 0,
        minHeight: "100vh",
        transition: "width 260ms ease",
      }}
    >
      <Drawer
        variant="permanent"
        open
        sx={{
          width,
          height: "100%",
          "& .MuiDrawer-paper": {
            width,
            height: "100vh",
            boxSizing: "border-box",
            position: "relative",
            overflowX: "hidden",
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            transition: "width 260ms ease",
          },
        }}
      >
        {/* Brand */}
        <Box sx={{ px: collapsed ? 1 : 2, py: 2, transition: "padding 220ms ease" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              transition: "justify-content 220ms ease",
            }}
          >
            <Typography sx={{ fontWeight: 900, letterSpacing: 0.3 }}>
              {collapsed ? "B" : "Backoffice"}
            </Typography>
          </Box>
        </Box>

        <Divider />

        <List sx={{ pt: 1 }}>
          <NavItem
            to={ROUTES.dashboard}
            icon={<DashboardIcon />}
            label="Dashboard"
            active={isActivePath(loc.pathname, ROUTES.dashboard)}
          />

          <NavItem
            to={ROUTES.events}
            icon={<EventAvailableIcon />}
            label="Event Management"
            active={isActivePath(loc.pathname, ROUTES.events)}
          />

          {/* SETTINGS (dropdown only, no Settings page) */}
          {!collapsed ? (
            <>
              <ListItemButton
                onClick={() => setSettingsOpen((v) => !v)}
                sx={{
                  mx: 1,
                  my: 0.25,
                  borderRadius: 3,
                  px: 2,
                  "&.Mui-selected": {
                    bgcolor: "action.selected",
                    "&:hover": { bgcolor: "action.selected" },
                  },
                }}
                selected={settingsSelected}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: settingsSelected ? "primary.main" : "text.secondary",
                  }}
                >
                  <SettingsIcon />
                </ListItemIcon>

                <ListItemText
                  primary="Settings"
                  primaryTypographyProps={{
                    sx: { fontWeight: settingsSelected ? 900 : 700 },
                  }}
                />

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {settingsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Box>
              </ListItemButton>

              <Collapse in={settingsOpen} timeout={200} unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 1 }}>
                  <ListItemButton
                    component={RouterLink}
                    to={ROUTES.audit}
                    selected={isActivePath(loc.pathname, ROUTES.audit)}
                    sx={{ mx: 1, my: 0.25, borderRadius: 3, pl: 4 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                      <ListAltIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Audit Trail"
                      primaryTypographyProps={{ sx: { fontWeight: 700 } }}
                    />
                  </ListItemButton>

                  <ListItemButton
                    component={RouterLink}
                    to={ROUTES.users}
                    selected={isActivePath(loc.pathname, ROUTES.users)}
                    sx={{ mx: 1, my: 0.25, borderRadius: 3, pl: 4 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                      <PeopleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="User Management"
                      primaryTypographyProps={{ sx: { fontWeight: 700 } }}
                    />
                  </ListItemButton>

                  <ListItemButton
                    component={RouterLink}
                    to={ROUTES.backup}
                    selected={isActivePath(loc.pathname, ROUTES.backup)}
                    sx={{ mx: 1, my: 0.25, borderRadius: 3, pl: 4 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: "text.secondary" }}>
                      <BackupIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Backup & Restore"
                      primaryTypographyProps={{ sx: { fontWeight: 700 } }}
                    />
                  </ListItemButton>
                </List>
              </Collapse>
            </>
          ) : (
            <>
              <Tooltip title="Settings" placement="right">
                <ListItemButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{
                    mx: 1,
                    my: 0.25,
                    borderRadius: 3,
                    justifyContent: "center",
                    px: 1.25,
                  }}
                  selected={settingsSelected}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: "auto",
                      justifyContent: "center",
                      color: settingsSelected ? "primary.main" : "text.secondary",
                    }}
                  >
                    <SettingsIcon />
                  </ListItemIcon>
                </ListItemButton>
              </Tooltip>

              <Popover
                open={popOpen}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "center", horizontal: "right" }}
                transformOrigin={{ vertical: "center", horizontal: "left" }}
                PaperProps={{
                  sx: {
                    borderRadius: 3,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                    overflow: "hidden",
                    minWidth: 220,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                  },
                }}
              >
                <MenuList>
                  <MenuItem component={RouterLink} to={ROUTES.audit} onClick={() => setAnchorEl(null)}>
                    <ListItemIcon>
                      <ListAltIcon fontSize="small" />
                    </ListItemIcon>
                    Audit Trail
                  </MenuItem>

                  <MenuItem component={RouterLink} to={ROUTES.users} onClick={() => setAnchorEl(null)}>
                    <ListItemIcon>
                      <PeopleIcon fontSize="small" />
                    </ListItemIcon>
                    User Management
                  </MenuItem>

                  <MenuItem component={RouterLink} to={ROUTES.backup} onClick={() => setAnchorEl(null)}>
                    <ListItemIcon>
                      <BackupIcon fontSize="small" />
                    </ListItemIcon>
                    Backup &amp; Restore
                  </MenuItem>
                </MenuList>
              </Popover>
            </>
          )}
        </List>

        <Box sx={{ flex: 1 }} />

        <Box
          sx={{
            p: 2,
            opacity: 0.65,
            fontSize: 12,
            transition: "opacity 180ms ease",
          }}
        >
          {!collapsed ? "© Backoffice" : "©"}
        </Box>
      </Drawer>
    </Box>
  );
}