# Laundromatzat – Simplified Portfolio

A simplified, static version of the Laundromatzat creative portfolio. This repository contains the frontend code configured to run as a static site, making it easy to deploy and manage without backend servers.

## Features

- **Static Architecture**: Built with React and Vite. No backend server required.
- **AI Assistant**: Integrated directly into the client using Google's Gemini Flash model.
- **Easy Content Management**: Add new projects by editing a single JSON file.
- **Responsive Design**: Tailored for all devices.

## Prerequisites

- Node.js 18 or newer.
- A Google Gemini API Key (for the AI assistant).

## Setup

1.  **Install dependencies**

    ```bash
    npm install
    ```

2.  **Configure Environment**

    Create a `.env.local` file in the root directory:

    ```env
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    ```

3.  **Run Locally**

    ```bash
    npm run dev
    ```

    Visit `http://localhost:5173`.

## Adding Content

The portfolio content is stored in `data/projects.json`. To add a new project:

1.  Open `data/projects.json`.
2.  Add a new object to the array following the existing structure:
    ```json
    {
      "id": 100,
      "type": "photo",
      "title": "My New Project",
      "description": "Description here.",
      "imageUrl": "https://example.com/image.jpg",
      "projectUrl": "https://example.com/full-image.jpg",
      "date": "01/2025",
      "location": "San Francisco",
      "gpsCoords": "37.7749, -122.4194",
      "tags": ["tag1", "tag2"],
      "categories": ["photography"]
    }
    ```
3.  Save the file. The site will update automatically in development.

## Deployment

To deploy to a static hosting provider (like Netlify, Vercel, or GitHub Pages):

1.  **Build the project**

    ```bash
    npm run build
    ```

    This creates a `dist/` directory containing the optimized static files.

2.  **Upload**

    -   **Netlify/Vercel**: Connect your GitHub repository. Set the `VITE_GEMINI_API_KEY` in the deployment settings (Environment Variables). The build command is `npm run build` and the publish directory is `dist`.
    -   **Manual**: Drag and drop the `dist/` folder to your hosting provider's manual upload interface.

## Notes

-   **Mailing List**: The mailing list functionality has been disabled in this simplified version to avoid backend complexity.
-   **AI Tools**: The AI tools (Idea Board, Fabric Designer) run entirely in the browser using your API key.
