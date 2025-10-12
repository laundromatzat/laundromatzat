# Project data schema

The portfolio feeds multiple experiences (the home page, the assistant, search filters, etc.) from a unified project dataset. The canonical source lives in [`data/projects.json`](../data/projects.json) and is parsed at build time by `parseProjectsFromJson`. Content editors can also work with CSV exports – the parser `parseProjectsFromCsv` understands both formats and normalises them into the runtime `Project` shape.

## Project shape

```ts
interface Project {
  id: string;               // Stable identifier used by the frontend and the assistant.
  title: string;            // Display title.
  type: 'video' | 'photo' | 'cinemagraph' | 'tool';
  description: string;      // Short blurb shown on cards and in modals.
  imageUrl: string;         // Thumbnail or hero image.
  projectUrl?: string;      // Optional deep link to the full asset.
  date: string;             // Source date in MM/YYYY, YYYY-MM or YYYY format.
  year: number;             // Derived from the date string; used for filtering.
  location?: string;        // Freeform location string.
  gpsCoords?: string;       // Optional latitude/longitude metadata.
  tags?: string[];          // Freeform tags used for search and filters.
  categories?: string[];    // High level groupings (e.g. film, photography, motion).
}
```

The JSON file stores `type` as a lower-case string. During parsing the helpers normalise:

- `type` → the strongly-typed `ProjectType` enum used in the app.
- `tags` and `categories` → arrays with duplicates trimmed; both `;` and `|` separators are accepted when data comes from CSV.
- `year` → computed from the date string when not supplied explicitly.

## CSV layout

When exporting or hand-editing CSV data, the parser expects the following headers:

```
id,title,type,coverImage,sourceUrl,date,location,gpsCoords,tags,categories
```

- `coverImage` and `sourceUrl` are mapped to `imageUrl` and `projectUrl` respectively.
- `tags` and `categories` accept either `;` or `|` as separators.
- Additional columns are ignored, so older CSVs without the new fields still load.

### Example row

```
34,Sea of Love,video,https://example.com/sea-thumb.webp,https://example.com/sea-video.m4v,07/2025,Glacier National Park,"48.656564, -113.789418","travel;glacier",film
```

## Links data

Curated resources on the Links page are sourced from [`public/data/links.csv`](../public/data/links.csv) with the schema:

```
url,title,description,tags
```

Tags use `;` as the preferred separator and power the on-page tag filters. Empty tags are allowed.

## Updating the data

1. Edit the JSON or CSV source.
2. Run the parsers (implicitly via `npm run dev`/`npm run build`).
3. The UI will reflect the new filters, tags, and categories automatically.

Both parsers are resilient to missing optional fields; legacy rows without `tags` or `categories` are still accepted, and `year` will be derived from the date field.
