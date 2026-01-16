# Visual Design Gallery User Guide

The **Visual Design Gallery** is a feature available in the Neuroaesthetic Tool, Pin Pals, Mediscribe AI, and Public Health Organizer. It allows you to save, browse, reload, and manage your creative history.

## Accessing the Gallery

In any supported tool, look for the **History** or **Gallery** button (usually a clock icon) in the top-right corner of the interface.

- **Neuroaesthetic Tool**: "History" button in header.
- **Pin Pals**: "Gallery" button in top-right overlay.
- **Mediscribe**: "History" button in header.
- **Public Health**: "Saved Docs" button in header.

## Features

### 1. View & Browse

The gallery displays your items in a responsive grid.

- **Pagination**: Navigate through pages using the controls at the bottom (12 items per page).
- **Item Details**: Each card shows relevant previews:
  - _Neuroaesthetic_: Generated image, date, analysis scores.
  - _Pin Pals_: Generated pin image, pet type, date.
  - _Mediscribe_: Note ID, original text snippet, rewritten snippet.
  - _Public Health_: Filename, category, tags, version.

### 2. Search & Filter

Use the control bar at the top of the gallery to find specific items.

- **Search**: Type keywords into the search bar. This searches across filenames, summaries, and text content.
- **Sort**: Use the dropdown to sort items. Common options include:
  - _Newest First_ (Default)
  - _Oldest First_
  - _Tool-specific criteria_ (e.g., "Highest Biophilia Score", "By Category")
- **Filter**: Click the "Filters" button (if available) to reveal specific filter options like Categories or Tags.

### 3. Loading (Time Travel)

Clicking on any item card will **reload its state** into the active workspace.

> **Note**: Loading an item will overwrite your current workspace content. Be sure to save your current work if needed before loading a history item.

- **Neuroaesthetic**: Restores original image, generated image, and all analysis data.
- **Pin Pals**: Restores the generated pin image and prompt settings.
- **Mediscribe**: Restores the original shorthand input and the full generated note.
- **Public Health**: Restores the document analysis session, capable of continuing the chat.

### 4. Deleting Items

To remove a history item:

1.  Hover over the item card.
2.  Click the **Delete (Trash)** icon in the top-right corner of the card.
3.  Confirm the deletion in the overlay dialog.

_Warning: This action is permanent and cannot be undone._
