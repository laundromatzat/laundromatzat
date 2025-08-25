# Project Overview

This is a personal creative portfolio website called `laundromatzat`. It showcases videos, images, cinemagraphs, and interactive web apps. The project is built with React, Vite, and TypeScript, and it uses the Google Gemini API for its chat assistant feature.

The portfolio items are stored in a structured format in `constants.ts` and rendered on different pages based on their type. The site has a clean, minimalist design with a focus on the creative works themselves.

# Building and Running

**Prerequisites:**

*   Node.js
*   A Gemini API key

**Instructions:**

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Set up your environment:**
    Create a `.env.local` file in the root of the project and add your Gemini API key:
    ```
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the app on `http://localhost:5173`.

4.  **Build for production:**
    ```bash
    npm run build
    ```
    This will create a `dist` folder with the optimized production build.

5.  **Preview the production build:**
    ```bash
    npm run preview
    ```

# Development Conventions

*   **Component-Based Architecture:** The project follows a component-based architecture with reusable components in the `components` directory.
*   **Routing:** Routing is handled by `react-router-dom`, with routes defined in `App.tsx`.
*   **Styling:** The project uses Tailwind CSS for styling.
*   **State Management:** Component-level state is managed with React Hooks.
*   **AI Assistant:** The chat assistant is powered by the Google Gemini API. The system prompt in `constants.ts` defines its personality and capabilities.
*   **Data:** Project data is stored in the `constants.ts` file.
*   **Types:** TypeScript types are defined in `types.ts`.
