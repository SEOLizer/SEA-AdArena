# Google Ads UI-Referenz — SEA-AdArena Simulator

> Jede Frontend-Komponente muss sich an diesem Dokument orientieren.
> Ziel: Ein echter Google-Ads-Nutzer soll sich sofort zurechtfinden.

---

## 1. Design-Token (Tailwind-Config erweitern)

```js
// tailwind.config.js → theme.extend.colors
colors: {
  google: {
    blue:        '#1a73e8',  // Primary Action, Links, Active States
    'blue-dark': '#1557b0',  // Hover auf Primary Buttons
    'blue-light':'#e8f0fe',  // Active Nav Background, Row Hover
    'blue-faint':'#f0f4ff',  // Sehr heller Hover in Tabellen
    gray:        '#5f6368',  // Secondary Text, Icons
    'gray-dark': '#202124',  // Primary Text
    'gray-mid':  '#80868b',  // Placeholder Text, Disabled
    'gray-light':'#dadce0',  // Borders, Dividers
    'gray-bg':   '#f1f3f4',  // Page Background
    'gray-panel':'#f8f9fa',  // Table Header Background, Panel BG
    green:       '#188038',  // Status: Enabled/Active
    'green-bg':  '#e6f4ea',  // Status Chip Background: Active
    orange:      '#ea8600',  // Status: Budget limited, Warning
    'orange-bg': '#fef7e0',  // Status Chip Background: Warning
    red:         '#d93025',  // Status: Error, Removed
    'red-bg':    '#fce8e6',  // Status Chip Background: Error
  }
}

// theme.extend.fontFamily
fontFamily: {
  google: ['"Google Sans"', 'Roboto', 'Arial', 'sans-serif'],
}
```

Roboto über Google Fonts laden: `@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&family=Google+Sans:wght@400;500&display=swap')`

---

## 2. Typografie

| Element | Größe | Gewicht | Farbe |
|---|---|---|---|
| Page Title (H1) | 22px | 400 | #202124 |
| Section Header | 16px | 500 | #202124 |
| Table Header | 12px | 500 | #5f6368 (UPPERCASE) |
| Table Cell | 13px | 400 | #202124 |
| Table Cell (Zahl) | 13px | 400 | #202124, rechts ausgerichtet |
| Nav Label | 14px | 500 | #202124 (aktiv: #1a73e8) |
| Button (primary) | 14px | 500 | #fff |
| Button (secondary) | 14px | 500 | #1a73e8 |
| Label / Hint | 12px | 400 | #5f6368 |
| Toast | 14px | 400 | #fff |
| Metric Kachel (Wert) | 28px | 400 | #202124 |
| Metric Kachel (Label) | 12px | 400 | #5f6368 |

---

## 3. Layout & Dimensionen

```
┌──────────────────────────────────────────────────────────────────┐
│  TOP BAR  h=64px  bg=#fff  border-bottom=1px #dadce0             │
│  [Logo 120px] [Account-Name ▼]           [Datum] [?][⚙][🔔]     │
├────────────┬─────────────────────────────────────────────────────┤
│  SIDEBAR   │  MAIN CONTENT                                        │
│  w=230px   │  padding: 24px                                       │
│  bg=#fff   │  bg=#f1f3f4                                          │
│  border-   │                                                       │
│  right:1px │  ┌─────────────────────────────────────────────────┐│
│  #dadce0   │  │ PAGE CARD  bg=#fff  border-radius=8px           ││
│            │  │ border=1px #dadce0  padding=0                   ││
│            │  │                                                  ││
│            │  │  [Tabs]  [Filter-Bar]  [Aktionen-Bar]           ││
│            │  │  ──────────────────────────────────────         ││
│            │  │  [Tabelle]                                       ││
│            │  └─────────────────────────────────────────────────┘│
└────────────┴─────────────────────────────────────────────────────┘
```

- Sidebar ist **fixed**, Main Content scrollt
- Mobile: Sidebar kollabiert auf Icon-Only (optional für MVP, aber Breakpoint vorsehen)
- Content max-width: 1600px, centered
- Inneres Padding der Page-Card: 0 (Tabs und Tabelle bis an den Rand)

---

## 4. Sidebar-Navigation

```
┌──────────────────────────┐
│  [G] SEA-AdArena         │  ← Logo, 64px high, border-bottom
├──────────────────────────┤
│                          │
│  📊 Übersicht            │  ← nav item h=40px, px=16px
│                          │
│  📣 Kampagnen        ▾   │  ← expandierbar
│     └─ [Kampagnenname]   │  ← sub-item: pl=32px, font-size=13px
│         ├─ Anzeigengruppen│
│         ├─ Keywords      │
│         └─ Einstellungen │
│                          │
│  🔑 Keywords             │
│  🎯 Zielgruppen          │
│                          │
│  📈 Einblicke        ▾   │
│     └─ Keyword-Planer    │
│                          │
│  📋 Berichte             │
│                          │
│  ── (nur Admin) ──────   │  ← thin divider
│  👥 Admin                │
│                          │
├──────────────────────────┤
│  👤 Max Muster           │  ← User-Info, bottom
│  [Abmelden]              │
└──────────────────────────┘
```

**Aktiver Nav-Item:** `background: #e8f0fe; color: #1a73e8; border-radius: 0 20px 20px 0; margin-right: 8px`  
**Hover:** `background: #f1f3f4`  
**Sub-Item aktiv:** linke blaue Linie 3px + gleiche Farbe

---

## 5. Buttons

```css
/* Primary */
.btn-primary {
  background: #1a73e8;  color: #fff;
  height: 36px;  padding: 0 24px;  border-radius: 4px;
  font-size: 14px;  font-weight: 500;  border: none;
  cursor: pointer;
}
.btn-primary:hover { background: #1557b0; }
.btn-primary:disabled { background: #dadce0; color: #80868b; }

/* Secondary (Outlined) */
.btn-secondary {
  background: #fff;  color: #1a73e8;
  height: 36px;  padding: 0 24px;  border-radius: 4px;
  font-size: 14px;  font-weight: 500;
  border: 1px solid #dadce0;
}
.btn-secondary:hover { background: #e8f0fe; }

/* Text/Ghost */
.btn-text { background: none; border: none; color: #1a73e8; padding: 0 8px; }
```

**Tailwind Klassen (Shorthand für Komponenten):**
- Primary: `bg-google-blue hover:bg-google-blue-dark text-white h-9 px-6 rounded text-sm font-medium`
- Secondary: `border border-google-gray-light text-google-blue bg-white hover:bg-google-blue-light h-9 px-6 rounded text-sm font-medium`

---

## 6. Formular-Elemente

```css
/* Input */
input, select, textarea {
  border: 1px solid #dadce0;  border-radius: 4px;
  height: 36px;  padding: 0 12px;
  font-size: 14px;  color: #202124;
  background: #fff;
}
input:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 1px #1a73e8;
  outline: none;
}

/* Label */
label {
  font-size: 12px;  color: #5f6368;
  display: block;  margin-bottom: 4px;
}

/* Floating Label Pattern (Google-Style): */
/* Label schwebt über dem Input wenn fokussiert oder ausgefüllt */
/* → Via @floating-ui oder einfaches CSS-Trick mit :placeholder-shown */
```

**Radio-Buttons:** Google nutzt eigene Radio-Styles (blauer Kreis, kein Browser-Default). Empfehlung: `@headlessui/react` RadioGroup.

**Checkbox:** Eigenes Styling (blauer Haken auf weißem Grund mit `#dadce0`-Border).

---

## 7. Tabellen

```
┌──────────────────────────────────────────────────────────────────┐
│  [☐]  KAMPAGNE ↑      STATUS      BUDGET/TAG  IMPRESSION  KLICKS │  ← Header h=48px
│       font: 12px 500 uppercase #5f6368                           │
├──────────────────────────────────────────────────────────────────┤
│  [☐]  ● Schuh-Suche   ▾ Aktiv    29,60 €     4.210       252    │  ← Row h=52px
│       #1a73e8 link    chip-green  right-align  right       right  │
├──────────────────────────────────────────────────────────────────┤
│  [☐]  ● Laufschuhe    ⏸ Pausiert  15,00 €    —           —      │
└──────────────────────────────────────────────────────────────────┘
```

**Regeln:**
- Header: `bg: #f8f9fa`, `border-bottom: 2px solid #dadce0`
- Zeilen: `border-bottom: 1px solid #dadce0`
- Hover: `background: #f8f9fa`
- Sortierbare Spalte: Pfeil-Icon rechts des Labels, aktiv = blau
- Zahlen-Spalten: **rechts ausgerichtet**
- Name-Spalte: **links**, blau, klickbar, mit Status-Dot links daneben
- Keine Daten (`—`): grau, zentriert
- Checkbox: erscheint erst bei Hover der Zeile (wie Google Ads)
- "Keine Kampagnen": leere State-Illustration mit CTA

**Pagination:**
```
                              1-50 von 234   < >
```
`font-size: 13px; color: #5f6368; position: bottom-right`

---

## 8. Status-System

| Status | Dot | Chip-Text | Chip-Farben |
|---|---|---|---|
| `running` / Aktiv | `●` grün #188038 | "Aktiv" | bg #e6f4ea, text #188038 |
| `paused` / Pausiert | `●` grau #80868b | "Pausiert" | bg #f1f3f4, text #5f6368 |
| `budget_exhausted` | `⚠` orange | "Budget begrenzt" | bg #fef7e0, text #ea8600 |
| `ended` / Beendet | `●` rot #d93025 | "Beendet" | bg #fce8e6, text #d93025 |

**Status-Toggle in Tabelle:** Klick auf Chip öffnet Dropdown mit Optionen (Aktivieren / Pausieren). Keine eigene Seite.

---

## 9. Tab-Navigation (innerhalb Kampagne)

```
Einstellungen  |  Anzeigengruppen  |  Keywords  |  Gebote  |  Berichte
──────────────    ─────────────────                                     ← aktiver Tab: blaue Linie 3px unten
```

- Tab-Bar: `border-bottom: 1px solid #dadce0; height: 48px`
- Tab: `padding: 0 16px; font-size: 14px; font-weight: 500; color: #5f6368`
- Aktiver Tab: `color: #1a73e8; border-bottom: 3px solid #1a73e8`
- Hover: `color: #202124; background: #f1f3f4`

---

## 10. Metriken-Kacheln (Dashboard)

```
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ 4.210         │  │ 252           │  │ 0,94 €        │
│ Impressionen  │  │ Klicks        │  │ Ø CPC         │
└───────────────┘  └───────────────┘  └───────────────┘
```

- Container: `bg: #fff; border: 1px solid #dadce0; border-radius: 8px; padding: 16px 20px`
- Wert: `font-size: 28px; font-weight: 400; color: #202124`
- Label: `font-size: 12px; color: #5f6368; margin-top: 4px`
- Trend-Pfeil (optional): ▲ grün / ▼ rot für Vergleich mit vorheriger Simulation

---

## 11. Charts (Recharts)

```js
// Farb-Palette für Linien
const CHART_COLORS = {
  clicks:      '#1a73e8',   // Blau
  cost:        '#f9ab00',   // Gold/Orange
  impressions: '#34a853',   // Grün
  position:    '#ea4335',   // Rot
  competitor:  '#9e9e9e',   // Grau (Konkurrenten)
};
```

- Grid: `strokeDasharray: "3 3"`, Farbe `#dadce0`
- X-Achse: Stunden 0-23, `tick: { fontSize: 12, fill: '#5f6368' }`
- Y-Achse: links (Klicks), rechts (Kosten €), `tick: { fontSize: 12 }`
- Tooltip: `bg: #fff; border: 1px solid #dadce0; border-radius: 4px; padding: 8px 12px`
- Legend: unter dem Chart, horizontal, `fontSize: 13px`
- Budget-Erschöpfungs-Linie: `<ReferenceLine x={exhaustedHour} stroke="#ea8600" strokeDasharray="4 4" label="Budget" />`

---

## 12. Top-Bar

```
┌──────────────────────────────────────────────────────────────────┐
│ [G Ads Logo]  SEA-AdArena Simulator        [?] [⚙] [Max M. ▼]  │
└──────────────────────────────────────────────────────────────────┘
```

- Höhe: 64px
- Border-Bottom: 1px solid #dadce0
- Background: #fff
- Logo-Bereich: 230px (gleich wie Sidebar), border-right: 1px solid #dadce0
- Icons rechts: 20px, color #5f6368, hover: #202124
- Account-Name: Dropdown mit "Abmelden"

---

## 13. Breadcrumbs

```
Kampagnen > Schuh-Suche > Keywords
```

- `font-size: 13px`
- Trennzeichen `>`: `color: #5f6368`
- Aktueller Pfad: `color: #202124`, nicht klickbar
- Eltern: `color: #1a73e8`, klickbar

---

## 14. Filter-Bar

```
┌──────────────────────────────────────────────────────────────────┐
│ [+ Filter]  [Status: Aktiv ✕]  [Suchen...]           [Spalten ▼]│
└──────────────────────────────────────────────────────────────────┘
```

- Höhe: 48px, border-bottom: 1px solid #dadce0
- Filter-Chips: `bg: #e8f0fe; color: #1a73e8; border-radius: 20px; padding: 4px 12px; font-size: 13px`
- Suchfeld: ohne Border (integriert in Bar), Icon links
- "Spalten"-Button: rechts, Sekundär-Stil

---

## 15. Modals / Dialoge

```
┌─────────────────────────────────────────┐
│  Kampagne löschen?                    ✕ │  ← header 56px
├─────────────────────────────────────────┤
│  Diese Aktion kann nicht rückgängig     │  ← body, padding 24px
│  gemacht werden.                        │
├─────────────────────────────────────────┤
│                    [Abbrechen] [Löschen]│  ← footer 56px, right-aligned
└─────────────────────────────────────────┘
```

- `border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.15)`
- Backdrop: `rgba(0,0,0,0.4)`
- Max-width: 560px
- Destruktive Aktion: Primary-Button in Rot (`background: #d93025`)

---

## 16. Toast-Notifications

```
                    ┌────────────────────────────────┐
                    │ ✓  Keyword "sneaker" eingefügt  │
                    └────────────────────────────────┘
```

- Position: **unten links** (wie Google Ads), `position: fixed; bottom: 24px; left: 24px`
- `bg: #323232; color: #fff; border-radius: 4px; padding: 12px 16px; font-size: 14px`
- Sichtbar für 4 Sekunden, dann fade-out
- Mehrere Toasts: stapeln sich nach oben
- Varianten: Standard (grau), Erfolg (+grüner Haken), Fehler (+rotem X)

---

## 17. Keyword-Editor (Google-Ads-spezifisch)

```
┌──────────────────────────────────────────────────────┐
│  Keywords hinzufügen (eines pro Zeile):               │
│  ┌────────────────────────────────────────────────┐  │
│  │ sneaker kaufen                                 │  │
│  │ laufschuhe günstig                             │  │
│  │ [placeholder: weitere Keywords...]             │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Match-Type:  [Weitgehend]  [Wortgruppe]  [Genau]    │
│               broad         phrase        exact       │
│  ↑ Radio-Buttons mit Tooltip-Icon (?)                │
│                                                      │
│  Max. CPC: [1,50] €    ☐ Keyword-spezifisches Gebot  │
│                                                      │
│  [  Keywords hinzufügen  ]    [Abbrechen]            │
└──────────────────────────────────────────────────────┘
```

Match-Type-Darstellung in der Keyword-Liste:
- `[weitgehend passend]` → kein Klammern
- `"wortgruppe"` → Anführungszeichen
- `[genau passend]` → eckige Klammern

---

## 18. Zahlenformatierung (Deutsche Locale)

```typescript
// Immer de-DE Locale verwenden
const formatNum = (n: number) =>
  new Intl.NumberFormat('de-DE').format(n);              // 4.210

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 2
  }).format(n);                                          // 1,33 €

const formatPercent = (n: number) =>
  new Intl.NumberFormat('de-DE', {
    style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1
  }).format(n);                                          // 3,2 %

const formatPosition = (n: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 1 }); // 2,1
```

**Tausendertrennzeichen:** Punkt (4.210 nicht 4,210)  
**Dezimaltrennzeichen:** Komma (1,33 € nicht 1.33 €)  
**Währung:** immer nachgestellt mit Leerzeichen (1,33 €)

---

## 19. Leere Zustände (Empty States)

| Situation | Illustration | CTA |
|---|---|---|
| Keine Kampagnen | Großes Icon + "Erste Kampagne erstellen" | "+ Neue Kampagne" Button |
| Keine Keywords | "Noch keine Keywords gebucht" | "Keywords hinzufügen" Link |
| Nicht simuliert | "Starten Sie die Simulation, um Daten zu sehen" | "Simulation starten" Button |
| Keine Suchergebnisse (Planer) | "Kein Ergebnis für 'xyz'" | Tip: andere Begriffe versuchen |

---

## 20. Bekannte Google-Ads-Patterns (unbedingt umsetzen)

| Pattern | Beschreibung |
|---|---|
| **Inline-Bearbeitung** | Klick auf CPC-Wert in Tabelle → Inline-Input ohne Seiten-Reload |
| **Status-Toggle** | Klick auf Status-Chip → Dropdown (Aktiv/Pausiert) direkt in Zeile |
| **Sticky Header** | Tabellen-Header bleibt beim Scrollen oben fixiert |
| **Sortierbare Spalten** | Klick auf Spaltentitel → sortiert, Pfeil zeigt Richtung |
| **Spaltenauswahl** | "Spalten"-Button oben rechts → Checkbox-Liste welche Metriken sichtbar |
| **Massenaktionen** | Checkboxen in Tabelle → bei Auswahl erscheint Aktions-Bar oben |
| **Auto-Save** | Formulare speichern ohne expliziten Submit bei Verlassen (oder deutliche Warnung) |
| **Datum als relative Zeit** | "vor 2 Stunden", "heute", "gestern" statt absolutem Datum wo sinnvoll |
| **Help-Tooltips** | `?`-Icon neben Fachbegriffen (QS, Ad Rank, CTR) → erklärender Tooltip auf Hover |
| **Keyboard-Shortcuts** | `?` öffnet Shortcut-Overlay (optional, aber Google-typisch) |
| **Loading-Skeleton** | Beim Datenladen: Grau-Skeleton statt Spinner in Tabellen-Zeilen |
| **Match-Type-Klammern** | In allen Listen: `[exakt]` `"phrase"` `weitgehend` formatieren |
| **Negative KW visuell** | Negatives Keyword: `-keyword` mit rotem Minus-Prefix |

---

## 21. Was explizit NICHT umzusetzen ist (für MVP)

- Responsive / Mobile Layout (Desktop-first, min-width: 1200px)
- Dark Mode
- Drag & Drop in Tabellen
- Echte Keyboard-Shortcuts (nur `?`-Overlay optional)
- Animierte Übergänge zwischen Seiten (einfache mount/unmount reichen)
- Google Ads Spalten-Resize per Drag

---

*Dieses Dokument ist normativ für alle Frontend-WPs (WP-4.1 bis WP-4.9).*  
*Bei Unklarheiten: echter Google Ads Account ist die Referenz.*
