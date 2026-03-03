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

import LeftLogo from "@/assets/test.png";
import RightLogo from "@/assets/GSO.png";

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
  if (dates.length === 1) return dayjs(dates[0]).format("MMMM D, YYYY").toUpperCase();

  const parsed = dates.map((d) => dayjs(d)).filter((d) => d.isValid());
  if (!parsed.length) return "—";

  // group by month-year
  const grouped = {};
  for (const d of parsed) {
    const key = d.format("MMMM YYYY");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  }

  const groups = Object.values(grouped).map((arr) => arr.sort((a, b) => a.valueOf() - b.valueOf()));

  const formatted = groups.map((arr) => {
    if (arr.length === 1) return arr[0].format("MMMM D, YYYY").toUpperCase();

    const first = arr[0];
    const year = first.format("YYYY");
    const month = first.format("MMMM");

    // Build consecutive ranges (ex: 11, 13-18)
    const ranges = [];
    let start = arr[0];
    let prev = arr[0];

    for (let i = 1; i < arr.length; i++) {
      const cur = arr[i];
      if (cur.diff(prev, "day") === 1) {
        prev = cur;
      } else {
        ranges.push([start, prev]);
        start = cur;
        prev = cur;
      }
    }
    ranges.push([start, prev]);

    // Convert ranges to day parts: ["11", "13-18"]
    const parts = ranges.map(([a, b]) =>
      a.isSame(b, "day") ? a.format("D") : `${a.format("D")}-${b.format("D")}`
    );

    return `${month} ${parts.join(", ")}, ${year}`.toUpperCase();
  });

  return formatted.join(" and ");
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
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "150px 14px 1fr",
        columnGap: 1,
        alignItems: "baseline",
        lineHeight: 1.05,
        mb: 0.45,
      }}
    >
      <Typography sx={{ fontWeight: 900, fontSize: 14 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 900, fontSize: 14 }}>:</Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{value ?? "—"}</Typography>
    </Box>
  );
}

function GovHeader() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "110px 1fr 110px",
        alignItems: "center",
        columnGap: 1,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <img
          src={LeftLogo}
          alt="Left Logo"
          style={{ width: 86, height: 86, objectFit: "contain" }}
        />
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Typography sx={{ fontSize: 14.5, lineHeight: 1.15 }}>
          Republic of the Philippines
        </Typography>
        <Typography sx={{ fontSize: 14.5, lineHeight: 1.15 }}>
          Province of Cavite
        </Typography>
        <Typography sx={{ fontSize: 14.5, lineHeight: 1.15, mb: 0.6 }}>
          Municipality of Noveleta
        </Typography>

        <Typography sx={{ fontSize: 16.5, fontWeight: 900, lineHeight: 1.1 }}>
          GENERAL SERVICES OFFICE
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <img
          src={RightLogo}
          alt="Right Logo"
          style={{ width: 86, height: 86, objectFit: "contain" }}
        />
      </Box>
    </Box>
  );
}

function ApprovalBlock() {
  return (
        <Box className="approval">
      <Box sx={{ display: "grid", gridTemplateColumns: "auto auto", columnGap: 2 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 14 }}>Approved by:</Typography>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 14, lineHeight: 1.1 }}>
            GLENN S. VILLENA, MPA, MSIT
          </Typography>
          <Typography sx={{ fontWeight: 800, textAlign: "center", fontSize: 13.5, lineHeight: 1.1 }}>
            GSO Head
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function TwoColResources({ r }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        columnGap: 4,
        rowGap: 0,
        mt: 0.5,
      }}
    >
      <InfoRow label="Chairs" value={Number(r.chairs || 0) > 0 ? r.chairs : "No"} />
      <InfoRow label="Tables" value={Number(r.tables || 0) > 0 ? r.tables : "No"} />
      <InfoRow label="Aircon" value={yesNo(!!r.aircon)} />
      <InfoRow label="Lights" value={yesNo(!!r.lights)} />
      <InfoRow label="Sounds" value={yesNo(!!r.sounds)} />
      <InfoRow label="LED" value={yesNo(!!r.led)} />
    </Box>
  );
}

// ✅ Force the print layout to fill ONE Letter page
const CombinedPermitAndSOA = React.forwardRef(function CombinedPermitAndSOA({ booking, docType }, ref) {
  if (!booking) return null;

  const r = booking.resources || {};
  const venueTitle = booking?.venue ? `${booking.venue} Permit` : "Permit";

  const amountNum = Number(booking?.finalAmount ?? booking?.amount ?? 0);
  const amountText = amountNum > 0 ? `₱${amountNum.toLocaleString()}` : "—";

  const showPermit = docType === "permit" || docType === "both";
  const showSOA = docType === "soa" || docType === "both";
  const showDivider = showPermit && showSOA;

  return (
    <Box ref={ref} className="print-root">
      <style>{`
        /* ====== HARD FORCE: SHORT BOND / LETTER PORTRAIT ====== */
        @page { size: 8.5in 11in; margin: 0; }

        @media print {
          html, body {
            width: 8.5in;
            height: 11in;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        .print-root, .print-root * { box-sizing: border-box; }

        /* This is the fixed page canvas */
        /* This is the page canvas - NOW it will size naturally */
        .print-page {
          width: 8.5in;
          height: auto;            /* CRITICAL: auto height for preview */
          padding: 0.45in 0.55in;
          font-family: Arial, sans-serif;
          color: #111;
          overflow: visible;
          display: flex;
          flex-direction: column;
          gap: 0.18in;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1); /* Optional: adds definition */
        }

        /* Remove the min-height and the @media print section for .print-page */
        /* Keep only this for actual printing: */
        @media print {
          .print-page {
            height: 11in;
            box-shadow: none;
          }
        }

                /* Each section expands to fill vertical space */
        .section {
          flex: 0 0 auto;          /* Don't stretch */
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* Only in print mode should sections fill the page */
        @media print {
          .section {
            flex: 1;
          }
        }

        /* optional: add some breathing room below the content */
        .approval {
          margin-top: 0.35in;
          display: flex;
          justify-content: flex-end;
        }

        .title {
          text-align: center;
          font-weight: 900;
          font-size: 20px;
          margin-top: 0.12in;
          margin-bottom: 0.12in;
        }

        .divider {
          border-top: 2px dashed #888;
          width: 100%;
          margin: 0;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* safety: don’t allow weird breaks */
        .no-break { break-inside: avoid; page-break-inside: avoid; }
      `}</style>

      <Box className="print-page">
        {/* ===================== PERMIT ===================== */}
        {showPermit && (
          <Box className="section">
            <Box className="no-break">
              <GovHeader />

              <Typography className="title">{venueTitle}</Typography>

              <Box sx={{ mt: 0.3 }}>
                <InfoRow label="Requested by" value={booking.requestedBy ?? "—"} />
                <InfoRow label="Event Name" value={booking.eventName ?? "—"} />
                <InfoRow label="Date" value={formatDateDisplay(booking)} />
                <InfoRow label="Time" value={formatTimeDisplay(booking)} />

                <TwoColResources r={r} />
              </Box>
            </Box>

            <Box className="no-break">
              <ApprovalBlock />
            </Box>
          </Box>
        )}

        {/* Divider */}
        {showDivider && <Box className="divider" />}

        {/* ===================== SOA ===================== */}
        {showSOA && (
          <Box className="section">
            <Box className="no-break">
              <GovHeader />

              <Typography className="title">STATEMENT OF ACCOUNT</Typography>

              <Box sx={{ mt: 0.3 }}>
                <InfoRow label="Requested by" value={booking.requestedBy ?? "—"} />
                <InfoRow label="Event Name" value={booking.eventName ?? "—"} />
                <InfoRow label="Date" value={formatDateDisplay(booking)} />
                <InfoRow label="Time" value={formatTimeDisplay(booking)} />
                <InfoRow label="Amount" value={amountText} />

                <TwoColResources r={r} />
              </Box>
            </Box>

            <Box className="no-break">
              <ApprovalBlock />
            </Box>
          </Box>
        )}
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
  docType = "permit",
}) {
  const printRef = React.useRef(null);

  // react-to-print pageStyle also forces Letter
  const pageStyle = `
    @page { size: 8.5in 11in; margin: 0; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  `;

  const handlePrint = useReactToPrint({
    contentRef: printRef,  // CHANGE: use contentRef instead of content
    documentTitle: booking?.venue ? `${booking.venue}-permit-soa` : "permit-soa",
    pageStyle,
    onPrintError: (error) => console.error("Print error:", error),
  });

  const handleDownload = React.useCallback(async () => {
    if (!printRef.current || !booking) return;

    const node = printRef.current;

    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: node.scrollWidth,
      windowHeight: node.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // Since our node is EXACTLY letter size, we can fit it cleanly in 1 page
    const pxToMm = (px) => px * 0.264583;

    const imgW = pxToMm(canvas.width);
    const imgH = pxToMm(canvas.height);

    // Fill page while keeping aspect ratio (should match already)
    const scale = Math.min(pageW / imgW, pageH / imgH);
    const w = imgW * scale;
    const h = imgH * scale;

    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;

    pdf.addImage(imgData, "PNG", x, y, w, h, undefined, "FAST");

    const filename = booking?.venue ? `${booking.venue}-permit-soa.pdf` : "permit-soa.pdf";
    pdf.save(filename);
  }, [booking]);

  React.useEffect(() => {
    if (!open || !autoPrint) return;
    if (!booking) return;

    const t = setTimeout(() => {
      if (printRef.current) handlePrint?.();
    }, 350);

    return () => clearTimeout(t);
  }, [open, autoPrint, booking, handlePrint]);

  React.useEffect(() => {
    if (!open || !autoDownload) return;
    if (!booking) return;

    const t = setTimeout(() => {
      if (printRef.current) handleDownload?.();
    }, 350);

    return () => clearTimeout(t);
  }, [open, autoDownload, booking, handleDownload]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 900 }}>
        {docType === "permit"
          ? "Venue Permit"
          : docType === "soa"
          ? "Statement of Account"
          : "Permit + Statement of Account"}
      </DialogTitle>

      <DialogContent dividers sx={{ p: 1, overflow: "hidden" }}>
        {/* preview container */}
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "center",
            maxHeight: "70vh",
            overflow: "auto",
            bgcolor: "#f5f5f5",
            borderRadius: 1
          }}
        >
          {/* THIS is what will be printed - ref directly on the content */}
          <div ref={printRef}>
            <CombinedPermitAndSOA booking={booking} docType={docType} />
          </div>
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