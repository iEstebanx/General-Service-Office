// frontend/src/pages/SchedulePage.jsx
import React from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  FormControlLabel,
  Switch,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
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
  ButtonGroup,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import Topbar from "@/components/Topbar.jsx";
import PrintDialog from "@/components/Print.jsx";

import MoreVertIcon from "@mui/icons-material/MoreVert";

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

import TablePagination from "@mui/material/TablePagination";
import TableSortLabel from "@mui/material/TableSortLabel";

import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";

import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

// ✅ Use proxy: /api -> backend
const API = "/api";

const STATUS = {
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  CANCELED: "CANCELED",
  ARCHIVED: "ARCHIVED",
};

function getBookingStatus(b) {
  const raw = b?.status ? String(b.status).toUpperCase() : "";

  // ✅ legacy compatibility: treat ACTIVE as SUBMITTED
  if (raw === "ACTIVE") return STATUS.SUBMITTED;

  if (raw) return raw;

  if (b?.archived) return STATUS.ARCHIVED;
  if (b?.canceled) return STATUS.CANCELED;
  return STATUS.SUBMITTED; // fallback
}

// Latest date of a booking (supports single date or multi-date)
function getBookingLastDate(b) {
  const ds = Array.isArray(b?.dates) && b.dates.length ? b.dates : (b?.date ? [b.date] : []);
  if (!ds.length) return null;
  return ds.map((d) => dayjs(d)).sort((a, c) => a.valueOf() - c.valueOf())[ds.length - 1];
}

// Hide cancel if event already ended (current date is past booking date)
function isBookingPast(b) {
  const last = getBookingLastDate(b);
  if (!last) return false;
  return dayjs().startOf("day").isAfter(last.startOf("day"), "day");
}

function getStatusChipProps(status) {
  switch (status) {
    case STATUS.SUBMITTED:
      return { label: "SUBMITTED", color: "info", variant: "filled" };
    case STATUS.APPROVED:
      return { label: "APPROVED", color: "success", variant: "filled" };
    case STATUS.CANCELED:
      return { label: "CANCELED", color: "error", variant: "filled" };
    case STATUS.ARCHIVED:
      return { label: "ARCHIVED", color: "warning", variant: "filled" };
    default:
      return { label: "SUBMITTED", color: "info", variant: "filled" };
  }
}

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
  "Others",
];

// ✅ input limits (adjust if needed)
const LIMITS = {
  requestedBy: 40,
  otherEventName: 40,
  chairsDigits: 3,
  tablesDigits: 3,
  amountDigits: 7,
};

// Helper function to format dates nicely without repeating month/year
function formatDateRange(booking) {
  const dates = Array.isArray(booking?.dates) && booking.dates.length
    ? booking.dates
    : (booking?.date ? [booking.date] : []);

  if (!dates.length) return "—";
  if (dates.length === 1) return dayjs(dates[0]).format("MMMM D, YYYY");

  const list = dates
    .filter(Boolean)
    .map((d) => dayjs(d))
    .sort((a, b) => a.valueOf() - b.valueOf());

  // group by month-year
  const groups = new Map();
  for (const d of list) {
    const key = d.format("MMMM YYYY"); // April 2026
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }

  const parts = [];
  for (const [, arr] of groups.entries()) {
    arr.sort((a, b) => a.valueOf() - b.valueOf());

    // build consecutive ranges inside the month
    const ranges = [];
    let start = arr[0];
    let prev = arr[0];

    for (let i = 1; i < arr.length; i++) {
      const cur = arr[i];
      const isNextDay = cur.diff(prev, "day") === 1;

      if (!isNextDay) {
        ranges.push([start, prev]);
        start = cur;
      }
      prev = cur;
    }
    ranges.push([start, prev]);

    // format: "April 11, 13–18, 2026"
    const year = arr[0].format("YYYY");
    const month = arr[0].format("MMMM");

    const daysText = ranges
      .map(([s, e]) => {
        const sd = s.date();
        const ed = e.date();
        return sd === ed ? `${sd}` : `${sd}–${ed}`;
      })
      .join(", ");

    parts.push(`${month} ${daysText}, ${year}`);
  }

  return parts.join(" and ");
}

// ✅ Format Dayjs date list nicely (no repeated months)
function formatSelectedDatesDayjs(dateObjs = []) {
  const list = (Array.isArray(dateObjs) ? dateObjs : [])
    .filter(Boolean)
    .map((d) => dayjs(d))
    .sort((a, b) => a.valueOf() - b.valueOf());

  if (!list.length) return "—";
  if (list.length === 1) return list[0].format("MMM D, YYYY");

  // group by month-year
  const groups = new Map();
  for (const d of list) {
    const key = d.format("MMM YYYY"); // Feb 2026
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }

  const parts = [];
  for (const [key, arr] of groups.entries()) {
    arr.sort((a, b) => a.valueOf() - b.valueOf());

    // build consecutive ranges inside the month
    const ranges = [];
    let start = arr[0];
    let prev = arr[0];

    for (let i = 1; i < arr.length; i++) {
      const cur = arr[i];
      const isNextDay = cur.diff(prev, "day") === 1;

      if (!isNextDay) {
        ranges.push([start, prev]);
        start = cur;
      }
      prev = cur;
    }
    ranges.push([start, prev]);

    // format: "Feb 27–28, 2026" or "Feb 3, 5, 9, 2026"
    const year = arr[0].format("YYYY");
    const month = arr[0].format("MMM");

    const daysText = ranges
      .map(([s, e]) => {
        const sd = s.date();
        const ed = e.date();
        return sd === ed ? `${sd}` : `${sd}–${ed}`;
      })
      .join(", ");

    parts.push(`${month} ${daysText}, ${year}`);
  }

  return parts.join(" and ");
}

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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr 1fr" },
          gap: 1,
        }}
      >
        {toggleItems.map((it) => (
          <Box
            key={it.key}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              px: 1.25,
              py: 0.75,
            }}
          >
            <FormControlLabel
              label={it.label}
              labelPlacement="start" // ✅ label left, switch right
              sx={{
                m: 0,
                width: "100%",
                display: "flex",
                justifyContent: "space-between", // ✅ fills the whole cell, no dead space
              }}
              control={
                <Switch
                  checked={!!resources[it.key]}
                  onChange={(e) =>
                    setResources({ ...resources, [it.key]: e.target.checked })
                  }
                />
              }
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/** --------- Inline CalendarSection (FIXED OVERFLOW & CENTERED YEAR) --------- */
function CalendarSection({
  calendarView,
  selectedDates, 
  onToggleDate, 
  onViewChange, 
  headerActions,
  calendarMonth,
  onMonthChange,
  reservedByDate,
  onReservedDayClick,
}) {
  const contentRef = React.useRef(null);
  const [cardHeight, setCardHeight] = React.useState(null);
  const EXTRA_HEIGHT = 16;

  const measure = React.useCallback(() => {
    if (!contentRef.current) return;
    const h = contentRef.current.scrollHeight;
    if (h) setCardHeight(h);
  }, []);

  // ✅ 1) Observe size changes (works for actual resize, not always for scrollHeight changes)
  React.useEffect(() => {
    if (!contentRef.current) return;

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(contentRef.current);

    return () => ro.disconnect();
  }, [measure]);

  // ✅ 2) Re-measure on month change (this fixes the 4-row -> 5-row clipping)
  React.useEffect(() => {
    const t1 = setTimeout(measure, 0);
    const t2 = setTimeout(measure, 120);
    const t3 = setTimeout(measure, 250);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [calendarMonth, measure]);

  const isSelected = React.useCallback(
    (day) => selectedDates?.some((d) => d && day && d.isSame(day, "day")),
    [selectedDates]
  );

  // Custom day renderer: allows multi-select highlighting
  function MultiPickDay(props) {
    const { day, outsideCurrentMonth, ...other } = props;
    const selected = isSelected(day);

    const dateStr = day?.format("YYYY-MM-DD");
    const reservedList = dateStr && reservedByDate ? reservedByDate.get(dateStr) : null;
    const isReserved = !!(reservedList && reservedList.length);

    // ✅ disable ONLY past days with NO reservation
    const today = dayjs().startOf("day");
    const isPast = day && day.isBefore(today, "day");

    // ✅ allow clicking past days IF they are reserved (to view list)
    const isDisabled = isPast && !isReserved;

    // ✅ Decide day status for coloring:
    // - If there is at least 1 non-canceled booking, ignore canceled for day color
    // - Only show CANCELED if ALL are canceled
    let dayStatus = null;
    let displayList = reservedList || [];

    if (displayList.length) {
      const nonCanceled = displayList.filter((b) => getBookingStatus(b) !== STATUS.CANCELED);
      const listForColor = nonCanceled.length ? nonCanceled : displayList;

      const statuses = Array.from(new Set(listForColor.map(getBookingStatus)));
      const isMultiStatus = statuses.length > 1;

      dayStatus = isMultiStatus ? "MULTI" : statuses[0] || null;

      // keep this so count/badge and other UI uses the same “meaningful” list
      displayList = listForColor;
    }

    // ✅ style per status
    let reservedStyle = {};

    if (isReserved) {
      switch (dayStatus) {
        case STATUS.CANCELED:
          reservedStyle = {
            bgcolor: "rgba(239, 68, 68, 0.15)",
            borderColor: "error.main",
            color: "error.dark",
            fontWeight: 900,
            boxShadow: "inset 0 0 0 1px",
            "&:hover": { bgcolor: "rgba(239, 68, 68, 0.25)" },
          };
          break;

        case STATUS.APPROVED:
          reservedStyle = {
            bgcolor: "rgba(34, 197, 94, 0.15)",
            borderColor: "success.main",
            color: "success.dark",
            fontWeight: 900,
            boxShadow: "inset 0 0 0 1px",
            "&:hover": { bgcolor: "rgba(34, 197, 94, 0.25)" },
          };
          break;

        case STATUS.SUBMITTED:
          reservedStyle = {
            bgcolor: "rgba(2, 132, 199, 0.15)",
            borderColor: "info.main",
            color: "info.dark",
            fontWeight: 900,
            boxShadow: "inset 0 0 0 1px",
            "&:hover": { bgcolor: "rgba(2, 132, 199, 0.25)" },
          };
          break;

        case STATUS.ARCHIVED:
          reservedStyle = {
            bgcolor: "rgba(245, 158, 11, 0.12)",
            borderColor: "warning.main",
            color: "warning.dark",
            fontWeight: 900,
            boxShadow: "inset 0 0 0 1px",
            "&:hover": { bgcolor: "rgba(245, 158, 11, 0.2)" },
          };
          break;

        case "MULTI":
          reservedStyle = {
            // blended look: submitted blue + active indigo + warning amber
            bgcolor: "transparent",
            background: "linear-gradient(135deg, rgba(2,132,199,0.18) 0%, rgba(79,70,229,0.18) 50%, rgba(245,158,11,0.14) 100%)",
            borderColor: "divider",
            color: "text.primary",
            fontWeight: 900,
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
            "&:hover": { filter: "brightness(0.96)" },
          };
          break;

        // ACTIVE (default)
        default:
          reservedStyle = {
            bgcolor: "rgba(2, 132, 199, 0.15)",
            borderColor: "info.main",
            color: "info.dark",
            fontWeight: 900,
            boxShadow: "inset 0 0 0 1px",
            "&:hover": { bgcolor: "rgba(2, 132, 199, 0.25)" },
          };
      }
    }

    return (
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        selected={selected}
        disabled={isDisabled}
        onClick={(e) => {
          if (isDisabled) return;

          // ✅ default behavior: reserved day opens list
          if (isReserved) {
            // optional: allow selection instead if user holds ALT (or SHIFT)
            if (e?.altKey) {
              onToggleDate?.(day);
              return;
            }

            onReservedDayClick?.(reservedList, dateStr);
            return;
          }

          // ✅ normal day: select
          onToggleDate?.(day);
        }}
        sx={{
          // ✅ reserved day highlight (status-based)
          ...reservedStyle,

          // ✅ selected styling (kept)
          ...(selected
            ? {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                borderColor: "primary.main",
                "&:hover": { bgcolor: "primary.dark" },
              }
            : {}),

          ...(isReserved && (displayList?.length || 0) > 1
            ? {
                position: "relative",
                "&::after": {
                  content: `"${displayList.length}"`,
                  position: "absolute",
                  top: 4,
                  right: 6,
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  lineHeight: 1,
                  px: 0.6,
                  py: 0.2,
                  borderRadius: 999,
                  bgcolor: "rgba(0,0,0,0.55)",
                  color: "#fff",
                },
              }
            : {}),
        }}
      />
    );
  }

  const CAL_H = {
    xs: 44 * 6 + 6 * 5 + 110,
    sm: 56 * 6 + 6 * 5 + 110,
  };

  return (
    <Box
      sx={{
        width: "100%",
        bgcolor: "background.paper",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        p: { xs: 1.5, sm: 2 },
        height: "auto",
        overflow: "visible", // ✅ change this
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
                        {/* ✅ LEGEND OUTSIDE CALENDAR CARD */}
            <Box sx={{ mt: 2 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 900, opacity: 0.75, mb: 0.75 }}>
                Legend
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip size="small" label="Submitted" sx={{ fontWeight: 800, bgcolor: "rgba(2, 132, 199, 0.15)" }} />
                <Chip size="small" label="Approved" sx={{ fontWeight: 800, bgcolor: "rgba(34, 197, 94, 0.15)" }} />
                <Chip size="small" label="Canceled" sx={{ fontWeight: 800, bgcolor: "rgba(239, 68, 68, 0.15)" }} />
                <Chip size="small" label="Archived" sx={{ fontWeight: 800, bgcolor: "rgba(245, 158, 11, 0.12)" }} />
                <Chip size="small" label="Multiple statuses" sx={{ fontWeight: 800 }} />
                <Chip size="small" label="# of reservations" variant="outlined" sx={{ fontWeight: 800 }} />
              </Stack>
            </Box>

            <DateCalendar
              fixedWeekNumber={6}
              views={["year", "month", "day"]}
              view={calendarView}
              value={calendarMonth}
              onViewChange={onViewChange}
              onMonthChange={(newMonth) => {
                onMonthChange?.(newMonth);
                onViewChange?.("day");
              }}
              showDaysOutsideCurrentMonth={false}
              slots={{ day: MultiPickDay }}
              sx={{
                width: "100%",
                maxWidth: "none",
                m: 0,

                // ✅ ONLY force the big height for DAY view
                ...(calendarView === "day"
                  ? {
                      height: CAL_H,
                      minHeight: CAL_H,

                      "& .MuiPickersSlideTransition-root": {
                        minHeight: { xs: 44 * 6 + 6 * 5, sm: 56 * 6 + 6 * 5 },
                        height: "auto",
                        overflow: "visible",
                      },
                      "& .MuiDayCalendar-slideTransition": {
                        minHeight: { xs: 44 * 6 + 6 * 5, sm: 56 * 6 + 6 * 5 },
                        height: "auto",
                        overflow: "visible",
                      },
                    }
                  : {
                      // ✅ YEAR / MONTH view: don't reserve extra space
                      height: "auto",
                      minHeight: 0,
                    }),

                // ✅ YEAR view: remove the "extra padding / right gutter / bottom space"
                ...(calendarView === "year"
                  ? {
                      "& .MuiYearCalendar-root": {
                        width: "100%",
                        m: 0,
                        p: 0,
                        pr: 0,
                        pb: 0,

                        // the year list is scrollable; remove the gutter space
                        overflowY: "auto",
                      },
                      "& .MuiPickersYear-yearButton": {
                        width: "100%",
                        mx: 0,
                      },
                    }
                  : {}),

                // keep your existing day grid styles below (header/week/day sizing)
                "& .MuiDayCalendar-monthContainer": {
                  width: "100%",
                  display: "grid",
                  rowGap: "6px",
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
  const [requestedBy, setRequestedBy] = React.useState("");
  const [venue, setVenue] = React.useState("");
  const [eventName, setEventName] = React.useState("");
  const [dates, setDates] = React.useState(selectedDates || []);
  const [otherVenue, setOtherVenue] = React.useState("");

  const [startTime, setStartTime] = React.useState(dayjs().hour(19).minute(0));
  const [endTime, setEndTime] = React.useState(dayjs().hour(22).minute(0));

  const [amount, setAmount] = React.useState("");

  const [confirmSubmitOpen, setConfirmSubmitOpen] = React.useState(false);

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
    lights: false,
    sounds: false,
    led: false,
  });

  // ✅ confirm-close dialog state
  const [confirmCloseOpen, setConfirmCloseOpen] = React.useState(false);

  // ✅ snapshot to detect "dirty" changes
  const initialRef = React.useRef(null);

  // keep date in sync
  React.useEffect(() => {
    const next = Array.isArray(selectedDates) ? selectedDates : [];
    setDates(next);
  }, [selectedDates]);

  const durationLabel = React.useMemo(() => {
    if (!startTime || !endTime) return "—";

    const mins = endTime.diff(startTime, "minute");
    if (mins <= 0) return "—";

    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;

    if (hours && minutes) return `${hours} hr ${minutes} min`;
    if (hours) return `${hours} hr`;
    return `${minutes} min`;
  }, [startTime, endTime]);

  // ✅ numeric duration (hours) for saving to DB
  const durationHours = React.useMemo(() => {
    if (!startTime || !endTime) return 0;

    const mins = endTime.diff(startTime, "minute");
    if (mins <= 0) return 0;

    // Example: 150 mins -> 2.5 hours
    return Math.round((mins / 60) * 100) / 100; // 2 decimals
  }, [startTime, endTime]);

  const safeAmount = React.useMemo(() => {
    if (amount === "" || amount == null) return 0;
    return Math.max(0, Number(amount));
  }, [amount]);

  const finalEventName = React.useMemo(() => {
    return eventName.trim();
  }, [eventName]);

  // ✅ snapshot builder for dirty-check
  const makeSnapshot = React.useCallback(() => {
    return {
      requestedBy: requestedBy.trim(),
      eventName: eventName.trim(),
      venue: venue.trim(),
      date: (dates?.[0]?.format("YYYY-MM-DD")) || "",
      startTime: startTime?.format("HH:mm") || "",
      endTime: endTime?.format("HH:mm") || "",
      amount: Number(amount || 0),
      resources,
    };
  }, [requestedBy, eventName, venue, dates, startTime, endTime, amount, resources]);

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
      setEventName(b.eventName ?? "");

      // If saved venue matches a known venue, use it.
      // Otherwise treat it as "Others" and store actual value in otherVenue.
      const savedVenue = String(b.venue ?? "");
      const isKnownVenue = VENUES.includes(savedVenue) && savedVenue !== "Others";

      if (isKnownVenue) {
        setVenue(savedVenue);
        setOtherVenue("");
      } else if (savedVenue) {
        setVenue("Others");
        setOtherVenue(savedVenue);
      } else {
        setVenue("");
        setOtherVenue("");
      }

      const editDates =
        Array.isArray(b.dates) && b.dates.length
          ? b.dates
          : (b.date ? [b.date] : []);

      setDates(editDates.map((x) => dayjs(x)));

      setStartTime(dayjs(`${b.date}T${b.startTime}`));
      setEndTime(dayjs(`${b.date}T${b.endTime}`));

      setAmount(String(b.amount ?? ""));

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
          eventName: String(b.eventName ?? "").trim(),
          venue: String(b.venue ?? "").trim(),
          date: String(b.date ?? ""),
          startTime: String(b.startTime ?? ""),
          endTime: String(b.endTime ?? ""),
          amount: Number(b.amount ?? 0),
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
    setEventName("");
    setVenue("");
    setOtherVenue("");

    // keep selected dates (at least 1)
    setDates(Array.isArray(selectedDates) && selectedDates.length ? selectedDates : [baseDate]);

    setStartTime(dayjs(baseDate).hour(19).minute(0));
    setEndTime(dayjs(baseDate).hour(22).minute(0));

    setAmount("");
    setResources({
      chairs: "",
      tables: "",
      aircon: false,
      lights: false,
      sounds: false,
      led: false,
    });

    setTimeout(() => {
      initialRef.current = {
        requestedBy: "",
        eventName: "",
        venue: "",
        date: dayjs(baseDate).format("YYYY-MM-DD"),
        startTime: dayjs(baseDate).hour(19).minute(0).format("HH:mm"),
        endTime: dayjs(baseDate).hour(22).minute(0).format("HH:mm"),
        amount: 0,
        resources: {
          chairs: "",
          tables: "",
          aircon: false,
          lights: false,
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
    if (!eventName.trim()) return notify("Please enter Event Name.", "warning");
    if (!venue) return notify("Please select a Venue.", "warning");
    if (venue === "Others" && !otherVenue.trim()) {
      return notify("Please specify the Venue.", "warning");
    }
    if (safeAmount <= 0) return notify("Please enter a valid Amount.", "warning");

    const finalVenue = venue === "Others" ? otherVenue.trim() : venue;
    const isEdit = !!initialBooking?.id;
    if (isEdit) {
      const st = getBookingStatus(initialBooking);
      if (st === STATUS.CANCELED || st === STATUS.ARCHIVED) {
        return notify("This reservation can no longer be edited.", "warning");
      }
    }

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
      if (b.venue !== finalVenue) continue;

      const bDates = bookingDates(b);
      const bs = toMinutes(b.startTime);
      const be = toMinutes(b.endTime);
      if (!Number.isFinite(bs) || !Number.isFinite(be)) continue;

      for (const d of dateStrs) {
        if (!bDates.includes(d)) continue;

        if (rangesOverlap(s, e, bs, be)) {
          const niceDate = dayjs(d).format("MM-DD-YYYY");
          const niceStart = formatTime12h(b.startTime);
          const niceEnd = formatTime12h(b.endTime);

          return notify(
            `Schedule conflict: ${venue} is already reserved on ${niceDate} (${niceStart} - ${niceEnd}).`,
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
      eventTypeId: null,
      eventName: finalEventName,
      venue: finalVenue,
      startTime: startTime.format("HH:mm"),
      endTime: endTime.format("HH:mm"),
      durationHours,
      amount: safeAmount,
      resources: normalizedResources,
      status: STATUS.SUBMITTED,
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

        notify(`Updated! Amount: ₱${Number(updated?.amount ?? safeAmount).toLocaleString()}`, "success");

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

      notify(`Reserved ${dateList.length} day(s)!`, "success");
      onBooked?.(created ?? payload);

      initialRef.current = makeSnapshot();
      onClose();
    } catch (err) {
      console.error(err);
      notify(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Reservation failed.",
        "error"
      );
    }
  }

  const handleConfirmSubmit = async () => {
    setConfirmSubmitOpen(false);
    await submit(); // Call the existing submit function
  };

  const handleCancelSubmit = () => {
    setConfirmSubmitOpen(false);
  };

  const handleSubmitClick = () => {
    // First validate all fields
    if (!requestedBy.trim()) return notify("Please enter Requested by (Name).", "warning");
    if (!requestedBy.trim()) return notify("Please enter Requested by (Name).", "warning");
    if (!eventName.trim()) return notify("Please enter Event Name.", "warning");
    if (!venue) return notify("Please select a Venue.", "warning");
    if (safeAmount <= 0) return notify("Please enter a valid Amount.", "warning");
    if (!venue) return notify("Please select a Venue.", "warning");
    if (safeAmount <= 0) return notify("Please enter a valid Amount.", "warning");

    const isEdit = !!initialBooking?.id;
    const dateList = (isEdit ? [dates?.[0]] : (dates || [])).filter(Boolean);
    if (!dateList.length) return notify("Please select at least one date.", "warning");

    // Time validation
    const s = toMinutes(startTime.format("HH:mm"));
    const e = toMinutes(endTime.format("HH:mm"));
    if (!Number.isFinite(s) || !Number.isFinite(e) || s >= e) {
      return notify("Invalid time range. End time must be after start time.", "warning");
    }

    // If all validations pass, show confirmation dialog
    setConfirmSubmitOpen(true);
  };

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
              {initialBooking?.id ? "Edit Reservation" : "Create Reservation"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              Select details for the reservation.
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
            helperText={
              <span>
                Example: <b>Juan Dela Cruz</b> • {requestedBy.length}/{LIMITS.requestedBy}
              </span>
            }
            sx={{ mb: 2 }}
          />

          {/* Combined Row: Event Name | Venue Dropdown */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
            gap: 2, 
            mb: 2 
          }}>
            <TextField
              fullWidth
              label="Event Name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value.slice(0, LIMITS.otherEventName))}
              inputProps={{ maxLength: LIMITS.otherEventName }}
              helperText={
                <span>
                  Example: <b>Birthday</b>, <b>Wedding</b> • {eventName.length}/{LIMITS.otherEventName}
                </span>
              }
            />

            <FormControl fullWidth>
              <InputLabel>Venue</InputLabel>
              <Select
                label="Venue"
                value={venue}
                onChange={(e) => {
                  const v = e.target.value;
                  setVenue(v);
                  if (v !== "Others") setOtherVenue(""); // reset when not Others
                }}
              >
                {VENUES.map((v) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </Select>

              {/* ✅ Show input when Others is selected */}
              {venue === "Others" ? (
                <TextField
                  sx={{ mt: 1 }}
                  fullWidth
                  label="Specify Venue"
                  value={otherVenue}
                  onChange={(e) => setOtherVenue(e.target.value.slice(0, 60))}
                  helperText="Type the venue name"
                />
              ) : null}
            </FormControl>
          </Box>

          {/* ✅ Time Section */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box
              sx={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 1,
                mb: 1,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Time
              </Typography>

              <Typography sx={{ fontSize: 12, opacity: 0.75 }}>
                Duration: <b>{durationLabel}</b>
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1,
                mb: 2,
              }}
            >
              <TimePicker
                label="Start Time"
                value={startTime}
                onChange={(v) => v && setStartTime(v)}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />

              <TimePicker
                label="End Time"
                value={endTime}
                onChange={(v) => v && setEndTime(v)}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Box>
          </LocalizationProvider>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ mb: 2 }}>
              {/* ✅ Title row: label + hint beside it */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 1,
                  mb: 0.5,
                  flexWrap: "wrap",
                }}
              >
                <Typography sx={{ fontWeight: 800 }}>
                  Date(s)
                </Typography>

                <Typography variant="body2" sx={{ opacity: 0.75 }}>
                  Selected from the main calendar.
                </Typography>
              </Box>

              <Paper
                variant="outlined"
                sx={{ p: 1.25, borderRadius: 1, bgcolor: "background.paper" }}
              >
                <Typography sx={{ fontWeight: 900 }}>
                  {formatSelectedDatesDayjs(dates)}
                </Typography>

                {/* Optional: chips display (no delete) */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                  {(dates || []).map((d) => (
                    <Chip
                      key={d.format("YYYY-MM-DD")}
                      label={d.format("MMM D, YYYY")}
                      size="small"
                    />
                  ))}
                </Box>
              </Paper>
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
              Resources
            </Typography>
            <ResourceInputs resources={resources} setResources={setResources} />
          </LocalizationProvider>
          
          {/* ✅ Amount Section AFTER */}
          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
            Payment
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
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
          </Box>

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
            onClick={handleSubmitClick}  // Changed from submit to handleSubmitClick
            sx={{ fontWeight: 900, px: 2.5 }}
          >
            {initialBooking?.id ? "Update Reservation" : "Submit Reservation"}
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

      {/* Submit Confirmation Dialog */}
      <Dialog
        open={confirmSubmitOpen}
        onClose={handleCancelSubmit}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Confirm {initialBooking?.id ? "Update" : "Reservation"}
        </DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to {initialBooking?.id ? "update" : "submit"} this reservation?
            </Typography>
            
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" component="div">
                <strong>Event:</strong> {finalEventName}<br />
                <strong>Requested by:</strong> {requestedBy}<br />
                <strong>Venue:</strong> {venue === "Others" ? otherVenue : venue}<br />
                <strong>Date(s):</strong> {formatSelectedDatesDayjs(dates)}<br />
                <strong>Time:</strong> {startTime.format("h:mm A")} - {endTime.format("h:mm A")}<br />
                <strong>Amount:</strong> ₱{safeAmount.toLocaleString()}<br />
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSubmit}>Cancel</Button>
          <Button
            onClick={handleConfirmSubmit}
            color="primary"
            variant="contained"
            sx={{ fontWeight: 800 }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** --------- Inline DayBookingsDialog --------- */
function DayBookingsDialog({ open, dateStr, bookings = [], onClose, onPick, onCreate }) {
  const list = Array.isArray(bookings) ? [...bookings] : [];

  // sort by start time (HH:mm)
  list.sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            Reservations on {dateStr ? dayjs(dateStr).format("MMMM D, YYYY") : "—"}
          </Typography>
          <Typography sx={{ fontSize: 12, opacity: 0.7 }}>
            Click a row to view the reservation details.
          </Typography>
        </Box>

        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {list.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center", opacity: 0.8 }}>
            <Typography sx={{ fontWeight: 900, mb: 0.5 }}>No reservations</Typography>
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              This date has no scheduled reservations.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Event</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Venue</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {list.map((b) => {
                  const st = getBookingStatus(b);
                  const chip = getStatusChipProps(st);

                  return (
                    <TableRow
                      key={b.id ?? `${b.date}-${b.startTime}-${b.eventName}`}
                      hover
                      sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                      onClick={() => onPick?.(b)}
                    >
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${formatTime12h(b.startTime)} - ${formatTime12h(b.endTime)}`}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontWeight: 800 }}>{b.eventName ?? "—"}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                          Requested by: {b.requestedBy ?? "—"}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ whiteSpace: "nowrap" }}>{b.venue ?? "—"}</TableCell>

                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Chip
                          size="small"
                          label={chip.label}
                          color={chip.color}
                          variant={chip.variant}
                          sx={{ fontWeight: 900 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: 12, opacity: 0.7, px: 1 }}>
          Tip: Click a reserved day to view reservations. <b>ALT + click</b> to select it.
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            onClick={onClose}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 900 }}
          >
            Close
          </Button>
          <Button
            onClick={() => onCreate?.(dateStr)}
            variant="contained"
            size="small"
            sx={{ fontWeight: 900 }}
            disabled={!dateStr}
          >
            Create Reservation
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

/** --------- Inline BookingDetailsDialog --------- */
function BookingDetailsDialog({
  open,
  booking,
  onClose,
  onBack,
  onEdit,
  onArchive,
  onDelete,
  onCancel,
  onApprove,
  onPrint,
  onDownload,
}) {
  if (!booking) return null;

  const r = booking.resources || {};
  const money = (n) => `₱${Number(n || 0).toLocaleString()}`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            Reservation Details
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
                <Typography sx={{ fontWeight: 800 }}>
                  {formatDateRange(booking)}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Time</Typography>
                <Typography sx={{ fontWeight: 800 }}>
                  {formatTime12h(booking.startTime)} - {formatTime12h(booking.endTime)}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Venue</Typography>
                <Typography sx={{ fontWeight: 800 }}>{booking.venue ?? "—"}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, opacity: 0.7 }}>Status</Typography>
                  {(() => {
                    const st = getBookingStatus(booking);
                    const props = getStatusChipProps(st);
                    return (
                      <Chip
                        size="small"
                        label={props.label}
                        color={props.color}
                        variant={props.variant}
                        sx={{ fontWeight: 900 }}
                      />
                    );
                  })()}
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

          {/* ✅ Resources | Pricing (side-by-side) */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 220px" }, // ✅ pricing fixed
              gap: 1.25,
              alignItems: "start",
            }}
          >
            {/* Resources */}
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1 }}>
              <Typography sx={{ fontWeight: 900, mb: 0.75 }}>Resources</Typography>

              {/* compact chairs/tables */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1,
                  alignItems: "stretch",
                }}
              >
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    px: 1,
                    py: 0.75,
                  }}
                >
                  <Typography sx={{ fontSize: 11, opacity: 0.7, lineHeight: 1 }}>
                    Chairs
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 20, lineHeight: 1.1 }}>
                    {r.chairs ?? 0}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    px: 1,
                    py: 0.75,
                  }}
                >
                  <Typography sx={{ fontSize: 11, opacity: 0.7, lineHeight: 1 }}>
                    Tables
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 20, lineHeight: 1.1 }}>
                    {r.tables ?? 0}
                  </Typography>
                </Box>
              </Box>

              {/* compact toggles */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.75,
                  mt: 1,
                }}
              >
                <Chip size="small" label={`Aircon: ${r.aircon ? "Yes" : "No"}`} />
                <Chip size="small" label={`Lights: ${r.lights ? "Yes" : "No"}`} />
                <Chip size="small" label={`Sounds: ${r.sounds ? "Yes" : "No"}`} />
                <Chip size="small" label={`LED: ${r.led ? "Yes" : "No"}`} />
              </Box>
            </Paper>

            {/* Pricing */}
            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1 }}>
              <Typography sx={{ fontWeight: 900, mb: 0.75 }}>Pricing</Typography>

              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  px: 1,
                  py: 1,
                }}
              >
                <Typography sx={{ fontSize: 11, opacity: 0.7, lineHeight: 1 }}>
                  Amount
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: 20, lineHeight: 1.1, color: "primary.main" }}>
                  {money(booking.amount)}
                </Typography>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", opacity: 0.7 }}>
            <Typography sx={{ fontSize: 12 }}>
              Created: {booking.createdAt ? dayjs(booking.createdAt).format("dddd - MMMM D, YYYY h:mm A") : "—"}
            </Typography>
            <Typography sx={{ fontSize: 12 }}>
              Updated: {booking.updatedAt ? dayjs(booking.updatedAt).format("dddd - MMMM D, YYYY h:mm A") : "—"}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      
      {/* Booking Details Dialog */}
      <DialogActions
        sx={{
          px: 2,
          py: 1.25,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
      {(() => {
        const st = getBookingStatus(booking);
        const canPermit = st === STATUS.APPROVED;
        
        const canEdit = !(
          st === STATUS.CANCELED ||
          st === STATUS.ARCHIVED ||
          isBookingPast(booking)
        );
        
        const canApprove = st === STATUS.SUBMITTED;
        const canCancel = !(
          st === STATUS.CANCELED ||
          st === STATUS.ARCHIVED ||
          isBookingPast(booking)
        );
        
        const showDelete = !!booking?.archived;
        
        return (
          <Box sx={{ width: '100%' }}>
            {/* FIRST ROW: SOA + Paid/Approve + Edit */}
            <Stack 
              direction="row" 
              spacing={1} 
              sx={{ mb: 1, flexWrap: 'wrap', alignItems: 'center' }}
            >
              <ButtonGroup size="small" variant="outlined">
                <Button
                  startIcon={<PrintIcon />}
                  onClick={() => onPrint?.(booking, "soa")}
                >
                  PRINT SOA
                </Button>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={() => onDownload?.(booking, "soa")}
                >
                  DOWNLOAD SOA
                </Button>
              </ButtonGroup>
              
              {canApprove && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  sx={{ fontWeight: 900 }}
                  onClick={() => onApprove?.(booking)}
                >
                  PAID/APPROVED
                </Button>
              )}
              
              {canEdit && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => onEdit?.(booking)}
                >
                  EDIT
                </Button>
              )}
            </Stack>

            {/* SECOND ROW: PERMIT + Cancel + Archived */}
            <Stack 
              direction="row" 
              spacing={1} 
              sx={{ flexWrap: 'wrap', alignItems: 'center' }}
            >
              <ButtonGroup size="small" variant="outlined">
                <Button
                  startIcon={<PrintIcon />}
                  disabled={!canPermit}
                  onClick={() => onPrint?.(booking, "permit")}
                >
                  PRINT PERMIT
                </Button>
                <Button
                  startIcon={<DownloadIcon />}
                  disabled={!canPermit}
                  onClick={() => onDownload?.(booking, "permit")}
                >
                  DOWNLOAD PERMIT
                </Button>
              </ButtonGroup>
              
              {canCancel && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<CloseIcon />}
                  onClick={() => onCancel?.(booking)}
                >
                  CANCEL
                </Button>
              )}
              
              <Button
                size="small"
                variant="outlined"
                startIcon={<ArchiveIcon />}
                onClick={() => onArchive?.(booking)}
              >
                ARCHIVED
              </Button>

              {/* Delete - only if archived, separate */}
              {showDelete && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => onDelete?.(booking)}
                >
                  DELETE
                </Button>
              )}
            </Stack>

            {/* CLOSE button at the bottom */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                onClick={onClose}
                variant="contained"
                size="small"
                sx={{ fontWeight: 900 }}
              >
                CLOSE
              </Button>
            </Box>
          </Box>
        );
      })()}
      </DialogActions>
    </Dialog>
  );
}

function formatTime12h(hhmm) {
  if (!hhmm) return "—";
  // Parses "19:00" and outputs "7:00 PM"
  return dayjs(`2000-01-01T${String(hhmm).slice(0, 5)}`).format("h:mm A");
}

/** --------- Inline BookingHistory (BETTER TABLE + PAGINATION) --------- */
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
  historyDate,
  setHistoryDate,
}) {
  // ✅ pagination state (local to table)
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Reset to page 0 when filters/search change or data changes
  React.useEffect(() => {
    setPage(0);
  }, [search, venueFilter, statusFilter, sortOrder, historyDate, rows?.length]);

  const total = Array.isArray(rows) ? rows.length : 0;

  const pagedRows = React.useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];
    const start = page * rowsPerPage;
    return list.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const handleChangePage = (_, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (e) => {
    const next = parseInt(e.target.value, 10);
    setRowsPerPage(next);
    setPage(0);
  };

  const sortLabelText =
    sortOrder === "NEWEST" ? "Newest first" : sortOrder === "OLDEST" ? "Oldest first" : "Sort";

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
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "grid", gap: 1.25, mb: 1.25 }}>
        {/* ✅ ONE responsive grid for title + all controls */}
        <Box
          sx={{
            display: "grid",
            gap: 1,
            alignItems: "center",

            // 12-col responsive layout (no clipping)
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",

            // critical: allow children to shrink instead of pushing others off screen
            "& > *": { minWidth: 0 },
          }}
        >
          {/* LEFT: Title + loading + chip */}
          <Box
            sx={{
              gridColumn: { xs: "1 / -1", md: "1 / span 5" },
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Reservation History
            </Typography>
            {loading ? <CircularProgress size={18} /> : null}
            <Chip
              size="small"
              label={`${total} record${total === 1 ? "" : "s"}`}
              variant="outlined"
              sx={{ fontWeight: 800 }}
            />
          </Box>

          {/* RIGHT: Search (aligned with title row on desktop) */}
          <Box sx={{ gridColumn: { xs: "1 / -1", md: "6 / span 4" } }}>
            <TextField
              size="small"
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
          </Box>

          {/* RIGHT: Date (beside Search on desktop, drops below on shrink) */}
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "1 / -1", md: "10 / span 3" } }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date"
                value={historyDate}
                onChange={(v) => setHistoryDate(v)}
                slotProps={{
                  textField: { size: "small", fullWidth: true, sx: { minWidth: 0 } },
                }}
              />
            </LocalizationProvider>
          </Box>

          {/* ✅ Filters row that "flows" under Search/Date when shrinking */}
          {/* Venue */}
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "1 / span 4", md: "1 / span 4" } }}>
            <FormControl size="small" fullWidth>
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
          </Box>

          {/* Status */}
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "5 / span 4", md: "5 / span 4" } }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All</MenuItem>
                  <MenuItem value={STATUS.SUBMITTED}>Submitted</MenuItem>
                  <MenuItem value={STATUS.APPROVED}>Approved</MenuItem>
                  <MenuItem value={STATUS.CANCELED}>Canceled</MenuItem>
                  <MenuItem value={STATUS.ARCHIVED}>Archived</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Sort */}
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "9 / span 4", md: "9 / span 4" } }}>
            <FormControl size="small" fullWidth>
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
          </Box>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <Table stickyHeader size="small" aria-label="reservation history">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 900, bgcolor: "background.paper" }}>
                Date
              </TableCell>

              <TableCell sx={{ fontWeight: 900, bgcolor: "background.paper" }}>
                Time
              </TableCell>

              <TableCell sx={{ fontWeight: 900, bgcolor: "background.paper" }}>
                Event
              </TableCell>

              <TableCell sx={{ fontWeight: 900, bgcolor: "background.paper" }}>
                Requested By
              </TableCell>

              <TableCell align="right" sx={{ fontWeight: 900, bgcolor: "background.paper" }}>
                Amount
              </TableCell>

              <TableCell
                align="right"
                sx={{ fontWeight: 900, bgcolor: "background.paper", width: 170 }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {/* Empty / Loading state */}
            {(!pagedRows || pagedRows.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box sx={{ py: 4, textAlign: "center", opacity: 0.8 }}>
                    <Typography sx={{ fontWeight: 900, mb: 0.5 }}>
                      {loading ? "Loading reservations..." : "No reservations found"}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.75 }}>
                      {loading
                        ? "Please wait a moment."
                        : "Try changing filters, status, or search keywords."}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              pagedRows.map((b) => (
                <TableRow
                  key={b.id ?? `${b.date}-${b.startTime}-${b.requestedBy}-${b.eventName}`}
                  hover
                  sx={{
                    cursor: "pointer",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                  onClick={() => onRowClick?.(b)}
                >
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {formatDateRange(b)}
                  </TableCell>

                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Chip
                      size="small"
                      label={`${formatTime12h(b.startTime)} - ${formatTime12h(b.endTime)}`}
                      variant="outlined"
                    />
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: 800 }}>
                        {b.eventName}
                      </Typography>
                        {(() => {
                          const st = getBookingStatus(b);
                          const props = getStatusChipProps(st);
                          return <Chip size="small" label={props.label} color={props.color} variant={props.variant} />;
                        })()}
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.7 }}>
                      {b.venue}
                    </Typography>
                  </TableCell>

                  <TableCell>{b.requestedBy}</TableCell>

                  <TableCell align="right" sx={{ fontWeight: 900 }}>
                    ₱{Number(b.amount ?? 0).toLocaleString()}
                  </TableCell>

                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
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

                    {(() => {
                      const st = getBookingStatus(b);
                      const editDisabled =
                        st === STATUS.CANCELED ||
                        st === STATUS.ARCHIVED ||
                        isBookingPast(b);

                      if (editDisabled) return null;

                      return (
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
                      );
                    })()}

                    <Tooltip title={b.archived ? "Unarchive" : "Archive"}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchive?.(b);
                        }}
                        color={b.archived ? "success" : "default"}
                      >
                        <ArchiveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* ✅ Delete only appears when ARCHIVED */}
                    {b.archived ? (
                      <Tooltip title="Delete (Archived only)">
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
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination footer */}
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 20, 50]}
        sx={{
          mt: 1,
          ".MuiTablePagination-toolbar": { px: 0 },
        }}
      />
    </Paper>
  );
}

/** --------- Page --------- */
export default function SchedulePage() {
  const [selectedDates, setSelectedDates] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [calendarView, setCalendarView] = React.useState("day");

  const [calendarMonth, setCalendarMonth] = React.useState(dayjs());

  // ✅ history state
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [bookings, setBookings] = React.useState([]);

  // ✅ helper: normalize booking dates (supports both b.dates[] and b.date)
  const bookingDates = React.useCallback((b) => {
    return Array.isArray(b?.dates) && b.dates.length ? b.dates : (b?.date ? [b.date] : []);
  }, []);

  // ✅ Map: "YYYY-MM-DD" -> [booking, booking, ...] (ACTIVE only)
  const reservedByDate = React.useMemo(() => {
    const map = new Map();

    for (const b of (bookings || [])) {
      if (!b) continue;

      const dates = bookingDates(b);
      for (const d of dates) {
        if (!d) continue;
        if (!map.has(d)) map.set(d, []);
        map.get(d).push(b);
      }
    }

    return map;
  }, [bookings, bookingDates]);

  // ✅ filters/search
  const [search, setSearch] = React.useState("");
  const [venueFilter, setVenueFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [sortOrder, setSortOrder] = React.useState("NEWEST"); // NEWEST | OLDEST

  const [historyDate, setHistoryDate] = React.useState(null);

  const [printOpen, setPrintOpen] = React.useState(false);
  const [printBooking, setPrintBooking] = React.useState(null);

  const [printMode, setPrintMode] = React.useState("print"); // "print" | "download"
  const [printDocType, setPrintDocType] = React.useState("permit");

  // Delete confirmation dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteDialogBooking, setDeleteDialogBooking] = React.useState(null);

  // Archive confirmation dialog states
  const [archiveDialogOpen, setArchiveDialogOpen] = React.useState(false);
  const [archiveDialogBooking, setArchiveDialogBooking] = React.useState(null);

  // Cancel confirmation dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [cancelDialogBooking, setCancelDialogBooking] = React.useState(null);

  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [approveDialogBooking, setApproveDialogBooking] = React.useState(null);

  const filteredBookings = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = Array.isArray(bookings) ? [...bookings] : [];

    // status filter
    if (statusFilter !== "ALL") {
      list = list.filter((b) => getBookingStatus(b) === statusFilter);
    }

    // venue filter
    if (venueFilter !== "ALL") list = list.filter((b) => b.venue === venueFilter);

    // ✅ date filter (matches BOTH b.date and b.dates[])
  if (historyDate) {
    const target = dayjs(historyDate).format("YYYY-MM-DD");
    list = list.filter((b) => {
      const ds = bookingDates(b); // uses your helper
      return ds.includes(target);
    });
  }

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
  }, [bookings, search, venueFilter, statusFilter, sortOrder, historyDate, bookingDates]);

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
  const [detailsFromDay, setDetailsFromDay] = React.useState(false);

  // ✅ Day summary dialog state
  const [dayDialogOpen, setDayDialogOpen] = React.useState(false);
  const [dayDialogDate, setDayDialogDate] = React.useState(null);
  const [dayDialogBookings, setDayDialogBookings] = React.useState([]);

  // ✅ keep the open Details dialog in sync with latest bookings state
  React.useEffect(() => {
    if (!detailsBooking?.id) return;

    const fresh = (bookings || []).find((x) => x?.id === detailsBooking.id);
    if (fresh) setDetailsBooking(fresh);
  }, [bookings, detailsBooking?.id]); // only reacts to bookings updates + current id

  const handleReservedDayClick = React.useCallback((list, dateStr) => {
    const bookingsForDay = Array.isArray(list) ? list : [];
    if (!bookingsForDay.length) return;

    setDayDialogDate(dateStr);
    setDayDialogBookings(bookingsForDay);
    setDayDialogOpen(true);
  }, []);

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
    if (!b) return;

    const st = getBookingStatus(b);
    if (st === STATUS.CANCELED || st === STATUS.ARCHIVED) return;

    // optional: also block edit for past bookings
    if (isBookingPast(b)) return;

    setEditingBooking(b);
    setSelectedDates([dayjs(b.date)]);
    setOpen(true);
  };

  const handleDeleteBooking = async (b) => {
    if (!b?.id) return;
    if (!b.archived) return;

    setDeleteDialogBooking(b);
    setDeleteDialogOpen(true);
  };

  const openPrint = (b, docType) => {
    setPrintDocType(docType || "soa");
    setPrintMode("print");
    setPrintBooking(b);
    setPrintOpen(true);
  };

  const openDownload = (b, docType) => {
    setPrintDocType(docType || "soa");
    setPrintMode("download");
    setPrintBooking(b);
    setPrintOpen(true);
  };

  const handleArchiveBooking = async (b) => {
    if (!b?.id) return;
    
    // Replace window.confirm with dialog state
    setArchiveDialogBooking(b);
    setArchiveDialogOpen(true);
  };

  // Delete confirmation handlers
  const handleConfirmDelete = async () => {
    if (!deleteDialogBooking?.id) return;

    try {
      await axios.delete(`${API}/bookings/${deleteDialogBooking.id}`);

      // ✅ remove from table/history
      setBookings((prev) => prev.filter((x) => x.id !== deleteDialogBooking.id));

      // ✅ NEW: if the Details dialog is showing the same booking, close it
      if (detailsBooking?.id === deleteDialogBooking.id) {
        setDetailsOpen(false);
        setDetailsBooking(null);
      }

      // ✅ close delete dialog
      setDeleteDialogOpen(false);
      setDeleteDialogBooking(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete reservation.");
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteDialogBooking(null);
  };

  // Archive confirmation handlers
  const handleConfirmArchive = async () => {
    if (!archiveDialogBooking?.id) return;
    
    try {
      const res = await axios.patch(`${API}/bookings/${archiveDialogBooking.id}/archive`);
      const updated = res.data;
      setBookings((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setArchiveDialogOpen(false);
      setArchiveDialogBooking(null);
    } catch (err) {
      console.error(err);
      alert("Failed to archive reservation.");
    }
  };

  const handleCancelArchive = () => {
    setArchiveDialogOpen(false);
    setArchiveDialogBooking(null);
  };

  const handleApproveBooking = (b) => {
  if (!b?.id) return;

    const st = getBookingStatus(b);
      if (st !== STATUS.SUBMITTED) return;

    setApproveDialogBooking(b);
    setApproveDialogOpen(true);
  };

  const handleCancelApprove = () => {
    setApproveDialogOpen(false);
    setApproveDialogBooking(null);
  };

  const handleConfirmApprove = async () => {
    if (!approveDialogBooking?.id) return;

    try {
      const res = await axios.patch(`${API}/bookings/${approveDialogBooking.id}/approve`);
      const updated = res.data;

      setBookings((prev) =>
        prev.map((x) => (x.id === updated.id ? updated : x))
      );

      if (detailsBooking?.id === updated.id) {
        setDetailsBooking(updated);
      }

      setApproveDialogOpen(false);
      setApproveDialogBooking(null);
    } catch (err) {
      console.error(err);
      alert("Failed to approve reservation.");
    }
  };

  const handleCancelBooking = (b) => {
    if (!b?.id) return;

    // prevent cancel if already past on UI level
    if (isBookingPast(b)) return;

    if (getBookingStatus(b) === STATUS.CANCELED) return;

    setCancelDialogBooking(b);
    setCancelDialogOpen(true);
  };

  const handleCancelCancelDialog = () => {
    setCancelDialogOpen(false);
    setCancelDialogBooking(null);
  };

  const handleConfirmCancelBooking = async () => {
    if (!cancelDialogBooking?.id) return;

    try {
      // IMPORTANT: backend route must exist; adjust if yours differs
      const res = await axios.patch(`${API}/bookings/${cancelDialogBooking.id}/cancel`);
      const updated = res.data;

      setBookings((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));

      // keep details dialog in sync
      if (detailsBooking?.id === updated.id) setDetailsBooking(updated);

      setCancelDialogOpen(false);
      setCancelDialogBooking(null);
    } catch (err) {
      console.error(err);
      alert("Failed to cancel reservation.");
    }
  };

  return (
    <>
      <Topbar title="Event Scheduling" />

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
            display: "grid",
            gap: 2,

            // ✅ laptop-first: 2 columns on md+, stack on xs/sm
            gridTemplateColumns: { xs: "1fr", md: "420px 1fr" },

            alignItems: "start",
          }}
        >
          {/* LEFT: Calendar (sticky on laptop) */}
          <Box
            sx={{
              position: { xs: "static", md: "sticky" },
              top: { md: 88 + 16 }, // Topbar height + spacing
              alignSelf: "start",
            }}
          >

            <CalendarSection
              calendarView={calendarView}
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
              calendarMonth={calendarMonth}
              onMonthChange={(newMonth) => setCalendarMonth(newMonth)}
              reservedByDate={reservedByDate}
              onReservedDayClick={handleReservedDayClick}
              headerActions={
                <>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectedDates([]);
                      setCalendarMonth(dayjs());
                    }}
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
                    Create Reservation ({selectedDates.length})
                  </Button>
                </>
              }
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
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
                  setDetailsFromDay(false);
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
                historyDate={historyDate}
                setHistoryDate={setHistoryDate}
              />
          </Box>
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

          // ✅ Clear selected days after successful submit/update
          setSelectedDates([]);
          // optional: keep calendar focused on current month
          setCalendarMonth(dayjs());

          // ✅ open print
          setPrintMode("print");
          setPrintBooking(created);
          setPrintOpen(true);
        }}
      />

      <DayBookingsDialog
        open={dayDialogOpen}
        dateStr={dayDialogDate}
        bookings={dayDialogBookings}
        onClose={() => {
          setDayDialogOpen(false);
          setDayDialogDate(null);
          setDayDialogBookings([]);
        }}
        onPick={(b) => {
          setDayDialogOpen(false);     // close dialog only
          setDetailsFromDay(true);     // ✅ came from day summary
          setDetailsBooking(b);
          setDetailsOpen(true);
        }}
        onCreate={(dateStr) => {
          if (!dateStr) return;

          // close summary dialog
          setDayDialogOpen(false);

          // open create drawer for that day
          setEditingBooking(null);
          setSelectedDates([dayjs(dateStr)]);
          setCalendarMonth(dayjs(dateStr));
          setOpen(true);
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
        onEdit={(b) => {
          // optional: close details first
          setDetailsOpen(false);
          setDetailsBooking(null);
          handleEditBooking(b);
        }}
        onArchive={(b) => handleArchiveBooking(b)}
        onDelete={(b) => handleDeleteBooking(b)}
        onCancel={(b) => handleCancelBooking(b)}
        onApprove={(b) => handleApproveBooking(b)}
        onPrint={(b, docType) => openPrint(b, docType)}
        onDownload={(b, docType) => openDownload(b, docType)}
      />

      {/* ✅ Approve (Paid) Dialog */}
      <Dialog
        open={approveDialogOpen}
        onClose={handleCancelApprove}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Mark as Paid (Approve)</DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to mark this reservation as <b>PAID</b> and set status to <b>APPROVED</b>?
            </Typography>

            {approveDialogBooking && (
              <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" component="div">
                  <strong>Event:</strong> {approveDialogBooking.eventName}<br />
                  <strong>Requested by:</strong> {approveDialogBooking.requestedBy}<br />
                  <strong>Date:</strong> {formatDateRange(approveDialogBooking)}<br />
                  <strong>Amount:</strong> ₱{Number(approveDialogBooking.amount ?? 0).toLocaleString()}
                </Typography>
              </Box>
            )}

            <Typography sx={{ color: "success.main", fontWeight: 800 }}>
              After approving, you can print the Venue Permit.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelApprove}>Cancel</Button>
          <Button
            onClick={handleConfirmApprove}
            color="success"
            variant="contained"
            sx={{ fontWeight: 800 }}
          >
            Confirm Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Cancel Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCancelCancelDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Cancel Reservation
        </DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to cancel this reservation?
            </Typography>

            {cancelDialogBooking && (
              <Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" component="div">
                  <strong>Event:</strong> {cancelDialogBooking.eventName}<br />
                  <strong>Requested by:</strong> {cancelDialogBooking.requestedBy}<br />
                  <strong>Date:</strong> {formatDateRange(cancelDialogBooking)}
                </Typography>
              </Box>
            )}

            <Typography sx={{ color: "error.main", fontWeight: 700 }}>
              This will mark the reservation as CANCELED.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCancelDialog}>Back</Button>
          <Button
            onClick={handleConfirmCancelBooking}
            color="error"
            variant="contained"
            sx={{ fontWeight: 800 }}
          >
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ Print Dialog */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          Delete Reservation
        </DialogTitle>
        <DialogContent>
          {/* Change DialogContentText to just a Box with Typography components */}
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete this reservation?
            </Typography>
            
            {deleteDialogBooking && (
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" component="div">
                  <strong>Event:</strong> {deleteDialogBooking.eventName}<br />
                  <strong>Requested by:</strong> {deleteDialogBooking.requestedBy}<br />
                  <strong>Date:</strong> {formatDateRange(deleteDialogBooking)}
                </Typography>
              </Box>
            )}
            
            <Typography sx={{ color: 'error.main', fontWeight: 700 }}>
              This action cannot be undone.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            sx={{ fontWeight: 800 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog
        open={archiveDialogOpen}
        onClose={handleCancelArchive}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 900 }}>
          {archiveDialogBooking?.archived ? "Unarchive Reservation" : "Archive Reservation"}
        </DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to {archiveDialogBooking?.archived ? "unarchive" : "archive"} this reservation?
            </Typography>
            
            {archiveDialogBooking && (
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" component="div">
                  <strong>Event:</strong> {archiveDialogBooking.eventName}<br />
                  <strong>Requested by:</strong> {archiveDialogBooking.requestedBy}<br />
                  <strong>Date:</strong> {formatDateRange(archiveDialogBooking)}
                </Typography>
              </Box>
            )}
            
            <Typography sx={{ color: 'warning.main', fontWeight: 700 }}>
              {archiveDialogBooking?.archived 
                ? "Unarchived reservations will appear in the active list again."
                : "Archived reservations will be hidden from the active list but can be viewed by selecting 'Archived' in the status filter."}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelArchive}>Cancel</Button>
          <Button
            onClick={handleConfirmArchive}
            color="warning"
            variant="contained"
            sx={{ fontWeight: 800 }}
          >
            {archiveDialogBooking?.archived ? "Unarchive" : "Archive"}
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
}