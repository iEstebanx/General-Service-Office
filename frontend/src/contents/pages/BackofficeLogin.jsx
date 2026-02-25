// frontend/src/contents/pages/BackofficeLogin.jsx
import React from "react";
import axios from "axios";
import { Container, Card, CardContent, Typography, TextField, Button, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:4000/api";

export default function BackofficeLogin() {
  const nav = useNavigate();
  const [username, setUsername] = React.useState("admin");
  const [password, setPassword] = React.useState("admin123");

  async function login() {
    try {
      const res = await axios.post(`${API}/auth/login`, { username, password });
      localStorage.setItem("adminToken", res.data.token);
      nav("/backoffice");
    } catch (e) {
      alert("Login failed.");
    }
  }

  return (
    <Container sx={{ py: 6, maxWidth: "sm" }}>
      <Card>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
            Backoffice Login
          </Typography>

          <TextField fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />

          <Button fullWidth variant="contained" onClick={login} sx={{ fontWeight: 900 }}>
            Login
          </Button>

          <Box sx={{ mt: 2, opacity: 0.8 }}>
            Default: admin / admin123 (change in backend .env)
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}