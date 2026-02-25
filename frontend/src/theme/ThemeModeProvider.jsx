// frontend/src/theme/ThemeModeProvider.jsx
import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import { buildTheme } from "./index";

export default function ThemeModeProvider({ children }) {
  const [mode, setMode] = React.useState("light");
  const theme = React.useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      {children}
      {/* If you want a toggle later, expose setMode via context */}
    </ThemeProvider>
  );
}