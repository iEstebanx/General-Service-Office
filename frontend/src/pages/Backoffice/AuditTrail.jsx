// frontend/src/pages/Backoffice/AuditTrail.jsx
import { Card, CardContent, Typography, Divider } from "@mui/material";

export default function AuditTrail() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
          Audit Trail
        </Typography>

        <Typography sx={{ opacity: 0.85 }}>
          This page is for viewing audit activity. For now, the latest audit items are still shown in the Dashboard.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography sx={{ fontWeight: 800, mb: 1 }}>Coming soon</Typography>
        <Typography sx={{ opacity: 0.8 }}>
          You can wire this page to your backend audit endpoint later (table, filters, pagination, etc.).
        </Typography>
      </CardContent>
    </Card>
  );
}