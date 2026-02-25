// frontend/src/pages/Backoffice/EventTypesPage.jsx
import React from "react";
import axios from "axios";
import {
  Card, CardContent, Typography, TextField, Button, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, Switch
} from "@mui/material";

// ✅ Use proxy: /api -> backend (recommended)
const API = "/api";

// chairs/tables are qty inputs, others are toggles
const qtyKeys = ["chairs", "tables"];
const toggleKeys = ["aircon", "lights", "sounds", "led"];

export default function EventTypesPage() {
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  const [items, setItems] = React.useState([]);
  const [name, setName] = React.useState("");
  const [baseAmount, setBaseAmount] = React.useState(500);

  // ✅ chairs/tables now numbers
  const [defaults, setDefaults] = React.useState({
    chairs: 0,
    tables: 0,
    aircon: false,
    lights: true,
    sounds: false,
    led: false,
  });

  async function load() {
    const res = await axios.get(`${API}/event-types`);
    setItems(res.data);
  }

  React.useEffect(() => { load(); }, []);

  async function create() {
    if (!name) return alert("Event name required");

    await axios.post(
      `${API}/event-types`,
      { name, baseAmount, defaultResources: defaults },
      { headers }
    );

    setName("");
    await load();
  }

  // ✅ generic updater still works: can set numbers or booleans
  async function toggleDefault(id, key, value) {
    const item = items.find((x) => x.id === id);
    const updated = {
      ...item,
      defaultResources: { ...(item.defaultResources || {}), [key]: value },
    };
    await axios.put(`${API}/event-types/${id}`, updated, { headers });
    await load();
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
          Event Creation / Management
        </Typography>

        <Typography sx={{ opacity: 0.8, mb: 2 }}>
          Create event names and set base amount + default resources.
        </Typography>

        <TextField
          fullWidth
          label="Event Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Base Amount (per hour)"
          type="number"
          value={baseAmount}
          onChange={(e) => setBaseAmount(Number(e.target.value))}
          sx={{ mb: 2 }}
        />

        <Typography sx={{ fontWeight: 800, mb: 1 }}>Default Resources</Typography>

        {/* ✅ chairs/tables as input */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 12 }}>
          <TextField
            label="Chairs (default qty)"
            type="number"
            inputProps={{ min: 0 }}
            value={defaults.chairs}
            onChange={(e) =>
              setDefaults({ ...defaults, chairs: Math.max(0, Number(e.target.value || 0)) })
            }
          />
          <TextField
            label="Tables (default qty)"
            type="number"
            inputProps={{ min: 0 }}
            value={defaults.tables}
            onChange={(e) =>
              setDefaults({ ...defaults, tables: Math.max(0, Number(e.target.value || 0)) })
            }
          />
        </div>

        {/* ✅ toggles remain switches */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 16 }}>
          {toggleKeys.map((k) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Switch
                checked={!!defaults[k]}
                onChange={(e) => setDefaults({ ...defaults, [k]: e.target.checked })}
              />
              {k.toUpperCase()}
            </label>
          ))}
        </div>

        <Button variant="contained" onClick={create} sx={{ fontWeight: 900 }}>
          Create Event Type
        </Button>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
          Existing Event Types
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Base Amount</TableCell>

              {/* ✅ show qty columns */}
              {qtyKeys.map((k) => (
                <TableCell key={k}>{k}</TableCell>
              ))}

              {/* ✅ show toggle columns */}
              {toggleKeys.map((k) => (
                <TableCell key={k}>{k}</TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.name}</TableCell>
                <TableCell>{it.baseAmount}</TableCell>

                {/* ✅ qty as editable number inputs */}
                {qtyKeys.map((k) => (
                  <TableCell key={k}>
                    <TextField
                      size="small"
                      type="number"
                      inputProps={{ min: 0 }}
                      value={Number(it.defaultResources?.[k] ?? 0)}
                      onChange={(e) =>
                        toggleDefault(it.id, k, Math.max(0, Number(e.target.value || 0)))
                      }
                      sx={{ width: 110 }}
                    />
                  </TableCell>
                ))}

                {/* ✅ toggles remain switches */}
                {toggleKeys.map((k) => (
                  <TableCell key={k}>
                    <Switch
                      checked={!!it.defaultResources?.[k]}
                      onChange={(e) => toggleDefault(it.id, k, e.target.checked)}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}