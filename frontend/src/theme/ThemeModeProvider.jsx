// frontend/src/theme/ThemeModeProvider.jsx
import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import { buildTheme } from "./index";
import CssBaseline from "@mui/material/CssBaseline";

export default function ThemeModeProvider({ children }) {
  const [mode] = React.useState("light");
  const theme = React.useMemo(() => buildTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}