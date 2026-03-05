// frontend/src/pages/WelcomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const VENUES = [
  "Unlad Gymnasium",
  "Noveleta Plaza",
  "Noveleta Public Market Rooftop",
];

const STATS = [
  { value: "3", label: "Venues Available" },
  { value: "100%", label: "Digital Process" },
];

// Floating orb component
function Orb({ size, top, left, right, bottom, color, delay, duration }) {
  return (
    <Box
      sx={{
        position: "absolute",
        width: size,
        height: size,
        top,
        left,
        right,
        bottom,
        borderRadius: "50%",
        background: color,
        filter: "blur(60px)",
        opacity: 0.35,
        animation: `floatOrb ${duration || "8s"} ease-in-out ${delay || "0s"} infinite alternate`,
        pointerEvents: "none",
        "@keyframes floatOrb": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "100%": { transform: "translate(20px, -30px) scale(1.1)" },
        },
      }}
    />
  );
}

// Animated grid line background
function GridBackground() {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(34,197,94,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34,197,94,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
        pointerEvents: "none",
      }}
    />
  );
}

// Venue card
function VenueCard({ name, index }) {
  const icons = ["🏟️", "🌳", "🏢"];
  const delays = ["0.4s", "0.55s", "0.7s"];

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.25,
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(8px)",
        opacity: 0,
        transform: "translateX(-20px)",
        animation: `slideInLeft 0.5s ease forwards ${delays[index]}`,
        transition: "all 0.25s ease",
        cursor: "default",
        "&:hover": {
          background: "rgba(255,255,255,0.08)",
          borderColor: "rgba(34,197,94,0.4)",
          transform: "translateX(4px)",
        },
        "@keyframes slideInLeft": {
          to: { opacity: 1, transform: "translateX(0)" },
        },
      }}
    >
      <Typography sx={{ fontSize: "1.3rem", lineHeight: 1 }}>{icons[index]}</Typography>
      <Typography
        sx={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "rgba(255,255,255,0.75)",
          letterSpacing: "0.01em",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {name}
      </Typography>
    </Box>
  );
}

export default function WelcomePage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);

  return (
    <>
      {/* Load Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulseRing {
          0%   { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          70%  { transform: scale(1);    box-shadow: 0 0 0 14px rgba(34,197,94,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          background: "linear-gradient(135deg, #020f07 0%, #041a0c 40%, #020d08 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Background elements */}
        <GridBackground />
        <Orb size="500px" top="-100px" left="-150px" color="radial-gradient(circle, #16a34a, #15803d)" delay="0s" duration="9s" />
        <Orb size="400px" bottom="-80px" right="-100px" color="radial-gradient(circle, #22c55e, #16a34a)" delay="2s" duration="11s" />
        <Orb size="300px" top="40%" left="60%" color="radial-gradient(circle, #4ade80, #22c55e)" delay="1s" duration="7s" />

        {/* Rotating ring decoration */}
        <Box
          sx={{
            position: "absolute",
            width: "700px",
            height: "700px",
            borderRadius: "50%",
            border: "1px solid rgba(34,197,94,0.08)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "rotateSlow 30s linear infinite",
            pointerEvents: "none",
            "&::before": {
              content: '""',
              position: "absolute",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#22c55e",
              top: "-5px",
              left: "50%",
              transform: "translateX(-50%)",
              boxShadow: "0 0 12px 4px rgba(34,197,94,0.6)",
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            border: "1px solid rgba(74,222,128,0.08)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "rotateSlow 20s linear infinite reverse",
            pointerEvents: "none",
            "&::before": {
              content: '""',
              position: "absolute",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#4ade80",
              bottom: "-4px",
              left: "50%",
              transform: "translateX(-50%)",
              boxShadow: "0 0 10px 3px rgba(74,222,128,0.6)",
            },
          }}
        />

        {/* Main content */}
        <Box
          sx={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            alignItems: "center",
            gap: { xs: 6, lg: 10 },
            px: { xs: 3, sm: 6, lg: 10 },
            maxWidth: "1100px",
            width: "100%",
          }}
        >
          {/* LEFT: Text content */}
          <Box sx={{ flex: 1, textAlign: { xs: "center", lg: "left" } }}>
            {/* Badge */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 0.75,
                borderRadius: "999px",
                border: "1px solid rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.1)",
                mb: 3,
                opacity: 0,
                animation: "fadeUp 0.6s ease forwards 0.1s",
              }}
            >
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  bgcolor: "#22c55e",
                  animation: "pulseRing 2s ease infinite",
                }}
              />
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "#86efac",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                General Services Office · Noveleta
              </Typography>
            </Box>

            {/* Headline */}
            <Typography
              sx={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: { xs: "2.6rem", sm: "3.4rem", lg: "4rem" },
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "#fff",
                mb: 1,
                opacity: 0,
                animation: "fadeUp 0.6s ease forwards 0.2s",
              }}
            >
              Reserve Your
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: { xs: "2.6rem", sm: "3.4rem", lg: "4rem" },
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                mb: 3,
                opacity: 0,
                background: "linear-gradient(90deg, #22c55e, #4ade80, #86efac, #22c55e)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "fadeUp 0.6s ease forwards 0.3s, shimmer 4s linear 0.9s infinite",
              }}
            >
              Venue Today
            </Typography>

            <Typography
              sx={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 300,
                fontSize: { xs: "1rem", sm: "1.1rem" },
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.7,
                maxWidth: "460px",
                mx: { xs: "auto", lg: 0 },
                mb: 4,
                opacity: 0,
                animation: "fadeUp 0.6s ease forwards 0.4s",
              }}
            >
              Seamlessly book event spaces in Noveleta. Manage schedules, track reservations, and get instant confirmations — all in one place.
            </Typography>

            {/* CTA Button */}
            <Box
              sx={{
                opacity: 0,
                animation: "fadeUp 0.6s ease forwards 0.5s",
                display: "inline-block",
              }}
            >
              <Button
                variant="contained"
                size="large"
                endIcon={
                  <ArrowForwardIcon
                    sx={{
                      transition: "transform 0.3s ease",
                      transform: hovered ? "translateX(5px)" : "translateX(0)",
                    }}
                  />
                }
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={() => navigate("/schedule")}
                sx={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: "1rem",
                  px: 4,
                  py: 1.5,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                  boxShadow: "0 8px 32px rgba(34,197,94,0.4)",
                  textTransform: "none",
                  letterSpacing: "0.01em",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    boxShadow: "0 12px 40px rgba(34,197,94,0.55)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                Open Scheduler
              </Button>
            </Box>

            {/* Stats row */}
            <Box
              sx={{
                display: "flex",
                gap: 4,
                mt: 5,
                justifyContent: { xs: "center", lg: "flex-start" },
                opacity: 0,
                animation: "fadeUp 0.6s ease forwards 0.65s",
              }}
            >
              {STATS.map((s) => (
                <Box key={s.label}>
                  <Typography
                    sx={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800,
                      fontSize: "1.5rem",
                      color: "#fff",
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.72rem",
                      color: "rgba(255,255,255,0.4)",
                      fontWeight: 400,
                      mt: 0.25,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* RIGHT: Card */}
          <Box
            sx={{
              flexShrink: 0,
              width: { xs: "100%", sm: "340px" },
              opacity: 0,
              animation: "fadeIn 0.8s ease forwards 0.5s",
            }}
          >
            <Box
              sx={{
                borderRadius: "20px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(20px)",
                p: 3,
                boxShadow: "0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              {/* Card header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #16a34a, #15803d)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(34,197,94,0.4)",
                  }}
                >
                  <CalendarMonthIcon sx={{ color: "#fff", fontSize: "1.3rem" }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "#fff",
                      lineHeight: 1.2,
                    }}
                  >
                    Available Venues
                  </Typography>
                </Box>
              </Box>

              {/* Venue list */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {VENUES.map((v, i) => (
                  <VenueCard key={v} name={v} index={i} />
                ))}
              </Box>

              {/* Divider */}
              <Box
                sx={{
                  my: 2.5,
                  height: "1px",
                  background: "rgba(255,255,255,0.07)",
                }}
              />

              {/* Status indicator */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#22c55e",
                      boxShadow: "0 0 8px rgba(34,197,94,0.7)",
                      animation: "pulseRing 2.5s ease infinite",
                    }}
                  />
                  <Typography
                    sx={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.78rem",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    System online
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.72rem",
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  v1.0.0
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bottom ticker */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            py: 1.25,
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(0,0,0,0.3)",
            overflow: "hidden",
            opacity: 0,
            animation: "fadeIn 1s ease forwards 1s",
          }}
        >
          <Box
            sx={{
              display: "flex",
              whiteSpace: "nowrap",
              animation: "tickerScroll 20s linear infinite",
              gap: 0,
            }}
          >
            {[...Array(2)].map((_, repeatIdx) => (
              <Box key={repeatIdx} sx={{ display: "flex", gap: 0 }}>
                {[
                  "📅 Easy Booking",
                  "🏟️ Unlad Gymnasium",
                  "🌳 Noveleta Plaza",
                  "🏢 Public Market Rooftop",
                  "✅ Instant Confirmation",
                  "📋 Manage Reservations",
                  "🖨️ Print Permits",
                  "📊 Track Status",
                ].map((item, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center" }}>
                    <Typography
                      sx={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.78rem",
                        color: "rgba(255,255,255,0.3)",
                        fontWeight: 400,
                        px: 3,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {item}
                    </Typography>
                    <Box
                      sx={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        bgcolor: "rgba(34,197,94,0.5)",
                      }}
                    />
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
}