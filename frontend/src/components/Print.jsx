// frontend/src/components/Print.jsx
import React from "react";
import dayjs from "dayjs";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material";

import Logo from "@/assets/test.png";

// ---- helpers ----
function yesNo(v) {
  return v ? "Yes" : "No";
}

function formatDateDisplay(booking) {
  const dates =
    Array.isArray(booking?.dates) && booking.dates.length
      ? booking.dates
      : booking?.date
      ? [booking.date]
      : [];

  if (!dates.length) return "—";

  const formatted = dates
    .filter(Boolean)
    .map((d) => dayjs(d).format("MMMM D, YYYY").toUpperCase());

  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]} & ${formatted[1]}`;
  return formatted.join(", ");
}

function formatTimeDisplay(booking) {
  const s = booking?.startTime ?? "—";
  const e = booking?.endTime ?? "—";

  const to12 = (t) => {
    if (!t || t === "—") return "—";
    const d = dayjs(`2000-01-01T${t}`);
    return d.isValid() ? d.format("h:mm A") : t;
  };

  return `${to12(s)} – ${to12(e)}`;
}

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <Typography sx={{ width: 160, fontWeight: 800 }}>{label}</Typography>
      <Typography sx={{ width: 16, fontWeight: 800 }}>:</Typography>
      <Typography sx={{ fontWeight: 600, flex: 1 }}>{value ?? "—"}</Typography>
    </Box>
  );
}

function GovHeader() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "120px 1fr 120px",
        alignItems: "center",
        columnGap: 2,
        mb: 1,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <img
          src={Logo}
          alt="Logo"
          style={{ width: 90, height: 90, objectFit: "contain" }}
        />
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Typography sx={{ fontSize: 16 }}>Republic of the Philippines</Typography>
        <Typography sx={{ fontSize: 16 }}>Province of Cavite</Typography>
        <Typography sx={{ fontSize: 16, mb: 1 }}>Municipality of Noveleta</Typography>

        <Typography sx={{ fontSize: 18, fontWeight: 900, letterSpacing: 0.5 }}>
          GENERAL SERVICES OFFICE
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <img
          src={Logo}
          alt="Logo"
          style={{ width: 90, height: 90, objectFit: "contain" }}
        />
      </Box>
    </Box>
  );
}

function ApprovalBlock() {
  return (
    <Box sx={{ mt: 4, textAlign: "center" }}>
      <Typography sx={{ fontWeight: 800, mb: 2 }}>Approved by:</Typography>
      <Typography sx={{ fontWeight: 900, mt: 2 }}>Engr. Maria Santos</Typography>
      <Typography sx={{ fontWeight: 700 }}>GSO Head</Typography>
    </Box>
  );
}

// ✅ ONE PAPER: Permit (with its own header + approval) then SOA (with its own header + approval)
const CombinedPermitAndSOA = React.forwardRef(function CombinedPermitAndSOA(
  { booking },
  ref
) {
  if (!booking) return null;

  const r = booking.resources || {};
  const venueTitle = booking?.venue ? `${booking.venue} Permit` : "Permit";

  const donationAmount = Number(booking?.donation || 0);
  const donated =
    donationAmount > 0
      ? `Yes (₱${donationAmount.toLocaleString()})`
      : "No";

  const amountNum = Number(booking?.finalAmount ?? booking?.amount ?? 0);
  const amountText = amountNum > 0 ? `₱${amountNum.toLocaleString()}` : "—";

  return (
    <Box ref={ref} sx={{ p: 3, fontFamily: "Arial, sans-serif", color: "#111" }}>
      <style>
        {`
          @page { size: A4 landscape; margin: 14mm; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `}
      </style>

      {/* ===================== PERMIT SECTION ===================== */}
      <GovHeader />

      <Typography
        sx={{
          textAlign: "center",
          fontSize: 22,
          fontWeight: 900,
          mt: 2,
          mb: 3,
        }}
      >
        {venueTitle}
      </Typography>

      <Box sx={{ px: 4 }}>
        <InfoRow label="Requested by" value={booking.requestedBy ?? "—"} />
        <InfoRow label="Event Name" value={booking.eventName ?? "—"} />
        <InfoRow label="Date" value={formatDateDisplay(booking)} />
        <InfoRow label="Time" value={formatTimeDisplay(booking)} />
        <InfoRow label="Donated" value={donated} />

        <Box sx={{ height: 14 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 6,
            rowGap: 0.75,
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ width: 160, fontWeight: 800 }}>Chairs</Typography>
            <Typography sx={{ width: 16, fontWeight: 800 }}>:</Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {Number(r.chairs || 0) > 0 ? r.chairs : "No"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ width: 160, fontWeight: 800 }}>Tables</Typography>
            <Typography sx={{ width: 16, fontWeight: 800 }}>:</Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {Number(r.tables || 0) > 0 ? r.tables : "No"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ width: 160, fontWeight: 800 }}>Aircon</Typography>
            <Typography sx={{ width: 16, fontWeight: 800 }}>:</Typography>
            <Typography sx={{ fontWeight: 700 }}>{yesNo(!!r.aircon)}</Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ width: 160, fontWeight: 800 }}>Lights</Typography>
            <Typography sx={{ width: 16, fontWeight: 800 }}>:</Typography>
            <Typography sx={{ fontWeight: 700 }}>{yesNo(!!r.lights)}</Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ width: 160, fontWeight: 800 }}>Sounds</Typography>
            <Typography sx={{ width: 16, fontWeight: 800 }}>:</Typography>
            <Typography sx={{ fontWeight: 700 }}>{yesNo(!!r.sounds)}</Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ width: 160, fontWeight: 800 }}>LED</Typography>
            <Typography sx={{ width: 16, fontWeight: 800 }}>:</Typography>
            <Typography sx={{ fontWeight: 700 }}>{yesNo(!!r.led)}</Typography>
          </Box>
        </Box>

        {/* permit approval */}
        <ApprovalBlock />
      </Box>

      {/* separator space */}
      <Box sx={{ height: 28 }} />

      {/* ===================== SOA SECTION (BOTTOM OF SAME PAPER) ===================== */}
      <GovHeader />

      <Typography
        sx={{
          textAlign: "center",
          fontSize: 22,
          fontWeight: 900,
          mt: 2,
          mb: 3,
        }}
      >
        STATEMENT OF ACCOUNT
      </Typography>

      <Box sx={{ px: 4 }}>
        <InfoRow label="Requested by" value={booking.requestedBy ?? "—"} />
        <InfoRow label="Event Name" value={booking.eventName ?? "—"} />
        <InfoRow label="Date" value={formatDateDisplay(booking)} />
        <InfoRow label="Time" value={formatTimeDisplay(booking)} />
        <InfoRow label="Amount" value={amountText} />

        <Box sx={{ height: 14 }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 6,
            rowGap: 0.75,
          }}
        >
          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ width: 160, fontWeight: 800 }}>Chairs</Typography>
            <Typography sx={{ width: 16, fontWeight: 800 }}>:</Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {Number(r.chairs || 0) > 0 ? r.chairs : "No"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ width: 160, fontWeight: 800 }}>Tables</Typography>
            <Typography sx={{ width: 16, fontWeight: 800 }}>:</Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {Number(r.tables || 0) > 0 ? r.tables : "No"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ width: 160, fontWeight: 800 }}>Aircon</Typography>
            <Typography sx={{ width: 16, fontWeight: 800 }}>:</Typography>
            <Typography sx={{ fontWeight: 700 }}>{yesNo(!!r.aircon)}</Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ width: 160, fontWeight: 800 }}>Lights</Typography>
            <Typography sx={{ width: 16, fontWeight: 800 }}>:</Typography>
            <Typography sx={{ fontWeight: 700 }}>{yesNo(!!r.lights)}</Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ width: 160, fontWeight: 800 }}>Sounds</Typography>
            <Typography sx={{ width: 16, fontWeight: 800 }}>:</Typography>
            <Typography sx={{ fontWeight: 700 }}>{yesNo(!!r.sounds)}</Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Typography sx={{ width: 160, fontWeight: 800 }}>LED</Typography>
            <Typography sx={{ width: 16, fontWeight: 800 }}>:</Typography>
            <Typography sx={{ fontWeight: 700 }}>{yesNo(!!r.led)}</Typography>
          </Box>
        </Box>

        {/* soa approval */}
        <ApprovalBlock />
      </Box>
    </Box>
  );
});

// ---- dialog ----
export default function PrintDialog({
  open,
  booking,
  onClose,
  autoPrint = false,
  autoDownload = false,
  // keep docType param if your SchedulePage still passes it, but we won't use it now
  docType = "permit",
}) {
  const printRef = React.useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: booking?.venue ? `${booking.venue}-permit-soa` : "permit-soa",
    onBeforePrint: async () => {
      await new Promise((r) => setTimeout(r, 150));
    },
  });

  const handleDownload = React.useCallback(async () => {
    if (!printRef.current || !booking) return;

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const pxToMm = (px) => px * 0.264583;

    const imgW = pxToMm(canvas.width);
    const imgH = pxToMm(canvas.height);

    const scale = Math.min(pageW / imgW, pageH / imgH);
    const w = imgW * scale;
    const h = imgH * scale;

    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;

    pdf.addImage(imgData, "PNG", x, y, w, h, undefined, "FAST");

    const filename = booking?.venue
      ? `${booking.venue}-permit-soa.pdf`
      : "permit-soa.pdf";

    pdf.save(filename);
  }, [booking]);

  React.useEffect(() => {
    if (!open || !autoPrint) return;
    if (!booking) return;

    const t = setTimeout(() => {
      if (printRef.current) handlePrint?.();
    }, 300);

    return () => clearTimeout(t);
  }, [open, autoPrint, booking, handlePrint]);

  React.useEffect(() => {
    if (!open || !autoDownload) return;
    if (!booking) return;

    const t = setTimeout(() => {
      if (printRef.current) handleDownload?.();
    }, 300);

    return () => clearTimeout(t);
  }, [open, autoDownload, booking, handleDownload]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>
        Print Permit + Statement of Account
      </DialogTitle>

      <DialogContent dividers>
        <Box ref={printRef}>
          <CombinedPermitAndSOA booking={booking} />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>

        <Button
          variant="outlined"
          sx={{ fontWeight: 900 }}
          onClick={() => {
            if (!printRef.current) return;
            handleDownload?.();
          }}
        >
          Download PDF
        </Button>

        <Button
          variant="contained"
          sx={{ fontWeight: 900 }}
          onClick={() => {
            if (!printRef.current) return;
            handlePrint?.();
          }}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}