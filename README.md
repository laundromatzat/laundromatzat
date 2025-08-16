# laundromatzat portfolio

This project powers [laundromatzat.com](https://laundromatzat.com), a portfolio site built with a React frontend and a Node.js backend.

## Architecture

*   **Frontend:** A React application built with Vite, hosted on Firebase Hosting.
*   **Backend:** An Express.js API running on Google Cloud Run, which serves portfolio data from a PostgreSQL database.
*   **Deployment:** The site is automatically built and deployed via GitHub Actions whenever changes are pushed to the `main` branch.

## Getting started

**Prerequisites:** Node.js 20+

1.  **Install dependencies:** `npm install`
2.  **Backend setup:**
    *   Navigate to the `backend` directory.
    *   Copy `.env.example` to `.env` and configure the database connection and other environment variables.
    *   Run database migrations: `npm run migrate`
    *   Seed the database: `npm run seed`
3.  **Frontend setup:**
    *   Navigate to the `frontend` directory.
    *   Copy `.env.local.example` to `.env.local` and set the required environment variables, including `VITE_API_BASE_URL`.
4.  **Run locally:**
    *   Start the backend server: `npm run dev -w backend`
    *   Start the frontend development server: `npm run dev -w frontend`

## Deployment

The frontend and backend are automatically deployed to Firebase Hosting and Google Cloud Run, respectively, when changes are pushed to the `main` branch. The deployment workflows are defined in the `.github/workflows` directory.
