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
import { AuthProvider } from "@/context/AuthContext";

import { LoadingProvider } from "@/context/LoadingContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages - Core
import HomePage from "@/pages/core/HomePage";
import NotFoundPage from "@/pages/core/NotFoundPage";
import LoginPage from "@/pages/core/LoginPage";
import RegisterPage from "@/pages/core/RegisterPage";
import ProfilePage from "@/pages/core/ProfilePage";
import RegistrationPendingPage from "@/pages/core/RegistrationPendingPage";
import AdminMailingListPage from "@/pages/core/AdminMailingListPage";
import AdminDashboard from "@/pages/core/AdminDashboard";

// Pages - Portfolio
import VideosPage from "@/pages/portfolio/VideosPage";
import ImagesPage from "@/pages/portfolio/ImagesPage";
import CinemagraphsPage from "@/pages/portfolio/CinemagraphsPage";

// Pages - Tools
import ToolsPage from "@/pages/tools/ToolsPage";
import LinksPage from "@/pages/tools/LinksPage";
import PhotosPage from "@/pages/tools/CinemagraphsPage";
import PublicHealthPage from "@/pages/tools/public-health/PublicHealthPage";
import MediscribePage from "@/pages/tools/mediscribe/MediscribePage";
import NeuroaestheticPage from "@/pages/tools/neuroaesthetic/NeuroaestheticPage";
import PinPalsPage from "@/pages/tools/PinPalsPage";
import PaystubAnalyzerPage from "@/pages/tools/PaystubAnalyzerPage";
import BackgroundRemovalPage from "@/pages/tools/BackgroundRemovalPage";
import ColorPalettePage from "@/pages/tools/ColorPalettePage";
import NylonFabricDesignerPage from "@/pages/tools/NylonFabricDesignerPage";
import WoodCarvingVisualizerPage from "@/pages/tools/WoodCarvingVisualizerPage";
import IntelligentIdeasBoardPage from "@/pages/tools/IntelligentIdeasBoardPage";
import MediaInsightPage from "@/pages/tools/MediaInsightPage";

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
        path: "tools/pin-pals",
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
        path: "tools/wood-carving-visualizer",
        element: (
          <ProtectedRoute>
            <WoodCarvingVisualizerPage />
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
        path: "tools/media-insight",
        element: (
          <ProtectedRoute>
            <MediaInsightPage />
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
        path: "registration-pending",
        element: <RegistrationPendingPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        ),
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
