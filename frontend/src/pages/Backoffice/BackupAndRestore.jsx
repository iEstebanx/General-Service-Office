// frontend/src/pages/Backoffice/BackupAndRestore.jsx
import React from "react";
import axios from "axios";
import { Card, CardContent, Typography, Button, Divider, TextField } from "@mui/material";

const API = "http://localhost:4000/api";

export default function BackupAndRestore() {
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
          Backup &amp; Restore
        </Typography>

        <Typography sx={{ opacity: 0.85, mb: 2 }}>
          Create a backup JSON from the backend, or restore by pasting a valid backup JSON and clicking Restore.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Button variant="outlined" onClick={backup} sx={{ mr: 1 }}>
          Backup
        </Button>
        <Button variant="contained" onClick={restore} sx={{ fontWeight: 900 }}>
          Restore
        </Button>

        <TextField
          fullWidth
          multiline
          minRows={10}
          label="Backup JSON"
          value={backupJson}
          onChange={(e) => setBackupJson(e.target.value)}
          sx={{ mt: 2 }}
        />
      </CardContent>
    </Card>
  );
}