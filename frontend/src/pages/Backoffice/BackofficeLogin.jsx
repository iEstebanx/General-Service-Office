// frontend/src/pages/Backoffice/BackofficeLogin.jsx
import React from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

const API = "http://localhost:4000/api";

export default function BackofficeLogin() {
  const nav = useNavigate();
  const location = useLocation();

  const [username, setUsername] = React.useState("admin");
  const [password, setPassword] = React.useState("admin123");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) nav("/backoffice", { replace: true });
  }, [nav]);

  async function login() {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, { username, password });
      localStorage.setItem("adminToken", res.data.token);
      nav("/backoffice", { replace: true });
    } catch (e) {
      setError("Login failed. Check your username/password.");
    } finally {
      setLoading(false);
    }
  }

  const backTo = location.state?.from || "/";

  function onSubmit(e) {
    e.preventDefault();
    login();
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,
          minHeight: 420,
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        {/* Header strip */}
        <Box
          sx={{
            bgcolor: "primary.main",
            color: "primary.contrastText",
            px: 3,
            py: 2.5,
            textAlign: "center", // ✅ center titles
          }}
        >
          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
            Backoffice
          </Typography>
          <Typography sx={{ opacity: 0.9, fontSize: 13 }}>
            Sign in to continue
          </Typography>
        </Box>

        <CardContent sx={{ px: 3, py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={onSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              sx={{ mb: 2 }}
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ fontWeight: 900, py: 1.2, borderRadius: 3 }}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <Divider sx={{ my: 2 }} />

            <Button
              fullWidth
              variant="text"
              onClick={() => nav(backTo, { replace: true })}
              sx={{ fontWeight: 800, borderRadius: 3 }}
            >
              Back
            </Button>

            <Typography sx={{ mt: 2, fontSize: 12, opacity: 0.75 }}>
              Default: <b>admin</b> / <b>admin123</b> (change in backend .env)
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}