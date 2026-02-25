// frontend/src/theme/index.jsx
import { createTheme } from "@mui/material/styles";
import { tokens } from "./tokens";

export const buildTheme = (mode) => {
  const t = tokens(mode);

  return createTheme({
    palette: {
      mode,
      primary: {
        main: t.primary,
        light: t.primaryLight,
        dark: t.primaryDark
      },
      background: {
        default: t.bg,
        paper: t.card
      },
      text: {
        primary: t.text
      }
    },
    shape: {
      borderRadius: 14
    },
    components: {
      MuiButton: {
        styleOverrides: {
          contained: {
            fontWeight: 800,
            textTransform: "none"
          }
        }
      }
    }
  });
};