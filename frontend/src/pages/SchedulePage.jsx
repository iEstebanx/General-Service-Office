// frontend/src/pages/SchedulePage.jsx
import React from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Container, Box, Typography, TextField, Button, Divider,
  FormControlLabel, Switch, InputAdornment, FormControl,
  InputLabel, Select, Paper, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  Snackbar, Alert, IconButton, Tooltip, Stack, ButtonGroup,
  MenuItem, TablePagination,
} from "@mui/material";

import Topbar from "@/components/Topbar.jsx";
import PrintDialog from "@/components/Print.jsx";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArchiveIcon from "@mui/icons-material/Archive";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import EventNoteIcon from "@mui/icons-material/EventNote";
import TableChartIcon from "@mui/icons-material/TableChart";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

// ─── Global styles ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

  .sched-root, .sched-root * {
    font-family: 'Outfit', sans-serif !important;
  }
  .sched-mono {
    font-family: 'JetBrains Mono', monospace !important;
  }

  @keyframes schedFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes schedFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes schedSlideRight {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes schedPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
  @keyframes schedGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
    50%       { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
  }
  @keyframes schedSpin {
    to { transform: rotate(360deg); }
  }
  @keyframes schedShimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  /* Card hover lift */
  .sched-card {
    transition: box-shadow 0.2s ease, transform 0.2s ease !important;
  }
  .sched-card:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important;
  }

  /* Table row hover */
  .sched-row {
    transition: background 0.15s ease !important;
    cursor: pointer;
  }
  .sched-row:hover td {
    background: rgba(34,197,94,0.04) !important;
  }

  /* Button interactions */
  .sched-btn-primary {
    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1) !important;
  }
  .sched-btn-primary:hover {
    transform: translateY(-2px) !important;
  }
  .sched-btn-primary:active {
    transform: translateY(0) !important;
  }

  /* Calendar day hover */
  .MuiPickersDay-root:not(.Mui-disabled):not(.Mui-selected):hover {
    background: rgba(34,197,94,0.1) !important;
    border-color: rgba(34,197,94,0.35) !important;
    transform: scale(1.04);
    transition: all 0.15s ease !important;
    z-index: 1;
  }

  /* Chip interactions */
  .sched-chip-action {
    transition: all 0.15s ease !important;
    cursor: pointer !important;
  }
  .sched-chip-action:hover {
    transform: scale(1.05) !important;
  }

  /* Section reveal */
  .sched-section {
    animation: schedFadeUp 0.45s ease both;
  }
  .sched-section:nth-child(2) { animation-delay: 0.08s; }
  .sched-section:nth-child(3) { animation-delay: 0.16s; }

  /* Dialog appear */
  .MuiDialog-paper {
    animation: schedFadeUp 0.25s ease both !important;
  }

  /* Input focus ring */
  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: #22c55e !important;
    border-width: 2px !important;
  }
  .MuiInputLabel-root.Mui-focused {
    color: #16a34a !important;
  }
  .MuiSwitch-switchBase.Mui-checked { color: #22c55e !important; }
  .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track { background-color: #22c55e !important; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #f0fdf4; }
  ::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.3); border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(34,197,94,0.55); }
`;

// ─── Design tokens ────────────────────────────────────────────────────────────
const G = {
  950: "#020c05",
  900: "#052e16",
  800: "#064e23",
  700: "#15803d",
  600: "#16a34a",
  500: "#22c55e",
  400: "#4ade80",
  300: "#86efac",
  200: "#bbf7d0",
  100: "rgba(34,197,94,0.07)",
  50:  "rgba(34,197,94,0.04)",
  border: "rgba(34,197,94,0.16)",
  glow:   "rgba(34,197,94,0.22)",
};

// ─── Card shell ───────────────────────────────────────────────────────────────
const CARD = {
  bgcolor: "#fff",
  border: "1px solid",
  borderColor: "rgba(0,0,0,0.07)",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.04)",
};

// ─── Card header strip ────────────────────────────────────────────────────────
function CardHeader({ icon, label, sub, right, accent = false }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2.5,
        py: 1.75,
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: accent
          ? `linear-gradient(90deg, ${G[100]} 0%, rgba(34,197,94,0.02) 100%)`
          : "rgba(249,250,249,0.8)",
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "9px",
            background: `linear-gradient(145deg, ${G[500]}, ${G[700]})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 3px 10px ${G.glow}`,
            color: "#fff",
            flexShrink: 0,
            fontSize: "0.95rem",
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", lineHeight: 1.15, color: "#111" }}>
          {label}
        </Typography>
        {sub && (
          <Typography sx={{ fontSize: "0.68rem", opacity: 0.45, fontWeight: 500, lineHeight: 1.2 }}>
            {sub}
          </Typography>
        )}
      </Box>
      {right}
    </Box>
  );
}

// ─── Dialog header strip ──────────────────────────────────────────────────────
function DialogHeader({ icon, title, sub, onClose }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 2,
        px: 2.5,
        background: `linear-gradient(135deg, ${G[900]}, ${G[800]})`,
        borderBottom: `1px solid ${G.border}`,
        flexShrink: 0,
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 34, height: 34, borderRadius: "9px",
            background: `linear-gradient(145deg, ${G[500]}, ${G[700]})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 3px 10px ${G.glow}`, color: "#fff", fontSize: "1rem", flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 800, color: "#fff", lineHeight: 1.1, fontSize: "0.95rem" }}>
          {title}
        </Typography>
        {sub && (
          <Typography sx={{ fontSize: "0.68rem", color: G[300], opacity: 0.7 }}>
            {sub}
          </Typography>
        )}
      </Box>
      {onClose && (
        <IconButton
          onClick={onClose} size="small"
          sx={{ color: "rgba(255,255,255,0.55)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" }, transition: "all 0.15s" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}

// ─── Inline label ─────────────────────────────────────────────────────────────
function FieldLabel({ children }) {
  return (
    <Typography
      sx={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase",
        letterSpacing: "0.08em", opacity: 0.45, mb: 0.75 }}
    >
      {children}
    </Typography>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <Box
      sx={{
        display: "flex", flexDirection: "column", alignItems: "center",
        px: 2, py: 1, borderRadius: "10px",
        border: "1px solid", borderColor: `${color}30`,
        background: `${color}0a`,
        minWidth: 64,
        transition: "all 0.2s",
        "&:hover": { background: `${color}14`, borderColor: `${color}50` },
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: "1.25rem", color, lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.06em", mt: 0.25 }}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API = "/api";

const STATUS = {
  SUBMITTED: "SUBMITTED",
  APPROVED:  "APPROVED",
  CANCELED:  "CANCELED",
  ARCHIVED:  "ARCHIVED",
};

function getBookingStatus(b) {
  const raw = b?.status ? String(b.status).toUpperCase() : "";
  if (raw === "ACTIVE") return STATUS.SUBMITTED;
  if (raw) return raw;
  if (b?.archived) return STATUS.ARCHIVED;
  if (b?.canceled) return STATUS.CANCELED;
  return STATUS.SUBMITTED;
}

function getBookingLastDate(b) {
  const ds = Array.isArray(b?.dates) && b.dates.length ? b.dates : (b?.date ? [b.date] : []);
  if (!ds.length) return null;
  return ds.map((d) => dayjs(d)).sort((a, c) => a.valueOf() - c.valueOf())[ds.length - 1];
}

function isBookingPast(b) {
  const last = getBookingLastDate(b);
  if (!last) return false;
  return dayjs().startOf("day").isAfter(last.startOf("day"), "day");
}

function getStatusChipProps(status) {
  const map = {
    [STATUS.SUBMITTED]: { label: "SUBMITTED", color: "info",    variant: "filled" },
    [STATUS.APPROVED]:  { label: "APPROVED",  color: "success", variant: "filled" },
    [STATUS.CANCELED]:  { label: "CANCELED",  color: "error",   variant: "filled" },
    [STATUS.ARCHIVED]:  { label: "ARCHIVED",  color: "warning", variant: "filled" },
  };
  return map[status] ?? { label: "SUBMITTED", color: "info", variant: "filled" };
}

const STATUS_COLORS = {
  [STATUS.SUBMITTED]: "#0284c7",
  [STATUS.APPROVED]:  G[600],
  [STATUS.CANCELED]:  "#ef4444",
  [STATUS.ARCHIVED]:  "#f59e0b",
};

const toggleItems = [
  { key: "aircon", label: "Aircon", icon: "❄️" },
  { key: "lights", label: "Lights", icon: "💡" },
  { key: "sounds", label: "Sounds", icon: "🔊" },
  { key: "led",    label: "LED",    icon: "🌟" },
];

const VENUES = [
  "Unlad Gymnasium",
  "Noveleta Plaza",
  "Noveleta Public Market Rooftop",
  "Others",
];

const LIMITS = {
  requestedBy: 40,
  otherEventName: 40,
  chairsDigits: 3,
  tablesDigits: 3,
  amountDigits: 7,
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
function formatDateRange(booking) {
  const dates = Array.isArray(booking?.dates) && booking.dates.length
    ? booking.dates
    : (booking?.date ? [booking.date] : []);
  if (!dates.length) return "—";
  if (dates.length === 1) return dayjs(dates[0]).format("MMMM D, YYYY");
  const list = dates.filter(Boolean).map((d) => dayjs(d)).sort((a, b) => a.valueOf() - b.valueOf());
  const groups = new Map();
  for (const d of list) {
    const key = d.format("MMMM YYYY");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }
  const parts = [];
  for (const [, arr] of groups.entries()) {
    arr.sort((a, b) => a.valueOf() - b.valueOf());
    const ranges = [];
    let start = arr[0], prev = arr[0];
    for (let i = 1; i < arr.length; i++) {
      if (arr[i].diff(prev, "day") !== 1) { ranges.push([start, prev]); start = arr[i]; }
      prev = arr[i];
    }
    ranges.push([start, prev]);
    parts.push(`${arr[0].format("MMMM")} ${ranges.map(([s, e]) => s.date() === e.date() ? `${s.date()}` : `${s.date()}–${e.date()}`).join(", ")}, ${arr[0].format("YYYY")}`);
  }
  return parts.join(" and ");
}

function formatSelectedDatesDayjs(dateObjs = []) {
  const list = (Array.isArray(dateObjs) ? dateObjs : []).filter(Boolean).map((d) => dayjs(d)).sort((a, b) => a.valueOf() - b.valueOf());
  if (!list.length) return "—";
  if (list.length === 1) return list[0].format("MMM D, YYYY");
  const groups = new Map();
  for (const d of list) {
    const key = d.format("MMM YYYY");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(d);
  }
  const parts = [];
  for (const [, arr] of groups.entries()) {
    arr.sort((a, b) => a.valueOf() - b.valueOf());
    const ranges = [];
    let start = arr[0], prev = arr[0];
    for (let i = 1; i < arr.length; i++) {
      if (arr[i].diff(prev, "day") !== 1) { ranges.push([start, prev]); start = arr[i]; }
      prev = arr[i];
    }
    ranges.push([start, prev]);
    parts.push(`${arr[0].format("MMM")} ${ranges.map(([s, e]) => s.date() === e.date() ? `${s.date()}` : `${s.date()}–${e.date()}`).join(", ")}, ${arr[0].format("YYYY")}`);
  }
  return parts.join(" and ");
}

function formatTime12h(hhmm) {
  if (!hhmm) return "—";
  return dayjs(`2000-01-01T${String(hhmm).slice(0, 5)}`).format("h:mm A");
}

// ─── Resource inputs ──────────────────────────────────────────────────────────
function ResourceInputs({ resources, setResources }) {
  const setQty = (key, max) => (e) => {
    const raw = e.target.value;
    if (raw === "") { setResources({ ...resources, [key]: "" }); return; }
    if (!/^\d+$/.test(raw) || raw.length > max) return;
    setResources({ ...resources, [key]: raw });
  };
  const normQty = (key) => () => {
    const v = resources[key];
    if (v === "") return;
    const n = Math.max(0, parseInt(v, 10) || 0);
    setResources({ ...resources, [key]: n === 0 ? "" : String(n) });
  };

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
        {[["chairs", LIMITS.chairsDigits, "🪑 Chairs"], ["tables", LIMITS.tablesDigits, "🪞 Tables"]].map(([key, max, lbl]) => (
          <TextField
            key={key}
            label={lbl}
            value={resources[key] ?? ""}
            onChange={setQty(key, max)}
            onBlur={normQty(key)}
            onFocus={(e) => e.target.select()}
            placeholder="0"
            size="small"
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          />
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 1 }}>
        {toggleItems.map((it) => (
          <Box
            key={it.key}
            onClick={() => setResources({ ...resources, [it.key]: !resources[it.key] })}
            sx={{
              border: "1px solid",
              borderColor: resources[it.key] ? G[500] : "rgba(0,0,0,0.1)",
              borderRadius: "10px",
              px: 1.25, py: 1,
              background: resources[it.key] ? G[100] : "rgba(0,0,0,0.02)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": { borderColor: G[400], background: resources[it.key] ? "rgba(34,197,94,0.12)" : "rgba(0,0,0,0.04)" },
              display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25,
            }}
          >
            <Typography sx={{ fontSize: "1.1rem", lineHeight: 1 }}>{it.icon}</Typography>
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.03em" }}>{it.label}</Typography>
            <Box
              sx={{
                width: 28, height: 14, borderRadius: "99px", mt: 0.25,
                background: resources[it.key] ? G[500] : "rgba(0,0,0,0.12)",
                position: "relative", transition: "background 0.2s",
              }}
            >
              <Box
                sx={{
                  position: "absolute", top: 2,
                  left: resources[it.key] ? "calc(100% - 12px)" : 2,
                  width: 10, height: 10, borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Calendar Section ─────────────────────────────────────────────────────────
function CalendarSection({ calendarView, selectedDates, onToggleDate, onViewChange, headerActions, calendarMonth, onMonthChange, reservedByDate, onReservedDayClick }) {
  const contentRef = React.useRef(null);
  const measure = React.useCallback(() => { if (!contentRef.current) return; }, []);

  React.useEffect(() => {
    if (!contentRef.current) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, [measure]);

  React.useEffect(() => {
    const t1 = setTimeout(measure, 0);
    const t2 = setTimeout(measure, 120);
    const t3 = setTimeout(measure, 250);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [calendarMonth, measure]);

  const isSelected = React.useCallback(
    (day) => selectedDates?.some((d) => d && day && d.isSame(day, "day")),
    [selectedDates]
  );

  function MultiPickDay(props) {
    const { day, outsideCurrentMonth, ...other } = props;
    const selected = isSelected(day);
    const dateStr = day?.format("YYYY-MM-DD");
    const reservedList = dateStr && reservedByDate ? reservedByDate.get(dateStr) : null;
    const isReserved = !!(reservedList && reservedList.length);
    const today = dayjs().startOf("day");
    const isPast = day && day.isBefore(today, "day");
    const isDisabled = isPast && !isReserved;
    const isToday = day && day.isSame(today, "day");

    let dayStatus = null, displayList = reservedList || [];
    if (displayList.length) {
      const nonCanceled = displayList.filter((b) => getBookingStatus(b) !== STATUS.CANCELED);
      const listForColor = nonCanceled.length ? nonCanceled : displayList;
      const statuses = Array.from(new Set(listForColor.map(getBookingStatus)));
      dayStatus = statuses.length > 1 ? "MULTI" : statuses[0] || null;
      displayList = listForColor;
    }

    const reservedSxMap = {
      [STATUS.CANCELED]:  { bgcolor: "rgba(239,68,68,0.1)",  borderColor: "#ef4444", color: "#b91c1c", fontWeight: 800, boxShadow: "inset 0 0 0 1.5px #ef4444" },
      [STATUS.APPROVED]:  { bgcolor: "rgba(34,197,94,0.1)",  borderColor: G[500],    color: G[800],    fontWeight: 800, boxShadow: `inset 0 0 0 1.5px ${G[500]}` },
      [STATUS.SUBMITTED]: { bgcolor: "rgba(2,132,199,0.1)",  borderColor: "#0284c7", color: "#0369a1", fontWeight: 800, boxShadow: "inset 0 0 0 1.5px #0284c7" },
      [STATUS.ARCHIVED]:  { bgcolor: "rgba(245,158,11,0.1)", borderColor: "#f59e0b", color: "#b45309", fontWeight: 800, boxShadow: "inset 0 0 0 1.5px #f59e0b" },
      MULTI: {
        background: "linear-gradient(135deg, rgba(2,132,199,0.12) 0%, rgba(79,70,229,0.12) 50%, rgba(245,158,11,0.1) 100%)",
        borderColor: "rgba(0,0,0,0.12)", color: "text.primary", fontWeight: 800,
        boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.08)",
      },
    };

    const reservedStyle = isReserved ? (reservedSxMap[dayStatus] || reservedSxMap[STATUS.SUBMITTED]) : {};

    return (
      <Box sx={{ position: "relative", width: "100%", height: { xs: 44, sm: 54 } }}>
        <PickersDay
          {...other}
          day={day}
          outsideCurrentMonth={outsideCurrentMonth}
          selected={selected}
          disabled={isDisabled}
          onClick={(e) => {
            if (isDisabled) return;
            if (isReserved) {
              // Only open the dialog — don't toggle selection here
              onReservedDayClick?.(reservedList, dateStr);
            } else {
              onToggleDate?.(day);
            }
          }}
          sx={{
            ...reservedStyle,
            position: "absolute", inset: 0, width: "100%", height: "100%",
            ...(isToday && !selected && !isReserved ? {
              fontWeight: 900, color: G[700],
              border: `2px solid ${G[500]} !important`,
            } : {}),
            ...(selected ? {
              bgcolor: `${G[600]} !important`, color: "#fff !important",
              borderColor: `${G[600]} !important`, fontWeight: 900,
              boxShadow: `0 0 0 3px ${G[300]}`,
              "&:hover": { bgcolor: `${G[700]} !important` },
            } : {}),
          }}
        />

        {/* Badge — stopPropagation so it doesn't also trigger the day click above */}
        {isReserved && (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              onReservedDayClick?.(reservedList, dateStr);
            }}
            sx={{
              position: "absolute", top: 2, right: 3,
              width: 18, height: 18, borderRadius: "999px",
              bgcolor: "rgba(0,0,0,0.55)", color: "#fff",
              fontSize: "0.85rem", 
              fontWeight: 900,
              fontFamily: "'JetBrains Mono', monospace !important",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", zIndex: 2,
              "&:hover": { bgcolor: "rgba(0,0,0,0.75)", transform: "scale(1.15)" },
              transition: "all 0.15s",
            }}
          >
            {(reservedList?.length || 0) > 1 ? reservedList.length : "i"} {/* Use original reservedList */}
          </Box>
        )}
      </Box>
    );
  }

  const CAL_H = { xs: 44 * 6 + 6 * 5 + 110, sm: 56 * 6 + 6 * 5 + 110 };

  const LEGEND = [
    { label: "Submitted",  bg: "rgba(2,132,199,0.12)",   border: "#0284c7" },
    { label: "Approved",   bg: `rgba(34,197,94,0.12)`,   border: G[500]   },
    { label: "Canceled",   bg: "rgba(239,68,68,0.12)",   border: "#ef4444" },
    { label: "Archived",   bg: "rgba(245,158,11,0.1)",   border: "#f59e0b" },
    { label: "Multiple",   bg: "linear-gradient(135deg,rgba(2,132,199,0.12),rgba(79,70,229,0.12))", border: "rgba(0,0,0,0.12)" },
  ];

  return (
    <Box className="sched-card sched-section" sx={{ ...CARD }}>
      <CardHeader
        icon={<EventNoteIcon sx={{ fontSize: "1rem" }} />}
        label="Select Date(s)"
        // In CalendarSection CardHeader sub prop:
        sub={
          selectedDates?.length
            ? `${selectedDates.length} date(s) selected — ALT+click a reserved day to add it`
            : "Tap free days to select • ALT+click reserved days to add them"
        }
        accent
        right={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {headerActions}
          </Box>
        }
      />

      {/* Legend */}
      <Box sx={{ px: 2.5, pt: 1.5, pb: 0.5 }}>
        <FieldLabel>Legend</FieldLabel>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          {LEGEND.map((l) => (
            <Box
              key={l.label}
              sx={{
                display: "flex", alignItems: "center", gap: 0.5,
                px: 1.1, py: 0.35, borderRadius: "999px",
                border: `1px solid ${l.border}`, background: l.bg,
                transition: "transform 0.15s ease",
                "&:hover": { transform: "scale(1.04)" },
              }}
            >
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700 }}>{l.label}</Typography>
            </Box>
          ))}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.1, py: 0.35, borderRadius: "999px", border: "1px solid rgba(0,0,0,0.12)" }}>
            <Typography sx={{ fontSize: "0.68rem", fontWeight: 700 }}># count</Typography>
          </Box>
        </Stack>
      </Box>

      {/* Calendar */}
      <Box ref={contentRef} sx={{ px: { xs: 1.5, sm: 2.5 }, pb: 2.5 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateCalendar
            fixedWeekNumber={6}
            views={["year", "month", "day"]}
            view={calendarView}
            value={calendarMonth}
            onViewChange={onViewChange}
            onMonthChange={(m) => { if (!calendarMonth.isSame(m, "month")) onMonthChange?.(m); onViewChange?.("day"); }}
            showDaysOutsideCurrentMonth={false}
            slots={{ day: MultiPickDay }}
            sx={{
              width: "100%", maxWidth: "none", m: 0,

              ...(calendarView === "day" ? {
                height: CAL_H, minHeight: CAL_H,
                "& .MuiPickersSlideTransition-root": { minHeight: { xs: 44*6+6*5, sm: 56*6+6*5 }, height: "auto", overflow: "visible" },
                "& .MuiDayCalendar-slideTransition":  { minHeight: { xs: 44*6+6*5, sm: 56*6+6*5 }, height: "auto", overflow: "visible" },
              } : { height: "auto", minHeight: 0 }),

              ...(calendarView === "year" ? {
                "& .MuiYearCalendar-root": { width: "100%", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, p: 1, m: 0, boxSizing: "border-box", overflowY: "auto" },
                "& .MuiYearCalendar-button": {
                  width: "100% !important", height: "52px !important", fontSize: "1.05rem !important", fontWeight: "800 !important",
                  borderRadius: "10px !important", border: "1px solid rgba(0,0,0,0.08) !important",
                  transition: "all 0.15s !important",
                  "&:hover": { background: `${G[100]} !important`, borderColor: `${G[500]} !important`, transform: "scale(1.02)" },
                  "&.Mui-selected": { background: `${G[600]} !important`, color: "#fff !important", borderColor: `${G[600]} !important` },
                },
              } : {}),

              ...(calendarView === "month" ? {
                "& .MuiMonthCalendar-root": { width: "100%", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5, p: 1, m: 0, boxSizing: "border-box" },
                "& .MuiMonthCalendar-button": {
                  width: "100% !important", height: "60px !important", fontSize: "1.05rem !important", fontWeight: "800 !important",
                  borderRadius: "10px !important", border: "1px solid rgba(0,0,0,0.08) !important",
                  transition: "all 0.15s !important",
                  "&:hover": { background: `${G[100]} !important`, borderColor: `${G[500]} !important`, transform: "scale(1.02)" },
                  "&.Mui-selected": { background: `${G[600]} !important`, color: "#fff !important", borderColor: `${G[600]} !important` },
                },
              } : {}),

              "& .MuiDayCalendar-monthContainer": { width: "100%", display: "grid", rowGap: "5px" },
              "& .MuiDayCalendar-header": { display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", columnGap: "5px", width: "100%", m: 0 },
              "& .MuiDayCalendar-weekDayLabel": { width: "100%", fontWeight: 800, opacity: 0.4, fontSize: "0.75rem", m: 0, textAlign: "center" },
              "& .MuiDayCalendar-weekContainer": { display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", columnGap: "5px", width: "100%", m: 0, p: 0 },
              "& .MuiPickersDay-root": {
                width: "100%", height: { xs: 44, sm: 54 }, borderRadius: "8px", m: 0, p: 0,
                boxSizing: "border-box", border: "1px solid rgba(0,0,0,0.07)",
                fontSize: "0.85rem", fontWeight: 600, transition: "all 0.15s ease",
              },
              "& .MuiPickersDay-hiddenDaySpacingFiller": {
                width: "100%", height: { xs: 44, sm: 54 }, borderRadius: "8px",
                boxSizing: "border-box", border: "1px solid rgba(0,0,0,0.04)", opacity: 0.3,
              },
              "& .MuiPickersArrowSwitcher-button": {
                backgroundColor: G[600], color: "white", borderRadius: "8px",
                width: 32, height: 32, margin: "0 2px",
                transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                border: "none", boxShadow: `0 2px 8px ${G.glow}`,
                "&:hover": { backgroundColor: G[700], transform: "scale(1.1)", boxShadow: `0 4px 16px ${G.glow}` },
                "&:active": { transform: "scale(0.92)" },
                "& .MuiSvgIcon-root": { fontSize: "1.1rem" },
              },
              "& .MuiPickersCalendarHeader-root": { padding: "8px 4px", marginBottom: "4px" },
              "& .MuiPickersCalendarHeader-label": { fontWeight: 800, fontSize: "0.92rem" },
              "& .MuiPickersArrowSwitcher-root": { display: "flex", gap: "4px" },
            }}
          />
        </LocalizationProvider>
      </Box>
    </Box>
  );
}

// ─── Booking Drawer ────────────────────────────────────────────────────────────
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
  const [snack, setSnack] = React.useState({ open: false, message: "", severity: "info" });
  const notify = React.useCallback((message, severity = "info") => setSnack({ open: true, message, severity }), []);
  const closeSnack = (_, r) => { if (r === "clickaway") return; setSnack((s) => ({ ...s, open: false })); };
  const [resources, setResources] = React.useState({ chairs: "", tables: "", aircon: false, lights: false, sounds: false, led: false });
  const [confirmCloseOpen, setConfirmCloseOpen] = React.useState(false);
  const initialRef = React.useRef(null);

  React.useEffect(() => { setDates(Array.isArray(selectedDates) ? selectedDates : []); }, [selectedDates]);

  const durationLabel = React.useMemo(() => {
    if (!startTime || !endTime) return "—";
    const mins = endTime.diff(startTime, "minute");
    if (mins <= 0) return "—";
    const h = Math.floor(mins / 60), m = mins % 60;
    return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
  }, [startTime, endTime]);

  const durationHours = React.useMemo(() => {
    if (!startTime || !endTime) return 0;
    const mins = endTime.diff(startTime, "minute");
    if (mins <= 0) return 0;
    return Math.round((mins / 60) * 100) / 100;
  }, [startTime, endTime]);

  const safeAmount = React.useMemo(() => (amount === "" || amount == null) ? 0 : Math.max(0, Number(amount)), [amount]);
  const finalEventName = React.useMemo(() => eventName.trim(), [eventName]);

  const makeSnapshot = React.useCallback(() => ({
    requestedBy: requestedBy.trim(), eventName: eventName.trim(), venue: venue.trim(),
    date: (dates?.[0]?.format("YYYY-MM-DD")) || "",
    startTime: startTime?.format("HH:mm") || "", endTime: endTime?.format("HH:mm") || "",
    amount: Number(amount || 0), resources,
  }), [requestedBy, eventName, venue, dates, startTime, endTime, amount, resources]);

  const isDirty = React.useMemo(() => {
    if (!open || !initialRef.current) return false;
    return JSON.stringify(makeSnapshot()) !== JSON.stringify(initialRef.current);
  }, [open, makeSnapshot]);

  React.useEffect(() => {
    if (!open) return;
    setConfirmCloseOpen(false);
    const isEdit = !!initialBooking?.id;
    if (isEdit) {
      const b = initialBooking;
      setRequestedBy(b.requestedBy ?? ""); setEventName(b.eventName ?? "");
      const sv = String(b.venue ?? "");
      const known = VENUES.includes(sv) && sv !== "Others";
      if (known) { setVenue(sv); setOtherVenue(""); }
      else if (sv) { setVenue("Others"); setOtherVenue(sv); }
      else { setVenue(""); setOtherVenue(""); }
      const ed = Array.isArray(b.dates) && b.dates.length ? b.dates : (b.date ? [b.date] : []);
      setDates(ed.map((x) => dayjs(x)));
      setStartTime(dayjs(`${b.date}T${b.startTime}`)); setEndTime(dayjs(`${b.date}T${b.endTime}`));
      setAmount(String(b.amount ?? ""));
      setResources({ chairs: String(b.resources?.chairs ?? ""), tables: String(b.resources?.tables ?? ""), aircon: !!b.resources?.aircon, lights: !!b.resources?.lights, sounds: !!b.resources?.sounds, led: !!b.resources?.led });
      setTimeout(() => { initialRef.current = { requestedBy: String(b.requestedBy ?? "").trim(), eventName: String(b.eventName ?? "").trim(), venue: String(b.venue ?? "").trim(), date: String(b.date ?? ""), startTime: String(b.startTime ?? ""), endTime: String(b.endTime ?? ""), amount: Number(b.amount ?? 0), resources: { chairs: String(b.resources?.chairs ?? ""), tables: String(b.resources?.tables ?? ""), aircon: !!b.resources?.aircon, lights: !!b.resources?.lights, sounds: !!b.resources?.sounds, led: !!b.resources?.led } }; }, 0);
      return;
    }
    const baseDate = (Array.isArray(selectedDates) && selectedDates[0]) ? selectedDates[0] : dayjs();
    setRequestedBy(""); setEventName(""); setVenue(""); setOtherVenue("");
    setDates(Array.isArray(selectedDates) && selectedDates.length ? selectedDates : [baseDate]);
    setStartTime(dayjs(baseDate).hour(19).minute(0)); setEndTime(dayjs(baseDate).hour(22).minute(0));
    setAmount(""); setResources({ chairs: "", tables: "", aircon: false, lights: false, sounds: false, led: false });
    setTimeout(() => { initialRef.current = { requestedBy: "", eventName: "", venue: "", date: dayjs(baseDate).format("YYYY-MM-DD"), startTime: dayjs(baseDate).hour(19).minute(0).format("HH:mm"), endTime: dayjs(baseDate).hour(22).minute(0).format("HH:mm"), amount: 0, resources: { chairs: "", tables: "", aircon: false, lights: false, sounds: false, led: false } }; }, 0);
  }, [open, selectedDates, initialBooking]);

  const handleDrawerClose = (_, reason) => { if (isDirty) { setConfirmCloseOpen(true); return; } onClose(); };
  const confirmDiscardAndClose = () => { setConfirmCloseOpen(false); onClose(); };

  const toMins = (hhmm) => { const [h, m] = String(hhmm || "").split(":").map(Number); return (!Number.isFinite(h) || !Number.isFinite(m)) ? NaN : h * 60 + m; };
  const rangesOverlap = (aS, aE, bS, bE) => aS < bE && aE > bS;
  const bookingDates = (b) => Array.isArray(b?.dates) && b.dates.length ? b.dates : (b?.date ? [b.date] : []);

  async function submit() {
    if (!requestedBy.trim()) return notify("Please enter Requested by (Name).", "warning");
    if (!eventName.trim()) return notify("Please enter Event Name.", "warning");
    if (!venue) return notify("Please select a Venue.", "warning");
    if (venue === "Others" && !otherVenue.trim()) return notify("Please specify the Venue.", "warning");
    const finalVenue = venue === "Others" ? otherVenue.trim() : venue;
    const isEdit = !!initialBooking?.id;
    if (isEdit) { const st = getBookingStatus(initialBooking); if (st === STATUS.CANCELED || st === STATUS.ARCHIVED) return notify("This reservation can no longer be edited.", "warning"); }
    const dateList = (isEdit ? [dates?.[0]] : (dates || [])).filter(Boolean);
    if (!dateList.length) return notify("Please select at least one date.", "warning");
    const s = toMins(startTime.format("HH:mm")), e = toMins(endTime.format("HH:mm"));
    if (!Number.isFinite(s) || !Number.isFinite(e) || s >= e) return notify("Invalid time range. End time must be after start time.", "warning");
    const dateStrs = dateList.map((d) => d.format("YYYY-MM-DD"));
    const ignoreId = initialBooking?.id ?? null;
    for (const b of (existingBookings || [])) {
      if (ignoreId && b.id === ignoreId) continue;
      const bStatus = getBookingStatus(b);
      if (b.archived || bStatus === STATUS.CANCELED || bStatus === STATUS.ARCHIVED || b.venue !== finalVenue) continue;
      const bDates = bookingDates(b), bs = toMins(b.startTime), be = toMins(b.endTime);
      if (!Number.isFinite(bs) || !Number.isFinite(be)) continue;
      for (const d of dateStrs) {
        if (!bDates.includes(d)) continue;
        if (rangesOverlap(s, e, bs, be)) return notify(`Conflict: ${venue} already reserved on ${dayjs(d).format("MM-DD-YYYY")} (${formatTime12h(b.startTime)} – ${formatTime12h(b.endTime)}).`, "error");
      }
    }
    const nr = { ...resources, chairs: Math.max(0, Number(resources.chairs || 0)), tables: Math.max(0, Number(resources.tables || 0)) };
    const common = { requestedBy: requestedBy.trim(), eventTypeId: null, eventName: finalEventName, venue: finalVenue, startTime: startTime.format("HH:mm"), endTime: endTime.format("HH:mm"), durationHours, amount: safeAmount, resources: nr, status: STATUS.SUBMITTED };
    try {
      if (isEdit) {
        const res = await axios.put(`${API}/bookings/${initialBooking.id}`, { ...common, date: dateList[0].format("YYYY-MM-DD") });
        notify(`Updated! Amount: ₱${Number(res.data?.amount ?? safeAmount).toLocaleString()}`, "success");
        onBooked?.(res.data ?? { ...common, date: dateList[0].format("YYYY-MM-DD") });
        initialRef.current = makeSnapshot(); onClose(); return;
      }
      const res = await axios.post(`${API}/bookings`, { ...common, dates: dateList.map((d) => d.format("YYYY-MM-DD")), date: dateList[0].format("YYYY-MM-DD") });
      notify(`Reserved ${dateList.length} day(s)!`, "success");
      onBooked?.(res.data ?? common);
      initialRef.current = makeSnapshot(); onClose();
    } catch (err) {
      console.error(err);
      notify(err?.response?.data?.message || err?.response?.data?.error || "Reservation failed.", "error");
    }
  }

  const handleSubmitClick = () => {
    if (!requestedBy.trim()) return notify("Please enter Requested by (Name).", "warning");
    if (!eventName.trim()) return notify("Please enter Event Name.", "warning");
    if (!venue) return notify("Please select a Venue.", "warning");
    const isEdit = !!initialBooking?.id;
    const dateList = (isEdit ? [dates?.[0]] : (dates || [])).filter(Boolean);
    if (!dateList.length) return notify("Please select at least one date.", "warning");
    const s = toMins(startTime.format("HH:mm")), e = toMins(endTime.format("HH:mm"));
    if (!Number.isFinite(s) || !Number.isFinite(e) || s >= e) return notify("Invalid time range.", "warning");
    setConfirmSubmitOpen(true);
  };

  const sectionLabelSx = { fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.09em", opacity: 0.4, mb: 1.25 };

  return (
    <>
      <Dialog
        open={open} onClose={handleDrawerClose} fullWidth maxWidth="sm" scroll="paper"
        slotProps={{
          backdrop: { sx: { bgcolor: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" } },
          paper: { sx: { borderRadius: "16px", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.28)", border: "1px solid rgba(0,0,0,0.07)" } },
        }}
      >
        <DialogHeader
          icon="📋"
          title={initialBooking?.id ? "Edit Reservation" : "New Reservation"}
          sub="Fill in the details below"
          onClose={(e) => handleDrawerClose(e, "close")}
        />

        <DialogContent sx={{ px: 2.5, py: 2.5, display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Requester */}
          <Typography sx={sectionLabelSx}>👤 Requester</Typography>
          <TextField
            fullWidth label="Requested by (Name)"
            value={requestedBy}
            onChange={(e) => setRequestedBy(e.target.value.slice(0, LIMITS.requestedBy))}
            inputProps={{ maxLength: LIMITS.requestedBy }}
            helperText={<span>e.g. <b>Juan Dela Cruz</b> · {requestedBy.length}/{LIMITS.requestedBy}</span>}
            sx={{ mb: 2.5 }}
          />

          {/* Event + Venue */}
          <Typography sx={sectionLabelSx}>🎉 Event Details</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: venue === "Others" ? 0 : 2.5 }}>
            <TextField
              fullWidth label="Event Name" value={eventName}
              onChange={(e) => setEventName(e.target.value.slice(0, LIMITS.otherEventName))}
              inputProps={{ maxLength: LIMITS.otherEventName }}
              helperText={<span>e.g. <b>Birthday</b>, <b>Wedding</b> · {eventName.length}/{LIMITS.otherEventName}</span>}
            />
            <FormControl fullWidth>
              <InputLabel>Venue</InputLabel>
              <Select label="Venue" value={venue} onChange={(e) => { setVenue(e.target.value); if (e.target.value !== "Others") setOtherVenue(""); }}>
                {VENUES.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          {venue === "Others" && (
            <TextField
              fullWidth label="Specify Venue" value={otherVenue}
              onChange={(e) => setOtherVenue(e.target.value.slice(0, 60))}
              helperText="Type the venue name" sx={{ mb: 2.5, mt: 1.5 }}
            />
          )}

          {/* Time */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25, flexWrap: "wrap", gap: 1 }}>
            <Typography sx={sectionLabelSx}>⏱ Time</Typography>
            {durationLabel !== "—" && (
              <Box sx={{ px: 1.25, py: 0.3, borderRadius: "999px", bgcolor: G[100], border: `1px solid ${G.border}` }}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: G[700] }}>Duration: {durationLabel}</Typography>
              </Box>
            )}
          </Box>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mb: 2.5 }}>
              <TimePicker label="Start Time" value={startTime} onChange={(v) => v && setStartTime(v)} slotProps={{ textField: { fullWidth: true } }} />
              <TimePicker label="End Time" value={endTime} onChange={(v) => v && setEndTime(v)} slotProps={{ textField: { fullWidth: true } }} />
            </Box>
          </LocalizationProvider>

          {/* Dates */}
          <Typography sx={sectionLabelSx}>📅 Date(s)</Typography>
          <Box
            sx={{
              p: 1.75, mb: 2.5, borderRadius: "12px",
              border: `1px solid ${G.border}`, bgcolor: G[50],
              background: `linear-gradient(135deg, ${G[100]} 0%, rgba(34,197,94,0.03) 100%)`,
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: G[800], mb: 1 }}>
              {formatSelectedDatesDayjs(dates)}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {(dates || []).map((d) => (
                <Chip
                  key={d.format("YYYY-MM-DD")} label={d.format("MMM D, YYYY")} size="small"
                  sx={{ fontWeight: 700, bgcolor: G[600], color: "#fff", fontSize: "0.7rem" }}
                />
              ))}
            </Box>
          </Box>

          {/* Resources */}
          <Divider sx={{ mb: 2.5 }} />
          <Typography sx={sectionLabelSx}>🔧 Resources</Typography>
          <Box sx={{ mb: 2.5 }}>
            <ResourceInputs resources={resources} setResources={setResources} />
          </Box>

          {/* Payment */}
          <Divider sx={{ mb: 2.5 }} />
          <Typography sx={sectionLabelSx}>💰 Payment</Typography>
          <TextField
            label="Amount" value={String(amount ?? "")}
            onChange={(e) => { const raw = e.target.value; if (raw === "") return setAmount(""); if (!/^\d+$/.test(raw) || raw.length > LIMITS.amountDigits) return; setAmount(raw); }}
            onFocus={(e) => e.target.select()}
            onBlur={() => { if (amount === "") return; const n = Math.max(0, parseInt(amount, 10) || 0); setAmount(n === 0 ? "" : String(n)); }}
            placeholder="0" fullWidth
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 800, color: G[600], fontSize: "1rem" }}>₱</Typography></InputAdornment> }}
          />
        </DialogContent>

        <DialogActions
          sx={{ px: 2.5, py: 2, borderTop: "1px solid rgba(0,0,0,0.07)", gap: 1,
            background: "linear-gradient(180deg, rgba(249,250,249,0.5), rgba(249,250,249,1))" }}
        >
          <Button onClick={(e) => handleDrawerClose(e, "cancel")} variant="outlined"
            sx={{ fontWeight: 800, borderRadius: "10px", borderColor: "rgba(0,0,0,0.15)", color: "text.secondary", "&:hover": { borderColor: "rgba(0,0,0,0.3)" } }}>
            Cancel
          </Button>
          <Button
            className="sched-btn-primary"
            variant="contained" onClick={handleSubmitClick}
            sx={{ fontWeight: 900, px: 3, borderRadius: "10px", background: `linear-gradient(135deg, ${G[500]}, ${G[700]})`, boxShadow: `0 4px 16px ${G.glow}`, "&:hover": { background: `linear-gradient(135deg, ${G[400]}, ${G[600]})`, boxShadow: `0 6px 22px ${G.glow}` } }}
          >
            {initialBooking?.id ? "Update Reservation" : "Submit Reservation"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Discard changes dialog */}
      <Dialog open={confirmCloseOpen} onClose={() => setConfirmCloseOpen(false)}>
        <DialogTitle sx={{ fontWeight: 900 }}>Discard changes?</DialogTitle>
        <DialogContent><DialogContentText>You have unsaved changes. They will be lost if you close now.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCloseOpen(false)}>Keep Editing</Button>
          <Button color="error" variant="contained" onClick={confirmDiscardAndClose} sx={{ fontWeight: 800 }}>Discard & Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm submit dialog */}
      <Dialog open={confirmSubmitOpen} onClose={() => setConfirmSubmitOpen(false)} maxWidth="xs" fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px" } } }}>
        <DialogHeader
          icon="✅"
          title={`Confirm ${initialBooking?.id ? "Update" : "Reservation"}`}
          sub="Review before submitting"
          onClose={() => setConfirmSubmitOpen(false)}
        />
        <DialogContent sx={{ px: 2.5, py: 2 }}>
          <Box sx={{ p: 1.75, bgcolor: G[100], borderRadius: "12px", border: `1px solid ${G.border}` }}>
            <Typography variant="body2" component="div" sx={{ lineHeight: 2 }}>
              <strong>Event:</strong> {finalEventName}<br />
              <strong>By:</strong> {requestedBy}<br />
              <strong>Venue:</strong> {venue === "Others" ? otherVenue : venue}<br />
              <strong>Date(s):</strong> {formatSelectedDatesDayjs(dates)}<br />
              <strong>Time:</strong> {startTime?.format("h:mm A")} – {endTime?.format("h:mm A")}<br />
              <strong>Amount:</strong> ₱{safeAmount.toLocaleString()}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.75, gap: 1 }}>
          <Button onClick={() => setConfirmSubmitOpen(false)}>Cancel</Button>
          <Button onClick={async () => { setConfirmSubmitOpen(false); await submit(); }} color="success" variant="contained" sx={{ fontWeight: 800, borderRadius: "10px" }}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3500} onClose={closeSnack} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={closeSnack} severity={snack.severity} variant="filled" sx={{ width: "100%", fontWeight: 700, borderRadius: "10px" }}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
}

// ─── Day Bookings Dialog ──────────────────────────────────────────────────────
function DayBookingsDialog({ open, dateStr, bookings = [], onClose, onPick, onCreate, onAddToSelection, isSelected }) {
  const list = [...(Array.isArray(bookings) ? bookings : [])].sort((a, b) =>
    String(a.startTime || "").localeCompare(String(b.startTime || ""))
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      slotProps={{ paper: { sx: { borderRadius: "16px", overflow: "hidden" } } }}>
      <DialogHeader
        icon="📋"
        title={`Reservations — ${dateStr ? dayjs(dateStr).format("MMMM D, YYYY") : "—"}`}
        sub="Click a row to view full details"
        onClose={onClose}
      />
      <DialogContent sx={{ p: 0 }}>
        {list.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center", opacity: 0.5 }}>
            <Typography sx={{ fontSize: "2.5rem", mb: 1 }}>📭</Typography>
            <Typography sx={{ fontWeight: 800 }}>No reservations on this date</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                  {["Time", "Event", "Venue", "Status"].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontWeight: 800, fontSize: "0.72rem",
                        textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.5,
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((b) => {
                  const st = getBookingStatus(b);
                  const chip = getStatusChipProps(st);
                  return (
                    <TableRow
                      key={b.id ?? `${b.date}-${b.startTime}`}
                      className="sched-row"
                      hover
                      onClick={() => onPick?.(b)}
                      sx={{ "&:hover td": { bgcolor: G[50] } }}
                    >
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Chip
                          size="small" variant="outlined"
                          label={`${formatTime12h(b.startTime)} – ${formatTime12h(b.endTime)}`}
                          sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 800, fontSize: "0.88rem" }}>{b.eventName ?? "—"}</Typography>
                        <Typography sx={{ fontSize: "0.72rem", opacity: 0.5 }}>by {b.requestedBy ?? "—"}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.85rem" }}>{b.venue ?? "—"}</TableCell>
                      <TableCell>
                        <Chip
                          size="small" label={chip.label} color={chip.color}
                          variant={chip.variant} sx={{ fontWeight: 800, fontSize: "0.68rem" }}
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

      <DialogActions
        sx={{
          px: 2.5, py: 1.75,
          justifyContent: "space-between",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography sx={{ fontSize: "0.7rem", opacity: 0.45 }}>
          Click a row to view • <b>ALT+click</b> calendar day to select it
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            onClick={onClose}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 800, borderRadius: "8px" }}
          >
            Close
          </Button>
          <Button
            onClick={() => onAddToSelection?.(dateStr)}
            variant="contained"  // Changed from conditional to always contained
            size="small"
            disabled={!dateStr}
            sx={{
              fontWeight: 800, 
              borderRadius: "8px",
              background: isSelected 
                ? "#ef4444"  // Red when selected
                : `linear-gradient(135deg, ${G[500]}, ${G[700]})`, // Green gradient when not selected
              boxShadow: isSelected 
                ? "0 2px 8px rgba(239, 68, 68, 0.4)" 
                : `0 2px 8px ${G.glow}`,
              "&:hover": { 
                background: isSelected 
                  ? "#dc2626" 
                  : `linear-gradient(135deg, ${G[400]}, ${G[600]})` 
              },
            }}
          >
            {isSelected ? "✕ Remove from Selection" : "＋ Add to Selection"}
          </Button>
          <Button
            onClick={() => onCreate?.(dateStr)}
            variant="contained"
            size="small"
            disabled={!dateStr}
            sx={{
              fontWeight: 800, borderRadius: "8px",
              background: `linear-gradient(135deg, ${G[500]}, ${G[700]})`,
              boxShadow: `0 2px 8px ${G.glow}`,
              "&:hover": { background: `linear-gradient(135deg, ${G[400]}, ${G[600]})` },
            }}
          >
            + New Reservation
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

// ─── Booking Details Dialog ───────────────────────────────────────────────────
function BookingDetailsDialog({ open, booking, onClose, onEdit, onArchive, onDelete, onCancel, onApprove, onPrint, onDownload }) {
  if (!booking) return null;
  const r = booking.resources || {};
  const money = (n) => `₱${Number(n || 0).toLocaleString()}`;

  const DetailBlock = ({ label, value }) => (
    <Box>
      <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.07em", mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#111" }}>{value}</Typography>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: "16px", overflow: "hidden" } } }}>
      <DialogHeader icon="🗂️" title="Reservation Details" sub={`ID: ${booking.id ?? "—"}`} onClose={onClose} />

      <DialogContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "grid", gap: 1.5 }}>
          {/* Schedule */}
          <Paper variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.1, bgcolor: "rgba(0,0,0,0.02)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.45 }}>📅 Schedule</Typography>
            </Box>
            <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <DetailBlock label="Date" value={formatDateRange(booking)} />
              <DetailBlock label="Time" value={`${formatTime12h(booking.startTime)} – ${formatTime12h(booking.endTime)}`} />
              <DetailBlock label="Venue" value={booking.venue ?? "—"} />
              <Box>
                <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.07em", mb: 0.5 }}>Status</Typography>
                {(() => { const p = getStatusChipProps(getBookingStatus(booking)); return <Chip size="small" label={p.label} color={p.color} variant={p.variant} sx={{ fontWeight: 800 }} />; })()}
              </Box>
            </Box>
          </Paper>

          {/* Event */}
          <Paper variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden" }}>
            <Box sx={{ px: 2, py: 1.1, bgcolor: "rgba(0,0,0,0.02)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <Typography sx={{ fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.45 }}>🎉 Event</Typography>
            </Box>
            <Box sx={{ p: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <DetailBlock label="Event Name" value={booking.eventName ?? "—"} />
              <DetailBlock label="Requested By" value={booking.requestedBy ?? "—"} />
              <DetailBlock label="Duration" value={booking.durationHours ? `${booking.durationHours} hrs` : "—"} />
              <DetailBlock label="Event Type" value={booking.eventTypeId ?? "Others"} />
            </Box>
          </Paper>

          {/* Resources + Amount */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr auto" }, gap: 1.5 }}>
            <Paper variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden" }}>
              <Box sx={{ px: 2, py: 1.1, bgcolor: "rgba(0,0,0,0.02)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.45 }}>🔧 Resources</Typography>
              </Box>
              <Box sx={{ p: 1.75 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 1.25 }}>
                  {[["🪑 Chairs", r.chairs ?? 0], ["🪞 Tables", r.tables ?? 0]].map(([lbl, val]) => (
                    <Box key={lbl} sx={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: "10px", px: 1.5, py: 1 }}>
                      <Typography sx={{ fontSize: "0.68rem", opacity: 0.45, fontWeight: 600 }}>{lbl}</Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: "1.5rem", lineHeight: 1, color: G[700] }}>{val}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {[["Aircon", r.aircon], ["Lights", r.lights], ["Sounds", r.sounds], ["LED", r.led]].map(([lbl, val]) => (
                    <Chip key={lbl} size="small" label={`${lbl}: ${val ? "✓" : "✗"}`}
                      sx={{ fontWeight: 700, fontSize: "0.7rem", bgcolor: val ? G[100] : undefined, color: val ? G[700] : undefined, border: val ? `1px solid ${G.border}` : undefined }} />
                  ))}
                </Box>
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden", minWidth: 150 }}>
              <Box sx={{ px: 2, py: 1.1, bgcolor: "rgba(0,0,0,0.02)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <Typography sx={{ fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.45 }}>💰 Amount</Typography>
              </Box>
              <Box sx={{ p: 1.75, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box sx={{ textAlign: "center", p: 2, border: `1px solid ${G.border}`, borderRadius: "10px", bgcolor: G[100], width: "100%" }}>
                  <Typography sx={{ fontSize: "0.62rem", fontWeight: 700, opacity: 0.4, textTransform: "uppercase", letterSpacing: "0.07em" }}>Total</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: "1.75rem", color: G[700], lineHeight: 1.1 }}>{money(booking.amount)}</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", opacity: 0.35 }}>
            <Typography sx={{ fontSize: "0.65rem" }}>Created: {booking.createdAt ? dayjs(booking.createdAt).format("MMM D, YYYY h:mm A") : "—"}</Typography>
            <Typography sx={{ fontSize: "0.65rem" }}>Updated: {booking.updatedAt ? dayjs(booking.updatedAt).format("MMM D, YYYY h:mm A") : "—"}</Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 2, borderTop: "1px solid rgba(0,0,0,0.06)", flexDirection: "column", alignItems: "stretch", gap: 1 }}>
        {(() => {
          const st = getBookingStatus(booking);
          const canEdit    = !(st === STATUS.CANCELED || st === STATUS.ARCHIVED || isBookingPast(booking));
          const canApprove = st === STATUS.SUBMITTED;
          const canCancel  = !(st === STATUS.CANCELED || st === STATUS.ARCHIVED || isBookingPast(booking));
          const canPermit  = st === STATUS.APPROVED;
          const showDelete = !!booking?.archived;
          return (
            <Box>
              {/* Single row with all buttons that wrap naturally */}
              <Stack 
                direction="row" 
                spacing={1} 
                sx={{ 
                  mb: 1, 
                  flexWrap: "wrap", 
                  gap: 1,
                  alignItems: "center"
                }}
              >
                {/* SOA Button Group */}
                <ButtonGroup size="small" variant="outlined">
                  <Button startIcon={<PrintIcon />} onClick={() => onPrint?.(booking, "soa")}>SOA</Button>
                  <Button startIcon={<DownloadIcon />} onClick={() => onDownload?.(booking, "soa")}>Download</Button>
                </ButtonGroup>

                {/* PERMIT Button Group */}
                <ButtonGroup size="small" variant="outlined">
                  <Button startIcon={<PrintIcon />} disabled={!canPermit} onClick={() => onPrint?.(booking, "permit")}>Permit</Button>
                  <Button startIcon={<DownloadIcon />} disabled={!canPermit} onClick={() => onDownload?.(booking, "permit")}>Download</Button>
                </ButtonGroup>
                
                {/* Approve Button */}
                {canApprove && (
                  <Button size="small" variant="contained" color="success"
                    sx={{ fontWeight: 800, borderRadius: "8px", animation: "schedGlow 2s ease infinite" }}
                    onClick={() => onApprove?.(booking)}>
                    ✓ Approve
                  </Button>
                )}
                
                {/* Edit Button */}
                {canEdit && (
                  <Button size="small" variant="outlined" startIcon={<EditIcon />} 
                    onClick={() => onEdit?.(booking)} 
                    sx={{ borderRadius: "8px" }}>
                    Edit
                  </Button>
                )}
                
                {/* Archive Button */}
                <Button size="small" variant="outlined" startIcon={<ArchiveIcon />} 
                  onClick={() => onArchive?.(booking)} 
                  sx={{ borderRadius: "8px" }}>
                  Archive
                </Button>
                
                {/* Cancel Button */}
                {canCancel && (
                  <Button size="small" variant="outlined" color="error" startIcon={<CloseIcon />} 
                    onClick={() => onCancel?.(booking)} 
                    sx={{ borderRadius: "8px" }}>
                    Cancel
                  </Button>
                )}
                
                {/* Delete Button */}
                {showDelete && (
                  <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} 
                    onClick={() => onDelete?.(booking)} 
                    sx={{ borderRadius: "8px" }}>
                    Delete
                  </Button>
                )}
              </Stack>
              
              {/* Close Button */}
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={onClose} variant="contained" size="small"
                  sx={{ fontWeight: 900, borderRadius: "8px", background: `linear-gradient(135deg, ${G[500]}, ${G[700]})`, boxShadow: `0 2px 8px ${G.glow}` }}>
                  Close
                </Button>
              </Box>
            </Box>
          );
        })()}
      </DialogActions>
    </Dialog>
  );
}

// ─── Booking History Table ────────────────────────────────────────────────────
function BookingHistory({ loading, rows, onEdit, onDelete, onArchive, onPrint, onDownload, onRowClick, search, setSearch, venueFilter, setVenueFilter, statusFilter, setStatusFilter, sortOrder, setSortOrder, venues, historyDate, setHistoryDate }) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  React.useEffect(() => { setPage(0); }, [search, venueFilter, statusFilter, sortOrder, historyDate, rows?.length]);
  const total = Array.isArray(rows) ? rows.length : 0;
  const pagedRows = React.useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];
    return list.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  // Count by status for stat pills
  const counts = React.useMemo(() => {
    const all = Array.isArray(rows) ? rows : [];
    return {
      submitted: all.filter((b) => getBookingStatus(b) === STATUS.SUBMITTED).length,
      approved:  all.filter((b) => getBookingStatus(b) === STATUS.APPROVED).length,
      canceled:  all.filter((b) => getBookingStatus(b) === STATUS.CANCELED).length,
    };
  }, [rows]);

  return (
    <Box className="sched-card sched-section" sx={{ ...CARD }}>
      {/* Header */}
      <CardHeader
        icon={<TableChartIcon sx={{ fontSize: "1rem" }} />}
        label="Reservation History"
        sub="Click a row to view full details"
        accent
        right={
          loading ? <CircularProgress size={16} sx={{ color: G[500] }} /> : (
            <Chip size="small" label={`${total} record${total !== 1 ? "s" : ""}`}
              sx={{ fontWeight: 800, fontSize: "0.7rem", bgcolor: G[100], color: G[700], border: `1px solid ${G.border}` }} />
          )
        }
      />

      {/* Status stat row */}
      <Box sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 1.25, flexWrap: "wrap" }}>
        <StatPill label="Pending"  value={counts.submitted} color="#0284c7" />
        <StatPill label="Approved" value={counts.approved}  color={G[600]} />
        <StatPill label="Canceled" value={counts.canceled}  color="#ef4444" />
      </Box>

      {/* Filters */}
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(249,250,249,0.6)" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 1.25, "& > *": { minWidth: 0 } }}>
          <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / span 5" } }}>
            <TextField size="small" label="🔍 Search" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth />
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", md: "6 / span 4" } }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker label="Filter by date" value={historyDate} onChange={(v) => setHistoryDate(v)}
                slotProps={{ textField: { size: "small", fullWidth: true, sx: { minWidth: 0 } } }} />
            </LocalizationProvider>
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", md: "10 / span 3" } }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value={STATUS.SUBMITTED}>Submitted</MenuItem>
                <MenuItem value={STATUS.APPROVED}>Approved</MenuItem>
                <MenuItem value={STATUS.CANCELED}>Canceled</MenuItem>
                <MenuItem value={STATUS.ARCHIVED}>Archived</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "1 / span 6", md: "1 / span 6" } }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Venue</InputLabel>
              <Select label="Venue" value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)}>
                <MenuItem value="ALL">All Venues</MenuItem>
                {venues.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "7 / span 6", md: "7 / span 6" } }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Sort</InputLabel>
              <Select label="Sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <MenuItem value="NEWEST">⬇ Newest first</MenuItem>
                <MenuItem value="OLDEST">⬆ Oldest first</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {["Date", "Time", "Event", "Requested By", "Amount", "Actions"].map((h, i) => (
                <TableCell key={h} align={i >= 4 ? "right" : "left"}
                  sx={{ fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.07em", opacity: 0.45, bgcolor: "rgba(249,250,249,1)", ...(i === 5 ? { width: 160 } : {}) }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(!pagedRows || pagedRows.length === 0) ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "2.5rem", mb: 1 }}>{loading ? "⏳" : "📭"}</Typography>
                    <Typography sx={{ fontWeight: 800, opacity: 0.6 }}>{loading ? "Loading..." : "No reservations found"}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.4 }}>{loading ? "Please wait." : "Try adjusting filters."}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              pagedRows.map((b) => (
                <TableRow
                  key={b.id ?? `${b.date}-${b.startTime}-${b.requestedBy}`}
                  className="sched-row"
                  hover
                  onClick={() => onRowClick?.(b)}
                  sx={{
                    cursor: "pointer",
                    borderLeft: `3px solid transparent`,
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderLeft: `3px solid ${STATUS_COLORS[getBookingStatus(b)] ?? G[500]}`,
                    },
                  }}
                >
                  <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 700, fontSize: "0.83rem" }}>{formatDateRange(b)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Chip size="small" label={`${formatTime12h(b.startTime)} – ${formatTime12h(b.endTime)}`} variant="outlined" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.85rem" }}>{b.eventName}</Typography>
                      {(() => { const p = getStatusChipProps(getBookingStatus(b)); return <Chip size="small" label={p.label} color={p.color} variant={p.variant} sx={{ fontWeight: 800, fontSize: "0.62rem" }} />; })()}
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.45, fontSize: "0.72rem" }}>{b.venue}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.85rem", fontWeight: 600 }}>{b.requestedBy}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, fontSize: "0.9rem", color: G[700] }}>₱{Number(b.amount ?? 0).toLocaleString()}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Print"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onPrint?.(b); }}><PrintIcon sx={{ fontSize: "0.85rem" }} /></IconButton></Tooltip>
                    <Tooltip title="Download"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onDownload?.(b); }}><DownloadIcon sx={{ fontSize: "0.85rem" }} /></IconButton></Tooltip>
                    {(() => {
                      const st = getBookingStatus(b);
                      if (st === STATUS.CANCELED || st === STATUS.ARCHIVED || isBookingPast(b)) return null;
                      return <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit?.(b); }}><EditIcon sx={{ fontSize: "0.85rem" }} /></IconButton></Tooltip>;
                    })()}
                    <Tooltip title={b.archived ? "Unarchive" : "Archive"}>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onArchive?.(b); }} color={b.archived ? "success" : "default"}><ArchiveIcon sx={{ fontSize: "0.85rem" }} /></IconButton>
                    </Tooltip>
                    {b.archived && (
                      <Tooltip title="Delete"><IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete?.(b); }}><DeleteIcon sx={{ fontSize: "0.85rem" }} /></IconButton></Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div" count={total} page={page}
        onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 20, 50]}
        sx={{ ".MuiTablePagination-toolbar": { px: 2 } }}
      />
    </Box>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, title, icon, children, confirmLabel = "Confirm", confirmColor = "primary" }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: "16px", overflow: "hidden" } } }}>
      <DialogHeader icon={icon} title={title} onClose={onClose} />
      <DialogContent sx={{ px: 2.5, py: 2 }}>{children}</DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.75, gap: 1 }}>
        <Button onClick={onClose} sx={{ borderRadius: "8px" }}>Cancel</Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" sx={{ fontWeight: 800, borderRadius: "8px" }}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const [selectedDates, setSelectedDates] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [calendarView, setCalendarView] = React.useState("day");
  const [calendarMonth, setCalendarMonth] = React.useState(dayjs());
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [bookings, setBookings] = React.useState([]);

  const bookingDates = React.useCallback((b) =>
    Array.isArray(b?.dates) && b.dates.length ? b.dates : (b?.date ? [b.date] : []), []);

  const reservedByDate = React.useMemo(() => {
    const map = new Map();
    for (const b of (bookings || [])) {
      if (!b) continue;
      for (const d of bookingDates(b)) {
        if (!d) continue;
        if (!map.has(d)) map.set(d, []);
        map.get(d).push(b);
      }
    }
    return map;
  }, [bookings, bookingDates]);

  const [search, setSearch] = React.useState("");
  const [venueFilter, setVenueFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [sortOrder, setSortOrder] = React.useState("NEWEST");
  const [historyDate, setHistoryDate] = React.useState(null);
  const [printOpen, setPrintOpen] = React.useState(false);
  const [printBooking, setPrintBooking] = React.useState(null);
  const [printMode, setPrintMode] = React.useState("print");
  const [printDocType, setPrintDocType] = React.useState("permit");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteDialogBooking, setDeleteDialogBooking] = React.useState(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = React.useState(false);
  const [archiveDialogBooking, setArchiveDialogBooking] = React.useState(null);
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [cancelDialogBooking, setCancelDialogBooking] = React.useState(null);
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [approveDialogBooking, setApproveDialogBooking] = React.useState(null);
  const [editingBooking, setEditingBooking] = React.useState(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsBooking, setDetailsBooking] = React.useState(null);
  const [dayDialogOpen, setDayDialogOpen] = React.useState(false);
  const [dayDialogDate, setDayDialogDate] = React.useState(null);
  const [dayDialogBookings, setDayDialogBookings] = React.useState([]);

  const filteredBookings = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = Array.isArray(bookings) ? [...bookings] : [];
    if (statusFilter !== "ALL") list = list.filter((b) => getBookingStatus(b) === statusFilter);
    if (venueFilter !== "ALL") list = list.filter((b) => b.venue === venueFilter);
    if (historyDate) { const t = dayjs(historyDate).format("YYYY-MM-DD"); list = list.filter((b) => bookingDates(b).includes(t)); }
    if (q) list = list.filter((b) => [b.eventName, b.requestedBy, b.venue, b.date, b.startTime, b.endTime].filter(Boolean).join(" ").toLowerCase().includes(q));
    list.sort((a, b) => { const ak = a.updatedAt || a.createdAt || ""; const bk = b.updatedAt || b.createdAt || ""; return sortOrder === "OLDEST" ? ak.localeCompare(bk) : bk.localeCompare(ak); });
    return list;
  }, [bookings, search, venueFilter, statusFilter, sortOrder, historyDate, bookingDates]);

  const loadBookings = React.useCallback(async () => {
    try { setHistoryLoading(true); const res = await axios.get(`${API}/bookings`); setBookings(Array.isArray(res.data) ? res.data : (res.data?.items ?? [])); }
    catch (err) { console.error(err); } finally { setHistoryLoading(false); }
  }, []);

  React.useEffect(() => { loadBookings(); }, [loadBookings]);

  React.useEffect(() => {
    if (!detailsBooking?.id) return;
    const fresh = (bookings || []).find((x) => x?.id === detailsBooking.id);
    if (fresh) setDetailsBooking(fresh);
  }, [bookings, detailsBooking?.id]);

  const handleReservedDayClick = React.useCallback((list, dateStr) => {
    if (!(Array.isArray(list) && list.length)) return;
    setDayDialogDate(dateStr); setDayDialogBookings(list); setDayDialogOpen(true);
  }, []);

  const handleEditBooking = (b) => {
    if (!b) return;
    const st = getBookingStatus(b);
    if (st === STATUS.CANCELED || st === STATUS.ARCHIVED || isBookingPast(b)) return;
    setEditingBooking(b); setSelectedDates([dayjs(b.date)]); setOpen(true);
  };

  const handleDeleteBooking  = (b) => { if (!b?.id || !b.archived) return; setDeleteDialogBooking(b); setDeleteDialogOpen(true); };
  const handleArchiveBooking = (b) => { if (!b?.id) return; setArchiveDialogBooking(b); setArchiveDialogOpen(true); };
  const handleApproveBooking = (b) => { if (!b?.id || getBookingStatus(b) !== STATUS.SUBMITTED) return; setApproveDialogBooking(b); setApproveDialogOpen(true); };
  const handleCancelBooking  = (b) => { if (!b?.id || isBookingPast(b) || getBookingStatus(b) === STATUS.CANCELED) return; setCancelDialogBooking(b); setCancelDialogOpen(true); };

  const openPrint    = (b, t) => { setPrintDocType(t || "soa"); setPrintMode("print");    setPrintBooking(b); setPrintOpen(true); };
  const openDownload = (b, t) => { setPrintDocType(t || "soa"); setPrintMode("download"); setPrintBooking(b); setPrintOpen(true); };

  const handleConfirmDelete = async () => {
    if (!deleteDialogBooking?.id) return;
    try {
      await axios.delete(`${API}/bookings/${deleteDialogBooking.id}`);
      setBookings((prev) => prev.filter((x) => x.id !== deleteDialogBooking.id));
      if (detailsBooking?.id === deleteDialogBooking.id) { setDetailsOpen(false); setDetailsBooking(null); }
      setDeleteDialogOpen(false); setDeleteDialogBooking(null);
    } catch (err) { console.error(err); alert("Failed to delete."); }
  };

  const handleConfirmArchive = async () => {
    if (!archiveDialogBooking?.id) return;
    try {
      const res = await axios.patch(`${API}/bookings/${archiveDialogBooking.id}/archive`);
      setBookings((prev) => prev.map((x) => (x.id === res.data.id ? res.data : x)));
      setArchiveDialogOpen(false); setArchiveDialogBooking(null);
    } catch (err) { console.error(err); alert("Failed to archive."); }
  };

  const handleConfirmApprove = async () => {
    if (!approveDialogBooking?.id) return;
    try {
      const res = await axios.patch(`${API}/bookings/${approveDialogBooking.id}/approve`);
      setBookings((prev) => prev.map((x) => (x.id === res.data.id ? res.data : x)));
      if (detailsBooking?.id === res.data.id) setDetailsBooking(res.data);
      setApproveDialogOpen(false); setApproveDialogBooking(null);
    } catch (err) { console.error(err); alert("Failed to approve."); }
  };

  const handleConfirmCancel = async () => {
    if (!cancelDialogBooking?.id) return;
    try {
      const res = await axios.patch(`${API}/bookings/${cancelDialogBooking.id}/cancel`);
      setBookings((prev) => prev.map((x) => (x.id === res.data.id ? res.data : x)));
      if (detailsBooking?.id === res.data.id) setDetailsBooking(res.data);
      setCancelDialogOpen(false); setCancelDialogBooking(null);
    } catch (err) { console.error(err); alert("Failed to cancel."); }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <Topbar title="Municipality of Noveleta" />

      <Box
        className="sched-root"
        sx={{
          minHeight: "calc(100vh - 64px)",
          bgcolor: "#f3f9f5",
          backgroundImage: "radial-gradient(circle at 15% 0%, rgba(34,197,94,0.06) 0%, transparent 55%), radial-gradient(circle at 85% 100%, rgba(22,163,74,0.04) 0%, transparent 50%)",
        }}
      >
        <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: "1fr", alignItems: "start" }}>

            <CalendarSection
              calendarView={calendarView}
              selectedDates={selectedDates}
              onToggleDate={(d) => {
                if (!d) return;
                setSelectedDates((prev) => {
                  const list = Array.isArray(prev) ? prev : [];
                  const exists = list.some((x) => x && x.isSame(d, "day"));
                  return exists ? list.filter((x) => !x.isSame(d, "day")) : [...list, d].sort((a, b) => a.valueOf() - b.valueOf());
                });
              }}
              onViewChange={(v) => setCalendarView(v)}
              calendarMonth={calendarMonth}
              onMonthChange={(m) => setCalendarMonth(m)}
              reservedByDate={reservedByDate}
              onReservedDayClick={handleReservedDayClick}
              headerActions={
                <>
                  <Button
                    variant="outlined" size="small"
                    onClick={() => { setSelectedDates([]); setCalendarMonth(dayjs()); }}
                    sx={{ fontWeight: 800, borderRadius: "8px", fontSize: "0.78rem", borderColor: G.border, color: G[700], "&:hover": { borderColor: G[500], bgcolor: G[100] }, transition: "all 0.2s" }}
                  >
                    Clear
                  </Button>
                  <Button
                    className="sched-btn-primary"
                    variant="contained"
                    size="small"
                    disabled={!selectedDates.length}
                    onClick={() => { setEditingBooking(null); setOpen(true); }}
                    sx={{
                      fontWeight: 800, borderRadius: "8px", fontSize: "0.78rem",
                      background: selectedDates.length ? `linear-gradient(135deg, ${G[500]}, ${G[700]})` : undefined,
                      boxShadow: selectedDates.length ? `0 3px 12px ${G.glow}` : undefined,
                      "&:hover": { background: `linear-gradient(135deg, ${G[400]}, ${G[600]})` },
                      "&:disabled": { opacity: 0.45 },
                      transition: "all 0.2s ease",
                    }}
                  >
                    + Reserve ({selectedDates.length})
                  </Button>
                </>
              }
            />

            <BookingHistory
              loading={historyLoading}
              rows={filteredBookings}
              onEdit={handleEditBooking}
              onDelete={handleDeleteBooking}
              onArchive={handleArchiveBooking}
              onPrint={openPrint}
              onDownload={openDownload}
              onRowClick={(b) => { setDetailsBooking(b); setDetailsOpen(true); }}
              search={search} setSearch={setSearch}
              venueFilter={venueFilter} setVenueFilter={setVenueFilter}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              sortOrder={sortOrder} setSortOrder={setSortOrder}
              venues={VENUES} historyDate={historyDate} setHistoryDate={setHistoryDate}
            />
          </Box>
        </Container>
      </Box>

      {/* Booking drawer */}
      <BookingDrawer
        open={open}
        onClose={() => { setOpen(false); setEditingBooking(null); }}
        selectedDates={selectedDates}
        initialBooking={editingBooking}
        existingBookings={bookings}
        onBooked={(created) => {
          setBookings((prev) => {
            if (created?.id && prev.some((x) => x.id === created.id)) return prev.map((x) => (x.id === created.id ? created : x));
            return [created, ...prev];
          });
          setSelectedDates([]);
          const fd = created?.dates?.[0] || created?.date;
          if (fd) setCalendarMonth(dayjs(fd));
          setPrintMode("print"); setPrintBooking(created); setPrintOpen(true);
        }}
      />

      {/* Day bookings dialog */}
      <DayBookingsDialog
        open={dayDialogOpen}
        dateStr={dayDialogDate}
        bookings={dayDialogBookings}
        isSelected={
          dayDialogDate
            ? selectedDates.some((x) => x && x.isSame(dayjs(dayDialogDate), "day"))
            : false
        }
        onClose={() => { setDayDialogOpen(false); setDayDialogDate(null); setDayDialogBookings([]); }}
        onPick={(b) => { setDayDialogOpen(false); setDetailsBooking(b); setDetailsOpen(true); }}
        onAddToSelection={(dateStr) => {
          if (!dateStr) return;
          const d = dayjs(dateStr);
          setSelectedDates((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const exists = list.some((x) => x && x.isSame(d, "day"));
            return exists
              ? list.filter((x) => !x.isSame(d, "day"))
              : [...list, d].sort((a, b) => a.valueOf() - b.valueOf());
          });
          setCalendarMonth(d);
          setCalendarView("day");
          setDayDialogOpen(false);
          setDayDialogDate(null);
          setDayDialogBookings([]);
        }}
        onCreate={(dateStr) => {
          if (!dateStr) return;
          const d = dayjs(dateStr);
          setDayDialogOpen(false);
          setDayDialogDate(null);
          setDayDialogBookings([]);
          setEditingBooking(null);
          setSelectedDates((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const exists = list.some((x) => x && x.isSame(d, "day"));
            return exists ? list : [...list, d].sort((a, b) => a.valueOf() - b.valueOf());
          });
          setCalendarMonth(d);
          setOpen(true);
        }}
      />

      {/* Details dialog */}
      <BookingDetailsDialog
        open={detailsOpen} booking={detailsBooking}
        onClose={() => { setDetailsOpen(false); setDetailsBooking(null); }}
        onEdit={(b) => { setDetailsOpen(false); setDetailsBooking(null); handleEditBooking(b); }}
        onArchive={handleArchiveBooking}
        onDelete={handleDeleteBooking}
        onCancel={handleCancelBooking}
        onApprove={handleApproveBooking}
        onPrint={openPrint}
        onDownload={openDownload}
      />

      {/* Approve dialog */}
      <ConfirmDialog
        open={approveDialogOpen} icon="✅" title="Approve Reservation"
        onClose={() => { setApproveDialogOpen(false); setApproveDialogBooking(null); }}
        onConfirm={handleConfirmApprove} confirmLabel="Confirm Approve" confirmColor="success"
      >
        <Typography sx={{ mb: 2 }}>Mark as <b>PAID</b> and set status to <b>APPROVED</b>?</Typography>
        {approveDialogBooking && (
          <Box sx={{ p: 1.75, bgcolor: G[100], borderRadius: "10px", border: `1px solid ${G.border}`, mb: 1.5 }}>
            <Typography variant="body2" component="div" sx={{ lineHeight: 2 }}>
              <strong>Event:</strong> {approveDialogBooking.eventName}<br />
              <strong>By:</strong> {approveDialogBooking.requestedBy}<br />
              <strong>Date:</strong> {formatDateRange(approveDialogBooking)}<br />
              <strong>Amount:</strong> ₱{Number(approveDialogBooking.amount ?? 0).toLocaleString()}
            </Typography>
          </Box>
        )}
        <Typography sx={{ color: G[600], fontWeight: 700, fontSize: "0.85rem" }}>After approving, the Venue Permit can be printed.</Typography>
      </ConfirmDialog>

      {/* Cancel dialog */}
      <ConfirmDialog
        open={cancelDialogOpen} icon="❌" title="Cancel Reservation"
        onClose={() => { setCancelDialogOpen(false); setCancelDialogBooking(null); }}
        onConfirm={handleConfirmCancel} confirmLabel="Confirm Cancel" confirmColor="error"
      >
        <Typography sx={{ mb: 2 }}>Are you sure you want to cancel this reservation?</Typography>
        {cancelDialogBooking && (
          <Box sx={{ p: 1.75, bgcolor: "rgba(239,68,68,0.06)", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.18)", mb: 1.5 }}>
            <Typography variant="body2" component="div" sx={{ lineHeight: 2 }}>
              <strong>Event:</strong> {cancelDialogBooking.eventName}<br />
              <strong>By:</strong> {cancelDialogBooking.requestedBy}<br />
              <strong>Date:</strong> {formatDateRange(cancelDialogBooking)}
            </Typography>
          </Box>
        )}
        <Typography sx={{ color: "error.main", fontWeight: 700, fontSize: "0.85rem" }}>This will mark the reservation as CANCELED.</Typography>
      </ConfirmDialog>

      {/* Delete dialog */}
      <ConfirmDialog
        open={deleteDialogOpen} icon="🗑️" title="Delete Reservation"
        onClose={() => { setDeleteDialogOpen(false); setDeleteDialogBooking(null); }}
        onConfirm={handleConfirmDelete} confirmLabel="Delete" confirmColor="error"
      >
        <Typography sx={{ mb: 2 }}>Permanently delete this reservation?</Typography>
        {deleteDialogBooking && (
          <Box sx={{ p: 1.75, bgcolor: "rgba(239,68,68,0.06)", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.18)", mb: 1.5 }}>
            <Typography variant="body2" component="div" sx={{ lineHeight: 2 }}>
              <strong>Event:</strong> {deleteDialogBooking.eventName}<br />
              <strong>By:</strong> {deleteDialogBooking.requestedBy}<br />
              <strong>Date:</strong> {formatDateRange(deleteDialogBooking)}
            </Typography>
          </Box>
        )}
        <Typography sx={{ color: "error.main", fontWeight: 700, fontSize: "0.85rem" }}>⚠️ This action cannot be undone.</Typography>
      </ConfirmDialog>

      {/* Archive dialog */}
      <ConfirmDialog
        open={archiveDialogOpen}
        icon={archiveDialogBooking?.archived ? "📤" : "📦"}
        title={archiveDialogBooking?.archived ? "Unarchive Reservation" : "Archive Reservation"}
        onClose={() => { setArchiveDialogOpen(false); setArchiveDialogBooking(null); }}
        onConfirm={handleConfirmArchive}
        confirmLabel={archiveDialogBooking?.archived ? "Unarchive" : "Archive"}
        confirmColor="warning"
      >
        <Typography sx={{ mb: 2 }}>Are you sure you want to {archiveDialogBooking?.archived ? "unarchive" : "archive"} this reservation?</Typography>
        {archiveDialogBooking && (
          <Box sx={{ p: 1.75, bgcolor: "rgba(245,158,11,0.06)", borderRadius: "10px", border: "1px solid rgba(245,158,11,0.2)", mb: 1.5 }}>
            <Typography variant="body2" component="div" sx={{ lineHeight: 2 }}>
              <strong>Event:</strong> {archiveDialogBooking.eventName}<br />
              <strong>By:</strong> {archiveDialogBooking.requestedBy}<br />
              <strong>Date:</strong> {formatDateRange(archiveDialogBooking)}
            </Typography>
          </Box>
        )}
        <Typography sx={{ color: "warning.main", fontWeight: 700, fontSize: "0.85rem" }}>
          {archiveDialogBooking?.archived ? "It will reappear in the active list." : "Use the status filter to view archived records."}
        </Typography>
      </ConfirmDialog>

      {/* Print */}
      <PrintDialog
        open={printOpen} booking={printBooking} docType={printDocType}
        mode={printMode} autoPrint={printMode === "print"} autoDownload={printMode === "download"}
        onClose={() => { setPrintOpen(false); setPrintBooking(null); }}
      />
    </>
  );
}