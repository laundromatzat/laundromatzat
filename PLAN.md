# Paystub Analyzer — UI & OT Form Plan

## What we know from the codebase

### Current state
- **`FutureHoursManager.tsx`** — modal to enter daily hours per week; generates a plain-text
  email body; has no PDF output; the email signature is hardcoded as "Stephen Matzat".
- **`PaycheckTable.tsx`** — card view of analysed paystubs; shows paid/banked/reported hours
  and a discrepancy bar; `onEdit` opens a basic inline edit modal.
- **`PaycheckSpreadsheet.tsx`** — tabular view, read-only except for an edit pencil.
- **`ReportedHoursInput.tsx`** — dropdown (code) + number (hours) pair; defaults OST/CTE.
- **`payrollCodes.ts`** — `OST` = Overtime (paid 1×), `CTE` = Comp Time Earned (banks at 1.5×).
- No PDF generation library is currently installed client-side.
- The server has `pdf-lib` available via `pdfjs-dist`; client only uses it for viewing.

### OT Form (CCSF Standard OT Authorization)
Standard City & County of San Francisco OT Authorization form. Fields include:
- Employee Name / Badge / Classification / Department
- Each day: Date, Hours Worked OT, Type of compensation (Pay at 1.5× = OST, Comp Time = CTE)
- Week Ending Date
- Total hours by type
- Justification / Budget number
- Employee + Supervisor signature lines

---

## Plan

### 1 — Install `jsPDF` (client-side PDF generation, no server required)

```
npm install jspdf
```

`jsPDF` is small (~300 KB), supports text drawing, lines, tables, and base64 download —
exactly what we need to programmatically recreate the CCSF OT Auth form layout.

---

### 2 — New service: `src/services/otFormGenerator.ts`

Pure function, no React, no side-effects.

```
generateOTFormPDF(weekData: OTFormInput): jsPDF
```

**Input shape**
```ts
interface OTFormInput {
  employeeName: string;        // "Stephen Matzat"
  weekStartDate: string;       // YYYY-MM-DD
  dailyEntries: {
    date: string;              // YYYY-MM-DD
    ostHours: number;          // OST code hours for that day
    cteHours: number;          // CTE code hours for that day
  }[];
}
```

**PDF layout** — recreates the standard CCSF OT Auth form:
- Header block: Department, Employee Name, Classification, Badge No., Week Ending
- Table body: one row per day with OST hours in "Paid OT" column, CTE hours in "Comp Time" column
- Totals row
- Justification text block (pre-filled with "Weekly overtime per operational schedule")
- Signature blocks: Employee (pre-fills name) and Supervisor (blank for handwritten signature)

Returns the `jsPDF` instance — callers can call `.save()` or `.output('bloburl')`.

---

### 3 — New component: `OTFormPanel` (inside `FutureHoursManager`)

When the active week contains **any OST or CTE hours** show a third right-panel tab
(alongside the existing "Email Preview" panel) called **"OT Form"**:

```
┌──────────────┬────────────────────────────┬─────────────────────┐
│  Weeks       │  Daily Editor              │  ● Email  ● OT Form │
│  Sidebar     │  (Mon–Sun cards)           │                     │
│              │                            │  OT Summary:        │
│              │                            │  OST: 4 hrs          │
│              │                            │  CTE: 0 hrs          │
│              │                            │                     │
│              │                            │  [⬇ Download PDF]   │
│              │                            │  [📋 Copy Email]    │
└──────────────┴────────────────────────────┴─────────────────────┘
```

- "Download PDF" calls `otFormGenerator.generateOTFormPDF(...)` → `.save()`
- Shows a live OT summary (total OST hours, total CTE hours) that updates as daily data changes
- "OT Form" tab is highlighted / badged when OT hours exist in the active week

---

### 4 — Email improvements in `FutureHoursManager`

When OST or CTE hours exist in the week, append to the generated email text:

```
Hours 3/10 - 3/16

Monday 3/10:  8 WKP
...
Friday 3/15:  4 WKP, 4 OST

Total: 36 WKP, 4 OST

OT Form attached.

Thanks,
Stephen Matzat
```

"OT Form attached." is only added when OST or CTE > 0 for the week.

---

### 5 — UI overhaul: `FutureHoursManager.tsx`

**Current pain points:**
- Days displayed in a 4-col grid that truncates on small screens
- Active week selection not obvious at a glance
- OST/CTE entries look identical to regular entries — no visual differentiation
- Right panel is always full-height email textarea with no structure

**Proposed changes:**

a. **Day cards** — colour-code entries by code type:
   - `WKP` = slate / neutral
   - `OST` = amber badge
   - `CTE` = orange badge
   - `SLP`/`VAP` = blue badge

   Daily total shown at bottom of each card.

b. **Week summary bar** — above the day grid, sticky:
   ```
   Week of Mar 10 · Total: 40 hrs · WKP: 32 · OST: 4 · CTE: 4
   ```
   Colour-coded chips.

c. **Right panel tabs** — Email Preview | OT Form (tab with badge when OT > 0)

d. **Sidebar** — show a mini summary per week in the sidebar list:
   ```
   Mar 10, 2026
   40 hrs  ⚡ OT
   ```

e. **Add week UX** — instead of a plain date input + button, show the calculated week start
   date immediately as the user picks a date:
   ```
   Pick any date in the week → "Week of Mon Mar 9 · Add"
   ```

---

### 6 — UI overhaul: `PaystubAnalyzerPage/index.tsx`

**Current pain points:**
- Upload is only in the floating bottom bar — not discoverable when page is empty
- Empty state has a dead `<div>` with no real CTA
- Edit modal is inlined in `index.tsx` (should be its own component)
- `isFutureHoursModalOpen` / `isClearDataModalOpen` state is noisy

**Proposed changes:**

a. **Empty state** — embed a large centered `FileUpload` drop zone directly in the empty-state card.

b. **Stats bar** — when paystubs are loaded, show a one-line summary at top:
   ```
   8 paystubs · Latest: Mar 1–14, 2026 · YTD OT: 16 hrs
   ```

c. **Move edit modal** to `components/EditPaystubModal.tsx`.

d. **OT badge** on each paystub card header — if the paystub contains any OST/CTE paid hours,
   show a small amber "OT" badge.

e. **"Generate OT Form" action** in the PaycheckTable card — when OST hours are present on a
   historical paystub, show a button to generate the OT form retrospectively.
   This reconstructs the form from the `userReportedHours` daily details stored for that period.

---

### 7 — UI overhaul: `PaycheckTable.tsx`

**Current pain points:**
- Cards are wide and dense — hard to scan
- Discrepancy bar at the bottom is easy to miss
- Reported hours section is in a dark zinc theme that clashes with the light card

**Proposed changes:**

a. **Discrepancy indicator** — move to the card header, next to "Analyzed" badge:
   ```
   ✅ Balanced  or  ⚠ −2.00 hrs
   ```

b. **OST/CTE highlight** — in the Paid Hours section, highlight OST and CTE rows in amber.

c. **Reported hours dark section** — restyle to match the card's light aura theme.

d. **Compact mode toggle** — alongside the existing Card/Table toggle, a density toggle
   (compact / comfortable) that reduces the PDF viewer height and collapses the banked section
   by default.

---

## File change summary

| File | Action |
|------|--------|
| `src/services/otFormGenerator.ts` | **NEW** — jsPDF OT form generator |
| `src/pages/tools/PaystubAnalyzerPage/components/FutureHoursManager.tsx` | **REWRITE** — OT panel, day card styling, week summary bar |
| `src/pages/tools/PaystubAnalyzerPage/components/EditPaystubModal.tsx` | **NEW** — extracted from index.tsx |
| `src/pages/tools/PaystubAnalyzerPage/index.tsx` | **UPDATE** — use EditPaystubModal, empty-state FileUpload, stats bar |
| `src/pages/tools/PaystubAnalyzerPage/components/PaycheckTable.tsx` | **UPDATE** — discrepancy in header, OST highlight, dark/light harmonize |
| `package.json` (root) | **UPDATE** — add `jspdf` |

---

## Implementation order

1. Install `jspdf`
2. Build `otFormGenerator.ts` — pure function, testable in isolation
3. Rewrite `FutureHoursManager.tsx` — OT panel + UI improvements
4. Extract `EditPaystubModal.tsx`, improve empty state in `index.tsx`
5. Update `PaycheckTable.tsx` — discrepancy header badge + OST highlight
