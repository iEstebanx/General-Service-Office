// frontend/src/components/BookingDrawer.jsx
import React from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Drawer, Box, Typography, TextField, Button, Divider,
  FormControl, InputLabel, Select, MenuItem
} from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

import ResourceToggles from "./ResourceToggles.jsx";

const API = "http://localhost:4000/api";

export default function BookingDrawer({ open, onClose, selectedDate }) {
  const [eventTypes, setEventTypes] = React.useState([]);
  const [requestedBy, setRequestedBy] = React.useState("");
  const [eventTypeId, setEventTypeId] = React.useState("");
  const [date, setDate] = React.useState(selectedDate);
  const [startTime, setStartTime] = React.useState(dayjs().hour(19).minute(0));
  const [endTime, setEndTime] = React.useState(dayjs().hour(22).minute(0));
  const [resources, setResources] = React.useState({
    chairs: false, tables: false, aircon: false, lights: true, sounds: false, led: false
  });

  const selectedEvent = eventTypes.find(e => e.id === eventTypeId);

  React.useEffect(() => {
    axios.get(`${API}/event-types`).then(res => setEventTypes(res.data));
  }, []);

  React.useEffect(() => {
    setDate(selectedDate);
  }, [selectedDate]);

  React.useEffect(() => {
    if (selectedEvent?.defaultResources) setResources(selectedEvent.defaultResources);
  }, [eventTypeId]); // apply defaults when event changes

  const durationHours = React.useMemo(() => {
    if (!startTime || !endTime) return 1;
    const mins = endTime.diff(startTime, "minute");
    return Math.max(1, mins / 60);
  }, [startTime, endTime]);

  const amount = React.useMemo(() => {
    if (!selectedEvent) return 0;
    return Math.round(selectedEvent.baseAmount * durationHours);
  }, [selectedEvent, durationHours]);

  async function submit() {
    if (!requestedBy || !eventTypeId) return alert("Please enter Name and select Event Name.");

    const payload = {
      requestedBy,
      eventTypeId,
      date: date.format("YYYY-MM-DD"),
      startTime: startTime.format("HH:mm"),
      endTime: endTime.format("HH:mm"),
      durationHours,
      resources
    };

    const res = await axios.post(`${API}/bookings`, payload);
    alert(`Booked! Amount: ${res.data.amount}`);
    onClose();
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 340, sm: 420 }, p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Create Schedule
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
          Select details for the booking.
        </Typography>

        <TextField
          fullWidth
          label="Requested by (Name)"
          value={requestedBy}
          onChange={(e) => setRequestedBy(e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Event Name</InputLabel>
          <Select
            label="Event Name"
            value={eventTypeId}
            onChange={(e) => setEventTypeId(e.target.value)}
          >
            {eventTypes.map((evt) => (
              <MenuItem key={evt.id} value={evt.id}>
                {evt.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date"
            value={date}
            onChange={(v) => v && setDate(v)}
            sx={{ mb: 2, width: "100%" }}
          />

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TimePicker
              label="Start Time"
              value={startTime}
              onChange={(v) => v && setStartTime(v)}
              sx={{ flex: 1 }}
            />
            <TimePicker
              label="End Time"
              value={endTime}
              onChange={(v) => v && setEndTime(v)}
              sx={{ flex: 1 }}
            />
          </Box>
        </LocalizationProvider>

        <TextField
          fullWidth
          label="Amount (auto)"
          value={amount}
          InputProps={{ readOnly: true }}
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
          Resources
        </Typography>
        <ResourceToggles resources={resources} setResources={setResources} />

        <Divider sx={{ my: 2 }} />
        <Button fullWidth variant="contained" onClick={submit} sx={{ fontWeight: 800 }}>
          Submit Booking
        </Button>
      </Box>
    </Drawer>
  );
}