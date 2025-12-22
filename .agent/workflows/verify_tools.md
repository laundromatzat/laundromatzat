---
description: Verify the functionality of all main tools in the application.
---

This workflow verifies the availability and basic functionality of the main tools: Pin Pals, Mediscribe, Public Health, Neuroaesthetic Lens, and Paystub Analyzer.

## 1. Pin Pals Verification

1. Navigate to `/pin-pals`.
2. Ensure the "Create" and "My Pins" toggle buttons are visible.
3. Click "My Pins" and verify the gallery loads (even if empty, it should say "No saved pins found").

## 2. Mediscribe Verification

1. Navigate to `/tools/mediscribe`.
2. Click the "Style & Memory" tab.
3. Click "Add New Example".
4. Enter test data:
   - Original: "Test Shorthand"
   - Rewritten: "Test Full Note"
5. Click "Save".
6. Verify the new example appears in the list.
7. (Optional) Delete the example to clean up.

## 3. Public Health Verification

1. Navigate to `/tools/public-health`.
2. Verify the "Drag & drop files here" area is visible.
3. Verify the "Repository Archives" section is visible.

## 4. Neuroaesthetic Lens Verification

1. Navigate to `/tools/neuroaesthetic`.
2. Ensure the "Design Goal" dropdown is visible.
3. Change the Design Goal selection.
4. Refresh the page.
5. Verify the selection is persisted.

## 5. Paystub Analyzer Verification

1. Navigate to `/tools/paystub-analyzer`.
2. Verify the file upload area is present.
3. Verify the "Analyze Paystub" button is disabled initially (until file upload).

## Troubleshooting

- If any tool fails to load data or save, check the server logs for `500` errors.
- Ensure `better-sqlite3` syntax (`db.prepare(...).run(...)`) is used in `server/server.js`, not `db.run(...)`.
