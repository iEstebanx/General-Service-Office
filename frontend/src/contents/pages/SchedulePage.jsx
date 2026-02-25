// frontend/src/contents/pages/SchedulePage.jsx
import React from "react";
import dayjs from "dayjs";
import { Container, Box, Typography } from "@mui/material";
import Topbar from "../../components/Topbar.jsx";
import CalendarSection from "../../components/CalendarSection.jsx";
import BookingDrawer from "../../components/BookingDrawer.jsx";

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = React.useState(dayjs());
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Topbar title="Gym Scheduling" />
      <Container sx={{ py: 3 }}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <CalendarSection
            value={selectedDate}
            onChange={(v) => {
              if (!v) return;
              setSelectedDate(v);
              setOpen(true);
            }}
          />

          <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
              How it works
            </Typography>
            <Typography sx={{ opacity: 0.85 }}>
              Pick a date on the calendar to create a schedule. The amount is computed automatically
              from the event type and duration.
            </Typography>
          </Box>
        </Box>
      </Container>

      <BookingDrawer
        open={open}
        onClose={() => setOpen(false)}
        selectedDate={selectedDate}
      />
    </>
  );
}