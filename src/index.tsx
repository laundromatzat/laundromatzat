import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useParams,
} from "react-router-dom";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import App from "./App";
import "./index.css";

import ErrorBoundary from "@/components/ErrorBoundary";
import VideosPage from "@/pages/VideosPage";
import NotFoundPage from "@/pages/NotFoundPage";

/** Redirects the legacy /videos/:slug permalinks onto /vids/:slug. */
function LegacyVideoRedirect(): React.ReactNode {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={slug ? `/vids/${slug}` : "/"} replace />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      // The video library is the whole site, so it lives at the root.
      { index: true, element: <VideosPage /> },
      { path: "vids/:slug", element: <VideosPage /> },
      // Legacy paths from the old multi-section site.
      { path: "vids", element: <Navigate to="/" replace /> },
      { path: "videos", element: <Navigate to="/" replace /> },
      { path: "videos/:slug", element: <LegacyVideoRedirect /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>,
);
