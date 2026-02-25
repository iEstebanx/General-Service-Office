// frontend/src/theme/tokens.js
export const tokens = (mode) => {
  const isDark = mode === "dark";

  return {
    primary: isDark ? "#4CAF50" : "#2E7D32",
    primaryLight: isDark ? "#66BB6A" : "#4CAF50",
    primaryDark: "#1B5E20",

    bg: isDark ? "#0f1f14" : "#f3f8f4",
    card: isDark ? "#13281a" : "#ffffff",

    text: isDark ? "#e8f5e9" : "#1b2e1f",
    muted: isDark ? "#9ccc9c" : "#4e6f56",

    border: isDark ? "#1f3b26" : "#d7e6db",
  };
};