// frontend/src/pages/Backoffice/UserManagement.jsx
import { Card, CardContent, Typography, Divider } from "@mui/material";

export default function UserManagement() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
          User Management
        </Typography>

        <Typography sx={{ opacity: 0.85 }}>
          Placeholder for now (no database yet). You can add user CRUD here once you add DB/auth management.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ fontWeight: 800, mb: 1 }}>Coming soon</Typography>
        <Typography sx={{ opacity: 0.8 }}>
          Typical features: create users, roles/permissions, reset passwords, deactivate users, etc.
        </Typography>
      </CardContent>
    </Card>
  );
}