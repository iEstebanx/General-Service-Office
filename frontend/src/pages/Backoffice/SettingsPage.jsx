// frontend/src/pages/Backoffice/SettingsPage.jsx
import React from "react";
import axios from "axios";
import { Card, CardContent, Typography, Button, Divider, TextField } from "@mui/material";

const API = "http://localhost:4000/api";

export default function SettingsPage() {
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  const [backupJson, setBackupJson] = React.useState("");

  async function backup() {
    const res = await axios.get(`${API}/admin/backup`, { headers });
    setBackupJson(JSON.stringify(res.data, null, 2));
  }

  async function restore() {
    try {
      const payload = JSON.parse(backupJson);
      await axios.post(`${API}/admin/restore`, payload, { headers });
      alert("Restore done.");
    } catch {
      alert("Invalid JSON");
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
          Settings
        </Typography>

        <Typography sx={{ fontWeight: 800 }}>User Management</Typography>
        <Typography sx={{ opacity: 0.8, mb: 2 }}>
          Placeholder for now (no database yet). You can add users later when you add DB.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ fontWeight: 800, mb: 1 }}>Backup and Restore</Typography>
        <Button variant="outlined" onClick={backup} sx={{ mr: 1 }}>Backup</Button>
        <Button variant="contained" onClick={restore} sx={{ fontWeight: 900 }}>Restore</Button>

        <TextField
          fullWidth
          multiline
          minRows={10}
          label="Backup JSON"
          value={backupJson}
          onChange={(e) => setBackupJson(e.target.value)}
          sx={{ mt: 2 }}
        />

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ fontWeight: 800 }}>Audit Trail</Typography>
        <Typography sx={{ opacity: 0.8 }}>
          See the latest items in the Dashboard (pulled from backend audit).
        </Typography>
      </CardContent>
    </Card>
  );
}