// frontend/src/components/ResourceToggles.jsx
import { Grid, FormControlLabel, Switch } from "@mui/material";

const items = [
  { key: "chairs", label: "Chairs" },
  { key: "tables", label: "Tables" },
  { key: "aircon", label: "Aircon" },
  { key: "lights", label: "Lights" },
  { key: "sounds", label: "Sounds" },
  { key: "led", label: "LED" }
];

export default function ResourceToggles({ resources, setResources }) {
  return (
    <Grid container spacing={1}>
      {items.map((it) => (
        <Grid item xs={6} key={it.key}>
          <FormControlLabel
            control={
              <Switch
                checked={!!resources[it.key]}
                onChange={(e) =>
                  setResources({ ...resources, [it.key]: e.target.checked })
                }
              />
            }
            label={it.label}
          />
        </Grid>
      ))}
    </Grid>
  );
}