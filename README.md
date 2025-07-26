# laundromatzat portfolio

This project powers [laundromatzat.com](https://laundromatzat.com), a simple portfolio site built with React and Vite. Data for the portfolio items is loaded from a published Google Sheet in CSV format.

## Getting started

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. Copy `.env.local.example` to `.env.local` and set the `GEMINI_API_KEY` and `VITE_GOOGLE_CLIENT_ID` values used by the site.
3. Update the `GOOGLE_SHEET_CSV_URL` constant in `index.tsx` with the URL of your published Google Sheet CSV.
4. Start the development server with `npm run dev`.

## Building and deploying

To create a production build run `npm run build`. You can preview the build locally using `npm run preview`.

The repository includes a GitHub Actions workflow that builds the project and deploys the `dist` directory to GitHub Pages whenever changes are pushed to the `master` branch.
