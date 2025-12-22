import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import App from "./App";
import "./index.css";

// Context Providers
import { AuthProvider } from "./context/AuthContext";

import { LoadingProvider } from "./context/LoadingContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import ToolsPage from "./pages/ToolsPage";
import VideosPage from "./pages/VideosPage";
import ImagesPage from "./pages/ImagesPage";
import CinemagraphsPage from "./pages/CinemagraphsPage";
import LinksPage from "./pages/LinksPage";
import PhotosPage from "./pages/PhotosPage";
import PublicHealthPage from "./pages/tools-integrations/public-health/PublicHealthPage";
import MediscribePage from "./pages/tools-integrations/mediscribe/MediscribePage";
import NeuroaestheticPage from "./pages/tools-integrations/neuroaesthetic/NeuroaestheticPage";
import PinPalsPage from "./pages/PinPalsPage";
import PaystubAnalyzerPage from "./pages/PaystubAnalyzerPage";
import BackgroundRemovalPage from "./pages/BackgroundRemovalPage";
import ColorPalettePage from "./pages/ColorPalettePage";
import NylonFabricDesignerPage from "./pages/NylonFabricDesignerPage";
import IntelligentIdeasBoardPage from "./pages/IntelligentIdeasBoardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import AdminMailingListPage from "./pages/AdminMailingListPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <LoadingProvider>
          <App />
        </LoadingProvider>
      </AuthProvider>
    ),
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "vids",
        element: <VideosPage />,
      },
      {
        path: "vids/:slug",
        element: <VideosPage />,
      },
      {
        path: "videos",
        element: <Navigate to="/vids/seasons-of-love" replace />,
      },
      {
        path: "images",
        element: <ImagesPage />,
      },
      {
        path: "cinemagraphs",
        element: <CinemagraphsPage />,
      },
      {
        path: "links",
        element: (
          <ProtectedRoute>
            <LinksPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "photos",
        element: <PhotosPage />,
      },
      {
        path: "tools",
        element: (
          <ProtectedRoute>
            <ToolsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "tools/public-health/*",
        element: (
          <ProtectedRoute>
            <PublicHealthPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "tools/mediscribe",
        element: (
          <ProtectedRoute>
            <MediscribePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "tools/neuroaesthetic",
        element: (
          <ProtectedRoute>
            <NeuroaestheticPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pin-pals",
        element: (
          <ProtectedRoute>
            <PinPalsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "tools/paystub-analyzer",
        element: (
          <ProtectedRoute>
            <PaystubAnalyzerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "tools/background-removal",
        element: (
          <ProtectedRoute>
            <BackgroundRemovalPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "tools/color-palette",
        element: (
          <ProtectedRoute>
            <ColorPalettePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "tools/nylon-fabric-designer",
        element: (
          <ProtectedRoute>
            <NylonFabricDesignerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "tools/intelligent-ideas-board",
        element: (
          <ProtectedRoute>
            <IntelligentIdeasBoardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "admin/mailing-list",
        element: <AdminMailingListPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </React.StrictMode>
);
