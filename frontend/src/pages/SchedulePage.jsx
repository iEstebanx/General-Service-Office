// frontend/src/pages/SchedulePage.jsx
import React from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Container,
  Box,
  Typography,
  Drawer,
  TextField,
  Button,
  Divider,
  Grid,
  FormControlLabel,
  Switch,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from "@mui/material";

import Topbar from "@/components/Topbar.jsx";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

// ✅ Use proxy: /api -> backend
const API = "/api";

/** --------- Inline ResourceToggles --------- */
const toggleItems = [
  { key: "aircon", label: "Aircon" },
  { key: "lights", label: "Lights" },
  { key: "sounds", label: "Sounds" },
  { key: "led", label: "LED" },
];

function ResourceInputs({ resources, setResources }) {
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        <TextField
          label="Chairs (qty)"
          type="number"
          value={resources.chairs}
          onChange={(e) =>
            setResources({
              ...resources,
              chairs: Math.max(0, Number(e.target.value || 0)),
            })
          }
          inputProps={{ min: 0 }}
        />
        <TextField
          label="Tables (qty)"
          type="number"
          value={resources.tables}
          onChange={(e) =>
            setResources({
              ...resources,
              tables: Math.max(0, Number(e.target.value || 0)),
            })
          }
          inputProps={{ min: 0 }}
        />
      </Box>

      <Grid container spacing={1}>
        {toggleItems.map((it) => (
          <Grid item xs={6} key={it.key}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!resources[it.key]}
                  onChange={(e) =>
                    setResources({ ...resources, [it.key]: e.target.checked })
                  }
                />
              }
              label={it.label}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/** --------- Inline HowItWorks --------- */
function HowItWorks() {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: { xs: 1.5, sm: 2 },
        bgcolor: "background.paper",
        mb: { xs: 1.25, sm: 1.5 },
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5 }}>
        How it works
      </Typography>
      <Typography sx={{ opacity: 0.85, lineHeight: 1.55 }}>
        Pick a date on the calendar to create a schedule. Select an event name,
        or choose <b>Others</b> to type a custom event. Enter amount and optional
        discount to instantly see the final amount.
      </Typography>
    </Paper>
  );
}

/** --------- Inline CalendarSection (FIXED OVERFLOW & CENTERED YEAR) --------- */
function CalendarSection({ value, onChange, onViewChange }) {
  const contentRef = React.useRef(null);
  const [cardHeight, setCardHeight] = React.useState(null);
  const EXTRA_HEIGHT = 16;

  const measure = React.useCallback(() => {
    if (!contentRef.current) return;
    const h = contentRef.current.scrollHeight;
    if (h) setCardHeight(h);
  }, []);

  React.useEffect(() => {
    if (!contentRef.current) return;

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(contentRef.current);

    const t1 = setTimeout(measure, 0);
    const t2 = setTimeout(measure, 180);
    const t3 = setTimeout(measure, 360);

    return () => {
      ro.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [measure]);

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "background.paper",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        p: { xs: 1.5, sm: 2 },
        height: cardHeight ? `${cardHeight + EXTRA_HEIGHT}px` : "auto",
        transition: "height 180ms ease",
        overflow: "hidden",
      }}
    >
      <Box ref={contentRef}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Select a date
          </Typography>
          <Typography sx={{ fontSize: 13, opacity: 0.7 }}>
            Click a day to create a schedule
          </Typography>
        </Box>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            value={value}
            onChange={onChange}
            onViewChange={onViewChange}
            showDaysOutsideCurrentMonth={false}
            onMonthChange={() => {
              measure();
              setTimeout(measure, 0);
              setTimeout(measure, 180);
              setTimeout(measure, 360);
            }}
            minDate={dayjs()} // Sets the minimum selectable date as today
            sx={{
              width: "100%",
              maxWidth: "none",
              m: 0,
              "&.MuiDateCalendar-root": { height: "auto", overflow: "visible" },

              // Styling adjustments
              "& .MuiPickersYear-yearButton": {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                width: "100%",
              },

              "& .MuiPickersYear-root": {
                display: "flex",
                justifyContent: "center",
                width: "100%",
              },

              "& .MuiYearCalendar-root": {
                display: "flex",
                justifyContent: "center",
                width: "100%",
              },

              "& .MuiPickersYear-view": {
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 1,
                justifyItems: "center",
                alignItems: "center",
                width: "100%",
              },

              "& .MuiPickersSlideTransition-root": {
                height: "auto !important",
                overflow: "visible !important",
              },
              "& .MuiDayCalendar-slideTransition": {
                height: "auto !important",
                overflow: "visible !important",
              },
              "& .MuiDayCalendar-monthContainer": {
                width: "100%",
                height: "auto",
              },

              // header row
              "& .MuiDayCalendar-header": {
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                columnGap: "6px",
                width: "100%",
                m: 0,
              },
              "& .MuiDayCalendar-weekDayLabel": {
                width: "100%",
                fontWeight: 900,
                opacity: 0.75,
                fontSize: "0.85rem",
                m: 0,
                textAlign: "center",
              },

              // week rows
              "& .MuiDayCalendar-weekContainer": {
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                columnGap: "6px",
                width: "100%",
                m: 0,
                p: 0,
                mb: "6px",
              },

              // day cells
              "& .MuiPickersDay-root": {
                width: "100%",
                height: { xs: 44, sm: 56 },
                borderRadius: 1,
                m: 0,
                p: 0,
                boxSizing: "border-box",
                border: "1px solid",
                borderColor: "divider",
                fontSize: "1rem",
              },

              // make the "filler" cells look like empty boxes
              "& .MuiPickersDay-hiddenDaySpacingFiller": {
                width: "100%",
                height: { xs: 44, sm: 56 },
                borderRadius: 1,
                boxSizing: "border-box",
                border: "1px solid",
                borderColor: "divider",
                opacity: 0.35,
              },
            }}
          />
        </LocalizationProvider>
      </Box>
    </Box>
  );
}

/** --------- Inline BookingDrawer --------- */
function BookingDrawer({ open, onClose, selectedDate }) {
  const [eventTypes, setEventTypes] = React.useState([]);

  const [requestedBy, setRequestedBy] = React.useState("");
  const [eventTypeId, setEventTypeId] = React.useState("");
  const [otherEventName, setOtherEventName] = React.useState("");

  const [date, setDate] = React.useState(selectedDate);
  const [startTime, setStartTime] = React.useState(dayjs().hour(19).minute(0));
  const [endTime, setEndTime] = React.useState(dayjs().hour(22).minute(0));

  // ✅ Amount is now manual input
  const [amount, setAmount] = React.useState(0);

  // ✅ Discount (%)
  const [discountPct, setDiscountPct] = React.useState(0);

  const [resources, setResources] = React.useState({
    chairs: 0,
    tables: 0,
    aircon: false,
    lights: true,
    sounds: false,
    led: false,
  });

  const OTHER_VALUE = "__OTHER__";
  const isOther = eventTypeId === OTHER_VALUE;

  React.useEffect(() => {
    axios
      .get(`${API}/event-types`)
      .then((res) => setEventTypes(res.data))
      .catch((err) => {
        console.error(err);
        alert("Failed to load event types.");
      });
  }, []);

  React.useEffect(() => {
    setDate(selectedDate);
  }, [selectedDate]);

  const selectedEvent = eventTypes.find((e) => e.id === eventTypeId);

  // ✅ If selecting a normal event type, optionally set a helpful default amount
  React.useEffect(() => {
    if (!selectedEvent) return;
    // Only auto-fill if amount is 0 (so we don't overwrite manual edits)
    if (Number(amount || 0) === 0) setAmount(Number(selectedEvent.baseAmount || 0));
  }, [selectedEvent]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ When switching away from "Other", clear the custom input
  React.useEffect(() => {
    if (!isOther) setOtherEventName("");
  }, [isOther]);

  const durationHours = React.useMemo(() => {
    if (!startTime || !endTime) return 1;
    const mins = endTime.diff(startTime, "minute");
    return Math.max(1, mins / 60);
  }, [startTime, endTime]);

  const safeAmount = React.useMemo(() => Math.max(0, Number(amount || 0)), [amount]);
  const safeDiscountPct = React.useMemo(() => {
    const v = Number(discountPct || 0);
    return Math.min(100, Math.max(0, v));
  }, [discountPct]);

  const discountValue = React.useMemo(() => {
    return Math.round((safeAmount * safeDiscountPct) / 100);
  }, [safeAmount, safeDiscountPct]);

  const finalAmount = React.useMemo(() => {
    return Math.max(0, safeAmount - discountValue);
  }, [safeAmount, discountValue]);

  const finalEventName = React.useMemo(() => {
    if (isOther) return otherEventName.trim();
    return selectedEvent?.name || "";
  }, [isOther, otherEventName, selectedEvent]);

  async function submit() {
    if (!requestedBy.trim()) return alert("Please enter Requested by (Name).");
    if (!eventTypeId) return alert("Please select Event Name.");
    if (isOther && !otherEventName.trim()) return alert("Please enter the Event Name (Other).");
    if (!isOther && !selectedEvent) return alert("Please select a valid Event Name.");
    if (safeAmount <= 0) return alert("Please enter a valid Amount.");

    try {
      const payload = {
        requestedBy: requestedBy.trim(),

        // ✅ keep both so backend can evolve without breaking
        eventTypeId: isOther ? null : eventTypeId,
        eventName: finalEventName,

        date: date.format("YYYY-MM-DD"),
        startTime: startTime.format("HH:mm"),
        endTime: endTime.format("HH:mm"),
        durationHours,

        amount: safeAmount,
        discountPct: safeDiscountPct,
        discountValue,
        finalAmount,

        resources,
      };

      const res = await axios.post(`${API}/bookings`, payload);
      alert(`Booked! Final Amount: ${res.data.finalAmount ?? finalAmount}`);
      onClose();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Booking failed.");
    }
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 340, sm: 460 }, p: 2 }}>
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

        {/* ✅ Event dropdown + Other */}
        <FormControl fullWidth sx={{ mb: isOther ? 1 : 2 }}>
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

            <Divider sx={{ my: 1 }} />

            <MenuItem value={OTHER_VALUE}>
              <Typography sx={{ fontWeight: 800 }}>Others...</Typography>
            </MenuItem>
          </Select>
        </FormControl>

        {/* ✅ Only show input if Others */}
        {isOther && (
          <TextField
            fullWidth
            autoFocus
            label="Other Event Name"
            placeholder="Type event name (ex: Birthday, Wedding...)"
            value={otherEventName}
            onChange={(e) => setOtherEventName(e.target.value)}
            sx={{ mb: 2 }}
          />
        )}

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

        {/* ✅ Amount + Discount + Result */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1.2fr 0.8fr 0.95fr" },
            gap: 1,
            mb: 2,
            alignItems: "stretch",
          }}
        >
          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value || 0))}
            inputProps={{ min: 0 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">₱</InputAdornment>,
            }}
          />

          <TextField
            label="Discount"
            type="number"
            value={discountPct}
            onChange={(e) => setDiscountPct(Number(e.target.value || 0))}
            inputProps={{ min: 0, max: 100 }}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            helperText={`- ₱${discountValue.toLocaleString()}`}
          />

          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              px: 2,
              py: 1.25,
              bgcolor: "background.paper",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 0.25,
            }}
          >
            <Typography sx={{ fontSize: 12, opacity: 0.75, fontWeight: 700 }}>
              Final Amount
            </Typography>
            <Typography sx={{ fontSize: 18, fontWeight: 900, color: "primary.main" }}>
              ₱{finalAmount.toLocaleString()}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography sx={{ fontSize: 12, opacity: 0.75 }}>
            Duration: <b>{durationHours}</b> hr(s)
          </Typography>
          <Typography sx={{ fontSize: 12, opacity: 0.75 }}>
            Discount: <b>{safeDiscountPct}%</b>
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
          Resources
        </Typography>
        <ResourceInputs resources={resources} setResources={setResources} />

        <Divider sx={{ my: 2 }} />
        <Button fullWidth variant="contained" onClick={submit} sx={{ fontWeight: 800, py: 1.1 }}>
          Submit Booking
        </Button>
      </Box>
    </Drawer>
  );
}

/** --------- Page --------- */
export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = React.useState(dayjs());
  const [open, setOpen] = React.useState(false);
  const [calendarView, setCalendarView] = React.useState("day");

  return (
    <>
      <Topbar title="Scheduling" />

      {/* Full-width container */}
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
        }}
      >
        <Box
          sx={{
            minHeight: "calc(100vh - 88px)",
            width: "100%",
          }}
        >
          <HowItWorks />
          
          <CalendarSection
            value={selectedDate}
            onViewChange={(v) => setCalendarView(v)}
            onChange={(v, selectionState) => {
              if (!v) return;
              setSelectedDate(v);
              const finished = selectionState ? selectionState === "finish" : calendarView === "day";
              if (finished) setOpen(true);
            }}
          />
        </Box>
      </Container>

      <BookingDrawer open={open} onClose={() => setOpen(false)} selectedDate={selectedDate} />
    </>
  );
}