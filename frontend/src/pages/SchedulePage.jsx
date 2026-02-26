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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Stack,
} from "@mui/material";

import Topbar from "@/components/Topbar.jsx";
import PrintDialog from "@/components/Print.jsx";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArchiveIcon from "@mui/icons-material/Archive";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import CloseIcon from "@mui/icons-material/Close";

import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";

import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

// ✅ Use proxy: /api -> backend
const API = "/api";

/** --------- Inline ResourceToggles --------- */
const toggleItems = [
  { key: "aircon", label: "Aircon" },
  { key: "lights", label: "Lights" },
  { key: "sounds", label: "Sounds" },
  { key: "led", label: "LED" },
];

/** --------- Venues (static list) --------- */
const VENUES = [
  "Unlad Gymnasium",
  "Noveleta Plaza",
  "Noveleta Public Market Rooftop",
];

// ✅ input limits (adjust if needed)
const LIMITS = {
  requestedBy: 40,      // name length
  otherEventName: 40,   // event name length
  chairsDigits: 3,      // 0 - 999
  tablesDigits: 3,      // 0 - 999
  amountDigits: 7,      // up to 9,999,999
  discountDigits: 3,    // up to 100
  donationDigits: 7,
};

function ResourceInputs({ resources, setResources }) {
  const setQty = (key, maxDigits) => (e) => {
    const raw = e.target.value;

    if (raw === "") {
      setResources({ ...resources, [key]: "" });
      return;
    }

    if (!/^\d+$/.test(raw)) return;
    if (raw.length > maxDigits) return;

    setResources({ ...resources, [key]: raw });
  };

  const normalizeQty = (key) => () => {
    const v = resources[key];

    // if empty -> keep empty (or set to "0" if you prefer)
    if (v === "") return;

    // remove leading zeros, but keep "0" if that's all
    const n = Math.max(0, parseInt(v, 10) || 0);
    setResources({ ...resources, [key]: n === 0 ? "" : String(n) });
  };

  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        <TextField
          label="Chairs (qty)"
          value={resources.chairs ?? ""}
          onChange={setQty("chairs", LIMITS.chairsDigits)}
          onBlur={normalizeQty("chairs")}
          onFocus={(e) => e.target.select()}
          placeholder="0"
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        />

        <TextField
          label="Tables (qty)"
          value={resources.tables ?? ""}
          onChange={setQty("tables", LIMITS.tablesDigits)}
          onBlur={normalizeQty("tables")}
          onFocus={(e) => e.target.select()}
          placeholder="0"
          inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
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
        Pick a date on the calendar to create a schedule. Select an event,
        or choose <b>Others</b> to type a custom event. Enter amount and optional
        discount to instantly see the final amount.
      </Typography>
    </Paper>
  );
}

/** --------- Inline CalendarSection (FIXED OVERFLOW & CENTERED YEAR) --------- */
function CalendarSection({ selectedDates, onToggleDate, onViewChange, headerActions }) {
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

  const isSelected = React.useCallback(
    (day) => selectedDates?.some((d) => d && day && d.isSame(day, "day")),
    [selectedDates]
  );

  // Custom day renderer: allows multi-select highlighting
  function MultiPickDay(props) {
    const { day, outsideCurrentMonth, ...other } = props;
    const selected = isSelected(day);

    return (
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        selected={selected}
        onDaySelect={() => onToggleDate?.(day)}
        sx={{
          ...(selected
            ? {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                borderColor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
              }
            : {}),
        }}
      />
    );
  }

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
            gap: 1,
            mb: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Select date(s)
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              ml: "auto",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {headerActions}
          </Box>
        </Box>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            // keep a "reference" date so calendar still knows where to display
            value={selectedDates?.[0] ?? dayjs()}
            onViewChange={onViewChange}
            showDaysOutsideCurrentMonth={false}
            minDate={dayjs()}
            onMonthChange={() => {
              measure();
              setTimeout(measure, 0);
              setTimeout(measure, 180);
              setTimeout(measure, 360);
            }}
            slots={{ day: MultiPickDay }}
            sx={{
              width: "100%",
              maxWidth: "none",
              m: 0,
              "&.MuiDateCalendar-root": { height: "auto", overflow: "visible" },

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

              "& .MuiDayCalendar-weekContainer": {
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                columnGap: "6px",
                width: "100%",
                m: 0,
                p: 0,
                mb: "6px",
              },

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
function BookingDrawer({ open, onClose, selectedDates, onBooked, initialBooking, existingBookings = [] }) {
  const [eventTypes, setEventTypes] = React.useState([]);

  const [requestedBy, setRequestedBy] = React.useState("");
  const [eventTypeId, setEventTypeId] = React.useState("");
  const [otherEventName, setOtherEventName] = React.useState("");
  const [venue, setVenue] = React.useState("");

  const [dates, setDates] = React.useState(selectedDates || []);
  const [startTime, setStartTime] = React.useState(dayjs().hour(19).minute(0));
  const [endTime, setEndTime] = React.useState(dayjs().hour(22).minute(0));

  const [amount, setAmount] = React.useState("");
  const [discountPct, setDiscountPct] = React.useState("");

  const [donation, setDonation] = React.useState("");

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [snack, setSnack] = React.useState({
    open: false,
    message: "",
    severity: "info", // "success" | "info" | "warning" | "error"
  });

  const notify = React.useCallback((message, severity = "info") => {
    setSnack({ open: true, message, severity });
  }, []);

  const closeSnack = (event, reason) => {
    if (reason === "clickaway") return;
    setSnack((s) => ({ ...s, open: false }));
  };

  const [resources, setResources] = React.useState({
    chairs: "",
    tables: "",
    aircon: false,
    lights: true,
    sounds: false,
    led: false,
  });

  // ✅ confirm-close dialog state
  const [confirmCloseOpen, setConfirmCloseOpen] = React.useState(false);

  // ✅ snapshot to detect "dirty" changes
  const initialRef = React.useRef(null);

  const OTHER_VALUE = "__OTHER__";
  const isOther = eventTypeId === OTHER_VALUE;

  React.useEffect(() => {
    axios
      .get(`${API}/event-types`)
      .then((res) => setEventTypes(res.data))
      .catch((err) => {
        console.error(err);
        notify("Failed to load event types.", "error");
      });
  }, [notify]);

  // keep date in sync
  React.useEffect(() => {
    setDates(Array.isArray(selectedDates) ? selectedDates : []);
  }, [selectedDates]);

  const selectedEvent = eventTypes.find((e) => e.id === eventTypeId);

  // ✅ When switching away from "Other", clear the custom input
  React.useEffect(() => {
    if (!isOther) setOtherEventName("");
  }, [isOther]);

  const durationHours = React.useMemo(() => {
    if (!startTime || !endTime) return 1;
    const mins = endTime.diff(startTime, "minute");
    return Math.max(1, mins / 60);
  }, [startTime, endTime]);

  const safeAmount = React.useMemo(() => {
    if (amount === "" || amount == null) return 0;
    return Math.max(0, Number(amount));
  }, [amount]);

  const safeDiscountPct = React.useMemo(() => {
    if (discountPct === "" || discountPct == null) return 0;
    const v = Number(discountPct);
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

  // ✅ snapshot builder for dirty-check
  const makeSnapshot = React.useCallback(() => {
    return {
      requestedBy: requestedBy.trim(),
      eventTypeId,
      otherEventName: otherEventName.trim(),
      venue: venue.trim(),
      date: (dates?.[0]?.format("YYYY-MM-DD")) || "",
      startTime: startTime?.format("HH:mm") || "",
      endTime: endTime?.format("HH:mm") || "",
      amount: Number(amount || 0),
      discountPct: Number(discountPct || 0),
      donation: Number(donation || 0),
      resources,
    };
  }, [
    requestedBy,
    eventTypeId,
    otherEventName,
    venue,
    dates,
    startTime,
    endTime,
    amount,
    discountPct,
    donation,
    resources,
  ]);

  const isDirty = React.useMemo(() => {
    if (!open) return false;
    if (!initialRef.current) return false;
    return JSON.stringify(makeSnapshot()) !== JSON.stringify(initialRef.current);
  }, [open, makeSnapshot]);

  React.useEffect(() => {
    if (!open) return;

    setConfirmCloseOpen(false);

    const isEdit = !!initialBooking?.id;

    if (isEdit) {
      // --- EDIT MODE: prefill from booking ---
      const b = initialBooking;

      setRequestedBy(b.requestedBy ?? "");

      // if eventTypeId exists => normal, else Others
      if (b.eventTypeId) {
        setEventTypeId(b.eventTypeId);
        setOtherEventName("");
      } else {
        setEventTypeId(OTHER_VALUE);
        setOtherEventName(b.eventName ?? "");
      }

      setVenue(b.venue ?? "");
      setDates([dayjs(b.date)]);

      setStartTime(dayjs(`${b.date}T${b.startTime}`));
      setEndTime(dayjs(`${b.date}T${b.endTime}`));

      setAmount(String(b.amount ?? ""));
      setDiscountPct(String(b.discountPct ?? ""));
      setDonation(String(b.donation ?? ""));

      setResources({
        chairs: String(b.resources?.chairs ?? ""),
        tables: String(b.resources?.tables ?? ""),
        aircon: !!b.resources?.aircon,
        lights: !!b.resources?.lights,
        sounds: !!b.resources?.sounds,
        led: !!b.resources?.led,
      });

      setTimeout(() => {
        initialRef.current = {
          requestedBy: String(b.requestedBy ?? "").trim(),
          eventTypeId: b.eventTypeId ? b.eventTypeId : OTHER_VALUE,
          otherEventName: b.eventTypeId ? "" : String(b.eventName ?? "").trim(),
          venue: String(b.venue ?? "").trim(),
          date: String(b.date ?? ""),
          startTime: String(b.startTime ?? ""),
          endTime: String(b.endTime ?? ""),
          amount: Number(b.amount ?? 0),
          discountPct: Number(b.discountPct ?? 0),
          donation: Number(b.donation ?? 0),
          resources: {
            chairs: String(b.resources?.chairs ?? ""),
            tables: String(b.resources?.tables ?? ""),
            aircon: !!b.resources?.aircon,
            lights: !!b.resources?.lights,
            sounds: !!b.resources?.sounds,
            led: !!b.resources?.led,
          },
        };
      }, 0);

      return;
    }

    // --- CREATE MODE (MULTI-DATE) ---
    const baseDate =
      (Array.isArray(selectedDates) && selectedDates[0]) ? selectedDates[0] : dayjs();

    setRequestedBy("");
    setEventTypeId("");
    setOtherEventName("");
    setVenue("");

    // keep selected dates (at least 1)
    setDates(Array.isArray(selectedDates) && selectedDates.length ? selectedDates : [baseDate]);

    setStartTime(dayjs(baseDate).hour(19).minute(0));
    setEndTime(dayjs(baseDate).hour(22).minute(0));

    setAmount("");
    setDiscountPct("");
    setDonation("");
    setResources({
      chairs: "",
      tables: "",
      aircon: false,
      lights: true,
      sounds: false,
      led: false,
    });

    setTimeout(() => {
      initialRef.current = {
        requestedBy: "",
        eventTypeId: "",
        otherEventName: "",
        venue: "",
        date: dayjs(baseDate).format("YYYY-MM-DD"),
        startTime: dayjs(baseDate).hour(19).minute(0).format("HH:mm"),
        endTime: dayjs(baseDate).hour(22).minute(0).format("HH:mm"),
        amount: 0,
        discountPct: 0,
        donation: 0,
        resources: {
          chairs: "",
          tables: "",
          aircon: false,
          lights: true,
          sounds: false,
          led: false,
        },
      };
    }, 0);
  }, [open, selectedDates, initialBooking]);

  // ✅ close attempt (backdrop click / ESC)
  const handleDrawerClose = (event, reason) => {
    if (isDirty) {
      setConfirmCloseOpen(true);
      return;
    }
    onClose();
  };

  const confirmDiscardAndClose = () => {
    setConfirmCloseOpen(false);
    onClose();
  };

  const cancelClose = () => setConfirmCloseOpen(false);

  const toMinutes = (hhmm) => {
    const [h, m] = String(hhmm || "").split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
    return h * 60 + m;
  };

  const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

  const bookingDates = (b) =>
    Array.isArray(b?.dates) && b.dates.length ? b.dates : (b?.date ? [b.date] : []);

  async function submit() {
    if (!requestedBy.trim()) return notify("Please enter Requested by (Name).", "warning");
    if (!eventTypeId) return notify("Please select an Event.", "warning");
    if (isOther && !otherEventName.trim()) return notify("Please enter the Event (Other).", "warning");
    if (!isOther && !selectedEvent) return notify("Please select a valid Event Name.", "warning");
    if (!venue) return notify("Please select a Venue.", "warning");
    if (safeAmount <= 0) return notify("Please enter a valid Amount.", "warning");

    const isEdit = !!initialBooking?.id;

    const dateList = (isEdit ? [dates?.[0]] : (dates || [])).filter(Boolean);
    if (!dateList.length) return notify("Please select at least one date.", "warning");

    // ✅ FRONTEND conflict check (same venue + same date + overlapping time)
    const s = toMinutes(startTime.format("HH:mm"));
    const e = toMinutes(endTime.format("HH:mm"));
    if (!Number.isFinite(s) || !Number.isFinite(e) || s >= e) {
      return notify("Invalid time range. End time must be after start time.", "warning");
    }

    const dateStrs = dateList.map((d) => d.format("YYYY-MM-DD"));
    const ignoreId = initialBooking?.id ?? null;

    for (const b of (existingBookings || [])) {
      if (ignoreId && b.id === ignoreId) continue;
      if (b.archived) continue;
      if (b.venue !== venue) continue;

      const bDates = bookingDates(b);
      const bs = toMinutes(b.startTime);
      const be = toMinutes(b.endTime);
      if (!Number.isFinite(bs) || !Number.isFinite(be)) continue;

      for (const d of dateStrs) {
        if (!bDates.includes(d)) continue;

        if (rangesOverlap(s, e, bs, be)) {
          return notify(
            `Schedule conflict: ${venue} already booked on ${d} (${b.startTime} - ${b.endTime}).`,
            "error"
          );
        }
      }
    }

    // ✅ normalize chairs/tables once
    const normalizedResources = {
      ...resources,
      chairs: Math.max(0, Number(resources.chairs || 0)),
      tables: Math.max(0, Number(resources.tables || 0)),
    };

    const common = {
      requestedBy: requestedBy.trim(),
      eventTypeId: isOther ? null : eventTypeId,
      eventName: finalEventName,
      venue,
      startTime: startTime.format("HH:mm"),
      endTime: endTime.format("HH:mm"),
      durationHours,
      amount: safeAmount,
      discountPct: safeDiscountPct,
      discountValue,
      finalAmount,
      donation: Math.max(0, Number(donation || 0)),
      resources: normalizedResources,
    };

    try {
      // ✅ EDIT: single PUT
      if (isEdit) {
        const payload = {
          ...common,
          date: dateList[0].format("YYYY-MM-DD"),
        };

        const res = await axios.put(`${API}/bookings/${initialBooking.id}`, payload);
        const updated = res.data;

        notify(
          `Updated! Final Amount: ₱${Number(updated?.finalAmount ?? finalAmount).toLocaleString()}`,
          "success"
        );

        onBooked?.(updated ?? payload);
        initialRef.current = makeSnapshot();
        onClose();
        return;
      }

      // ✅ CREATE: single POST (one booking with multiple dates)
      const payload = {
        ...common,
        dates: dateList.map((d) => d.format("YYYY-MM-DD")),
        date: dateList[0].format("YYYY-MM-DD"), // keep for backward compatibility
      };

      const res = await axios.post(`${API}/bookings`, payload);
      const created = res.data;

      notify(`Booked ${dateList.length} day(s)!`, "success");
      onBooked?.(created ?? payload);

      initialRef.current = makeSnapshot();
      onClose();
    } catch (err) {
      console.error(err);
      notify(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Booking failed.",
        "error"
      );
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDrawerClose}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        // nice center + frosted backdrop feel
        slotProps={{
          backdrop: {
            sx: {
              bgcolor: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
            },
          },
          paper: {
            sx: {
              borderRadius: 1,
              overflow: "hidden",
              boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
              border: "1px solid",
              borderColor: "divider",
            },
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            py: 1.5,
            px: 2,
            position: "sticky",
            top: 0,
            zIndex: 2,
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>
              {initialBooking?.id ? "Edit Schedule" : "Create Schedule"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              Select details for the booking.
            </Typography>
          </Box>

          <Tooltip title="Close">
            <IconButton onClick={(e) => handleDrawerClose(e, "closeButton")} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        {/* Content */}
        <DialogContent dividers sx={{ px: 2, py: 2 }}>
          <TextField
            fullWidth
            label="Requested by (Name)"
            value={requestedBy}
            onChange={(e) => setRequestedBy(e.target.value.slice(0, LIMITS.requestedBy))}
            inputProps={{ maxLength: LIMITS.requestedBy }}
            helperText={`${requestedBy.length}/${LIMITS.requestedBy}`}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: isOther ? 1 : 2 }}>
            <InputLabel>Events</InputLabel>
            <Select
              label="Events"
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

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Venue</InputLabel>
            <Select label="Venue" value={venue} onChange={(e) => setVenue(e.target.value)}>
              {VENUES.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {isOther && (
            <TextField
              fullWidth
              autoFocus
              label="Other Event Name"
              placeholder="Type event name (ex: Birthday, Wedding...)"
              value={otherEventName}
              onChange={(e) => setOtherEventName(e.target.value.slice(0, LIMITS.otherEventName))}
              inputProps={{ maxLength: LIMITS.otherEventName }}
              helperText={`${otherEventName.length}/${LIMITS.otherEventName}`}
              sx={{ mb: 2 }}
            />
          )}

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={`Date (Selected: ${dates.length})`}
              value={dates[0] ?? null}
              onChange={(v) => {
                if (!v) return;
                setDates([v]);
              }}
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

            <TextField
              label="Donation"
              value={String(donation ?? "")}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") return setDonation("");
                if (!/^\d+$/.test(raw)) return;
                if (raw.length > LIMITS.donationDigits) return;
                setDonation(raw);
              }}
              onFocus={(e) => e.target.select()}
              onBlur={() => {
                if (donation === "") return;
                const n = Math.max(0, parseInt(donation, 10) || 0);
                setDonation(n === 0 ? "" : String(n));
              }}
              placeholder="0"
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
              }}
              sx={{ mb: 2, width: "100%" }}
            />
          </LocalizationProvider>

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
              value={String(amount ?? "")}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") return setAmount("");
                if (!/^\d+$/.test(raw)) return;
                if (raw.length > LIMITS.amountDigits) return;
                setAmount(raw);
              }}
              onFocus={(e) => e.target.select()}
              onBlur={() => {
                if (amount === "") return;
                const n = Math.max(0, parseInt(amount, 10) || 0);
                setAmount(n === 0 ? "" : String(n));
              }}
              placeholder="0"
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              InputProps={{
                startAdornment: <InputAdornment position="start">₱</InputAdornment>,
              }}
            />

            <TextField
              label="Discount"
              value={String(discountPct ?? "")}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") return setDiscountPct("");
                if (!/^\d+$/.test(raw)) return;
                if (raw.length > LIMITS.discountDigits) return;
                const n = Math.min(100, Number(raw));
                setDiscountPct(String(n));
              }}
              onFocus={(e) => e.target.select()}
              onBlur={() => {
                if (discountPct === "") return;
                const n = Math.min(100, Math.max(0, parseInt(discountPct, 10) || 0));
                setDiscountPct(n === 0 ? "" : String(n));
              }}
              placeholder="0"
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              helperText={`- ₱${discountValue.toLocaleString()}`}
            />

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
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
        </DialogContent>

        {/* Footer */}
        <DialogActions
          sx={{
            px: 2,
            py: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            position: "sticky",
            bottom: 0,
            zIndex: 2,
          }}
        >
          <Button
            onClick={(e) => handleDrawerClose(e, "cancel")}
            variant="outlined"
            sx={{ fontWeight: 800 }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={submit}
            sx={{ fontWeight: 900, px: 2.5 }}
          >
            {initialBooking?.id ? "Update Booking" : "Submit Booking"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Confirm close dialog */}
      <Dialog open={confirmCloseOpen} onClose={cancelClose}>
        <DialogTitle>Discard changes?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes in this schedule. If you close now, your inputs will be lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelClose}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDiscardAndClose}>
            Discard & Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Snackbar (replaces alert()) */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.severity}
          variant="filled"
          sx={{
            width: "100%",
            fontWeight: 700,
            "&.MuiAlert-filledSuccess": { bgcolor: "success.main", color: "success.contrastText" },
            "&.MuiAlert-filledError": { bgcolor: "error.main", color: "error.contrastText" },
            "&.MuiAlert-filledWarning": { bgcolor: "warning.main", color: "warning.contrastText" },
            "&.MuiAlert-filledInfo": { bgcolor: "info.main", color: "info.contrastText" },
          }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}

/** --------- Inline BookingDetailsDialog --------- */
function BookingDetailsDialog({ open, booking, onClose }) {
  if (!booking) return null;

  const r = booking.resources || {};
  const money = (n) => `₱${Number(n || 0).toLocaleString()}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            Booking Details
          </Typography>
          <Typography sx={{ fontSize: 12, opacity: 0.7 }}>
            ID: {booking.id ?? "—"}
          </Typography>
        </Box>

        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "grid", gap: 1.25 }}>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>Schedule</Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Date</Typography>
                <Typography sx={{ fontWeight: 800 }}>{booking.date ?? "—"}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Time</Typography>
                <Typography sx={{ fontWeight: 800 }}>
                  {booking.startTime ?? "—"} - {booking.endTime ?? "—"}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Donation</Typography>
                <Typography sx={{ fontWeight: 800 }}>
                  {money(booking.donation)}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Venue</Typography>
                <Typography sx={{ fontWeight: 800 }}>{booking.venue ?? "—"}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Status</Typography>
                <Chip
                  size="small"
                  label={booking.archived ? "ARCHIVED" : "ACTIVE"}
                  sx={{ fontWeight: 800 }}
                />
              </Box>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>Event</Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Event Name</Typography>
                <Typography sx={{ fontWeight: 800 }}>{booking.eventName ?? "—"}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Requested By</Typography>
                <Typography sx={{ fontWeight: 800 }}>{booking.requestedBy ?? "—"}</Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Duration Hours</Typography>
                <Typography sx={{ fontWeight: 800 }}>{booking.durationHours ?? "—"}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Event Type ID</Typography>
                <Typography sx={{ fontWeight: 800 }}>{booking.eventTypeId ?? "Others"}</Typography>
              </Box>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>Pricing</Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Amount</Typography>
                <Typography sx={{ fontWeight: 800 }}>{money(booking.amount)}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Discount</Typography>
                <Typography sx={{ fontWeight: 800 }}>
                  {Number(booking.discountPct ?? 0)}% ({money(booking.discountValue)})
                </Typography>
              </Box>

              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Final Amount</Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 18, color: "primary.main" }}>
                  {money(booking.finalAmount)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>Resources</Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Chairs</Typography>
                <Typography sx={{ fontWeight: 800 }}>{r.chairs ?? 0}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Tables</Typography>
                <Typography sx={{ fontWeight: 800 }}>{r.tables ?? 0}</Typography>
              </Box>

              <Box sx={{ gridColumn: "1 / -1", display: "flex", gap: 1, flexWrap: "wrap", mt: 0.5 }}>
                <Chip size="small" label={`Aircon: ${r.aircon ? "Yes" : "No"}`} />
                <Chip size="small" label={`Lights: ${r.lights ? "Yes" : "No"}`} />
                <Chip size="small" label={`Sounds: ${r.sounds ? "Yes" : "No"}`} />
                <Chip size="small" label={`LED: ${r.led ? "Yes" : "No"}`} />
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "space-between", opacity: 0.7 }}>
            <Typography sx={{ fontSize: 12 }}>
              Created: {booking.createdAt ? dayjs(booking.createdAt).format("YYYY-MM-DD HH:mm") : "—"}
            </Typography>
            <Typography sx={{ fontSize: 12 }}>
              Updated: {booking.updatedAt ? dayjs(booking.updatedAt).format("YYYY-MM-DD HH:mm") : "—"}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" sx={{ fontWeight: 800 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** --------- Inline BookingHistory --------- */
function BookingHistory({
  loading,
  rows,
  onEdit,
  onDelete,
  onArchive,
  onPrint,
  onDownload,
  onRowClick,
  search,
  setSearch,
  venueFilter,
  setVenueFilter,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  venues,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: { xs: 1.5, sm: 2 },
        bgcolor: "background.paper",
        mt: { xs: 1.25, sm: 1.5 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.25,
          flexWrap: "wrap",
          mb: 1.25,
        }}
      >
        {/* Left side: Title + loading */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Booking History
          </Typography>
          {loading ? <CircularProgress size={18} /> : null}
        </Box>

        {/* Right side: Search + Filters */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            ml: "auto",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 220 }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Venue</InputLabel>
            <Select
              label="Venue"
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Venues</MenuItem>
              {venues.map((v) => (
                <MenuItem key={v} value={v}>
                  {v}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="ARCHIVED">Archived</MenuItem>
              <MenuItem value="ALL">All</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort</InputLabel>
            <Select
              label="Sort"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <MenuItem value="NEWEST">Newest</MenuItem>
              <MenuItem value="OLDEST">Oldest</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {(!rows || rows.length === 0) ? (
        <Typography sx={{ opacity: 0.75 }}>
          {loading ? "Loading bookings..." : "No bookings yet."}
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><b>Date</b></TableCell>
                <TableCell><b>Time</b></TableCell>
                <TableCell><b>Event</b></TableCell>
                <TableCell><b>Requested By</b></TableCell>
                <TableCell align="right"><b>Final</b></TableCell>
                <TableCell align="right"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((b) => (
                <TableRow
                  key={b.id ?? `${b.date}-${b.startTime}-${b.requestedBy}-${b.eventName}`}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => onRowClick?.(b)}
                >
                  <TableCell>
                    {Array.isArray(b.dates) && b.dates.length
                      ? (b.dates.length === 1 ? b.dates[0] : `${b.dates[0]} … ${b.dates[b.dates.length - 1]} (${b.dates.length} days)`)
                      : b.date}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={`${b.startTime} - ${b.endTime}`}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {b.eventName}{" "}
                    {b.archived ? <Chip size="small" label="Archived" sx={{ ml: 1 }} /> : null}
                  </TableCell>
                  <TableCell>{b.requestedBy}</TableCell>
                  <TableCell align="right">
                    ₱{Number(b.finalAmount ?? 0).toLocaleString()}
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Print">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrint?.(b);
                        }}
                      >
                        <PrintIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Download PDF">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload?.(b);
                        }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit?.(b);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Archive">
                      <span>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onArchive?.(b);
                          }}
                          disabled={!!b.archived}
                        >
                          <ArchiveIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(b);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

/** --------- Page --------- */
export default function SchedulePage() {
  const [selectedDates, setSelectedDates] = React.useState([dayjs()]);
  const [open, setOpen] = React.useState(false);
  const [calendarView, setCalendarView] = React.useState("day");

  // ✅ history state
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [bookings, setBookings] = React.useState([]);

  // ✅ filters/search
  const [search, setSearch] = React.useState("");
  const [venueFilter, setVenueFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ACTIVE"); // ACTIVE | ARCHIVED | ALL
  const [sortOrder, setSortOrder] = React.useState("NEWEST"); // NEWEST | OLDEST

  const [printOpen, setPrintOpen] = React.useState(false);
  const [printBooking, setPrintBooking] = React.useState(null);

  const [printMode, setPrintMode] = React.useState("print"); // "print" | "download"
  const [printDocType, setPrintDocType] = React.useState("permit");

  const filteredBookings = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = Array.isArray(bookings) ? [...bookings] : [];

    // status filter
    if (statusFilter === "ACTIVE") list = list.filter((b) => !b.archived);
    if (statusFilter === "ARCHIVED") list = list.filter((b) => !!b.archived);

    // venue filter
    if (venueFilter !== "ALL") list = list.filter((b) => b.venue === venueFilter);

    // search filter
    if (q) {
      list = list.filter((b) => {
        const hay = [
          b.eventName,
          b.requestedBy,
          b.venue,
          b.date,
          b.startTime,
          b.endTime,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    // sort
    list.sort((a, b) => {
      const aKey = `${a.date || ""} ${a.startTime || ""}`.trim();
      const bKey = `${b.date || ""} ${b.startTime || ""}`.trim();
      if (sortOrder === "OLDEST") return aKey.localeCompare(bKey);
      return bKey.localeCompare(aKey); // NEWEST
    });

    return list;
  }, [bookings, search, venueFilter, statusFilter, sortOrder]);

  // ✅ fetch bookings (optionally filtered by selected date)
  const loadBookings = React.useCallback(async () => {
    try {
      setHistoryLoading(true);

      // If your backend supports filtering:
      // const res = await axios.get(`${API}/bookings`, { params: { date: d.format("YYYY-MM-DD") } });

      // Otherwise, just fetch all:
      const res = await axios.get(`${API}/bookings`);

      const rows = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
      setBookings(rows);
    } catch (err) {
      console.error(err);
      // keep UI calm; optionally show alert
      // alert("Failed to load bookings.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const [editingBooking, setEditingBooking] = React.useState(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsBooking, setDetailsBooking] = React.useState(null);

  React.useEffect(() => {
    loadBookings(); // load once (global history)
  }, [loadBookings]);

  // ✅ when a booking is created, add to top + (optional) reload to be safe
  const handleBooked = (created) => {
    if (!created) return;

    setBookings((prev) => {
      const next = [created, ...prev];

      // If backend returns id, de-dupe by id
      if (created.id != null) {
        const seen = new Set();
        return next.filter((b) => {
          const key = b.id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      return next;
    });
  };

  const handleEditBooking = (b) => {
    setEditingBooking(b);
    setSelectedDates([dayjs(b.date)]);
    setOpen(true);
  };

  const handleDeleteBooking = async (b) => {
    if (!b?.id) return;
    if (!window.confirm("Delete this booking?")) return;

    try {
      await axios.delete(`${API}/bookings/${b.id}`);
      setBookings((prev) => prev.filter((x) => x.id !== b.id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete booking.");
    }
  };

  const openPrint = (b) => {
    setPrintDocType("permit");
    setPrintMode("print");
    setPrintBooking(b);
    setPrintOpen(true);
  };

  const openDownload = (b) => {
    setPrintDocType("permit");
    setPrintMode("download");
    setPrintBooking(b);
    setPrintOpen(true);
  };

  const handleArchiveBooking = async (b) => {
    if (!b?.id) return;

    try {
      const res = await axios.patch(`${API}/bookings/${b.id}/archive`);
      const updated = res.data;

      setBookings((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err) {
      console.error(err);
      alert("Failed to archive booking.");
    }
  };

  return (
    <>
      <Topbar title="Scheduling" />

      <Container
        maxWidth={false}
        disableGutters
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 3 },
        }}
      >
        <Box sx={{ minHeight: "calc(100vh - 88px)", width: "100%" }}>
          <HowItWorks />

          <CalendarSection
            selectedDates={selectedDates}
            onToggleDate={(d) => {
              if (!d) return;
              setSelectedDates((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                const exists = list.some((x) => x && x.isSame(d, "day"));
                if (exists) return list.filter((x) => !x.isSame(d, "day"));
                return [...list, d].sort((a, b) => a.valueOf() - b.valueOf());
              });
            }}
            onViewChange={(v) => setCalendarView(v)}
            headerActions={
              <>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedDates([dayjs()])}
                  sx={{ fontWeight: 800 }}
                >
                  Reset
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => setSelectedDates([])}
                  sx={{ fontWeight: 800 }}
                >
                  Clear
                </Button>

                <Button
                  variant="contained"
                  disabled={!selectedDates.length}
                  onClick={() => {
                    setEditingBooking(null);
                    setOpen(true);
                  }}
                  sx={{ fontWeight: 800 }}
                >
                  Create Schedule ({selectedDates.length})
                </Button>
              </>
            }
          />

          {/* ✅ History BELOW the calendar */}
            <BookingHistory
              loading={historyLoading}
              rows={filteredBookings}
              onEdit={handleEditBooking}
              onDelete={handleDeleteBooking}
              onArchive={handleArchiveBooking}
              onPrint={openPrint}
              onDownload={openDownload}
              onRowClick={(b) => {
                setDetailsBooking(b);
                setDetailsOpen(true);
              }}
              search={search}
              setSearch={setSearch}
              venueFilter={venueFilter}
              setVenueFilter={setVenueFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              venues={VENUES}
            />
        </Box>
      </Container>

      <BookingDrawer
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingBooking(null);
        }}
        selectedDates={selectedDates}
        initialBooking={editingBooking}
        existingBookings={bookings}
        onBooked={(created) => {
          // keep your existing update logic
          setBookings((prev) => {
            if (created?.id && prev.some((x) => x.id === created.id)) {
              return prev.map((x) => (x.id === created.id ? created : x));
            }
            return [created, ...prev];
          });

          // ✅ open print
          setPrintMode("print");
          setPrintBooking(created);
          setPrintOpen(true);
        }}
      />

      {/* ✅ Booking Details Dialog (PASTE HERE) */}
      <BookingDetailsDialog
        open={detailsOpen}
        booking={detailsBooking}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsBooking(null);
        }}
      />

      {/* ✅ Print Dialog (ADD THIS HERE) */}
      <PrintDialog
        open={printOpen}
        booking={printBooking}
        docType={printDocType}
        mode={printMode}
        autoPrint={printMode === "print"}
        autoDownload={printMode === "download"}
        onClose={() => {
          setPrintOpen(false);
          setPrintBooking(null);
        }}
      />
    </>
  );
}