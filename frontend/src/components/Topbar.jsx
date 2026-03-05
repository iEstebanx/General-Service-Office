// frontend/src/components/Topbar.jsx
import React from "react";
import { AppBar, Toolbar, Box, Typography, Tooltip } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import testLogo from "../assets/test.png";
import gsoLogo from "../assets/GSO.png";

export default function Topbar({ title = "Scheduling" }) {
  const nav = useNavigate();
  const location = useLocation();
  const [time, setTime] = React.useState(new Date());
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");
  const ampm = time.getHours() >= 12 ? "PM" : "AM";
  const hh12 = String(time.getHours() % 12 || 12).padStart(2, "0");

  const dateStr = time.toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

        .topbar-root * { font-family: 'Outfit', sans-serif !important; }
        .topbar-mono { font-family: 'JetBrains Mono', monospace !important; }

        @keyframes topbarFadeSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes topbarPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
          50%       { box-shadow: 0 0 0 6px rgba(74,222,128,0); }
        }
        @keyframes topbarTickerBlink {
          0%, 100% { opacity: 1; }
          49%      { opacity: 1; }
          50%      { opacity: 0; }
          99%      { opacity: 0; }
        }

        .topbar-logo-box {
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
        }
        .topbar-logo-box:hover {
          transform: scale(1.05);
          filter: drop-shadow(0 4px 12px rgba(34,197,94,0.5));
        }
        .topbar-status-pill {
          transition: all 0.2s ease;
          cursor: default;
        }
        .topbar-status-pill:hover {
          background: rgba(34,197,94,0.18) !important;
          border-color: rgba(34,197,94,0.5) !important;
        }
        .topbar-clock-colon {
          animation: topbarTickerBlink 1s step-end infinite;
        }
      `}</style>

      <AppBar
        position="sticky"
        elevation={0}
        className="topbar-root"
        sx={{
          background: "linear-gradient(135deg, #071a0e 0%, #0a2414 50%, #071a0e 100%)",
          borderBottom: "1px solid rgba(34,197,94,0.15)",
          backdropFilter: "blur(20px)",
          animation: mounted ? "topbarFadeSlide 0.4s ease both" : "none",
        }}
      >
        {/* Subtle top accent line */}
        <Box
          sx={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            height: "2px",
            background: "linear-gradient(90deg, transparent 0%, #22c55e 30%, #4ade80 50%, #22c55e 70%, transparent 100%)",
            opacity: 0.7,
          }}
        />

        <Toolbar
          sx={{
            minHeight: { xs: 70, sm: 80 },
            px: { xs: 2, sm: 3 },
            gap: 2,
            position: "relative",
          }}
        >
          {/* ── Logo (left) ── */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              className="topbar-logo-box"
              sx={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
                border: "2px solid rgba(34,197,94,0.25)",
                boxShadow: "0 3px 12px rgba(34,197,94,0.2)",
              }}
            >
              <img
                src={testLogo}
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          </Box>

          {/* ── Centered Title ── */}
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "1.05rem",
                color: "#fff",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.90rem",
                color: "rgba(134,239,172,0.6)",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                lineHeight: 1,
                mt: 0.3,
              }}
            >
              General Services Office
            </Typography>
          </Box>

          {/* ── Center divider line (decorative) ── */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              width: "1px",
              height: 28,
              background: "linear-gradient(180deg, transparent, rgba(34,197,94,0.3), transparent)",
              mx: 0.5,
            }}
          />

          <Box sx={{ flex: 1 }} />

          {/* ── Live Clock ── */}
          <Tooltip title="Live clock — Philippine Standard Time" placement="bottom">
            <Box
              className="topbar-status-pill"
              sx={{
                display: { xs: "none", sm: "flex" },
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 0,
                px: 1.5,
                py: 0.6,
                borderRadius: "10px",
                border: "1px solid rgba(34,197,94,0.15)",
                background: "rgba(34,197,94,0.06)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.25 }}>
                <Typography
                  className="topbar-mono"
                  sx={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#86efac",
                    lineHeight: 1,
                    letterSpacing: "0.02em",
                  }}
                >
                  {hh12}
                  <span className="topbar-clock-colon">:</span>
                  {mm}
                  <span className="topbar-clock-colon">:</span>
                  {ss}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    color: "rgba(134,239,172,0.6)",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    ml: 0.5,
                  }}
                >
                  {ampm}
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  color: "rgba(134,239,172,0.45)",
                  fontWeight: 400,
                  letterSpacing: "0.04em",
                  lineHeight: 1.2,
                }}
              >
                {dateStr}
              </Typography>
            </Box>
          </Tooltip>

          {/* ── GSO Logo (right side) ── */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 58,
              height: 58,
              flexShrink: 0,
              overflow: "hidden",
              borderRadius: "50%",
              border: "2px solid rgba(34,197,94,0.25)",
              boxShadow: "0 3px 12px rgba(34,197,94,0.2)",
            }}
          >
            <img
              src={gsoLogo}
              alt="GSO Logo"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}