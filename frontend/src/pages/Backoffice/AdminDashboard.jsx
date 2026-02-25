// frontend/src/pages/Backoffice/AdminDashboard.jsx
import React from "react";
import axios from "axios";
import { Card, CardContent, Typography, List, ListItem, ListItemText } from "@mui/material";

const API = "http://localhost:4000/api";

export default function AdminDashboard() {
  const [audit, setAudit] = React.useState([]);

  React.useEffect(() => {
    const token = localStorage.getItem("adminToken");
    axios
      .get(`${API}/admin/audit`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setAudit(res.data.slice().reverse().slice(0, 10)));
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
          Dashboard
        </Typography>
        <Typography sx={{ opacity: 0.8, mb: 2 }}>
          Latest audit trail (last 10 actions).
        </Typography>

        <List dense>
          {audit.map((a) => (
            <ListItem key={a.id}>
              <ListItemText
                primary={`${a.action}`}
                secondary={`${a.at}`}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}