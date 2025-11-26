import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import App from './App';
import HomePage from './pages/HomePage';
import ImagesPage from './pages/ImagesPage';
import VideosPage from './pages/VideosPage';
import CinemagraphsPage from './pages/CinemagraphsPage';
import ToolsPage from './pages/ToolsPage';
import LinksPage from './pages/LinksPage';
import BackgroundRemovalPage from './pages/BackgroundRemovalPage';
import ColorPalettePage from './pages/ColorPalettePage';
import NylonFabricDesignerPage from './pages/NylonFabricDesignerPage';
import IntelligentIdeasBoardPage from './pages/IntelligentIdeasBoardPage';
import AdminMailingListPage from './pages/AdminMailingListPage';
import NotFoundPage from './pages/NotFoundPage';
import AIAppsPage from './pages/AIPage';
import RecipeGeneratorPage from './pages/RecipeGeneratorPage';
import './styles/base.css';

function normalizeBaseUrl(rawBaseUrl: string | undefined): string {
  if (!rawBaseUrl || rawBaseUrl === '/') {
    return '/';
  }

  return rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
}

const baseUrl = normalizeBaseUrl(import.meta.env.BASE_URL);

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'images', element: <ImagesPage /> },
        { path: 'videos', element: <VideosPage /> },
        { path: 'cinemagraphs', element: <CinemagraphsPage /> },
        { path: 'tools', element: <ToolsPage /> },
        { path: 'tools/background-removal', element: <BackgroundRemovalPage /> },
        { path: 'tools/color-palette', element: <ColorPalettePage /> },
        { path: 'tools/nylon-fabric-designer', element: <NylonFabricDesignerPage /> },
        { path: 'tools/intelligent-ideas-board', element: <IntelligentIdeasBoardPage /> },
        { path: 'ai-apps', element: <AIAppsPage /> },
        { path: 'ai-apps/recipe-generator', element: <RecipeGeneratorPage /> },
        { path: 'links', element: <LinksPage /> },
        { path: 'admin/mailing-list', element: <AdminMailingListPage /> },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ],
  { basename: baseUrl },
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  </React.StrictMode>,
);
