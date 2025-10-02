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
import NotFoundPage from './pages/NotFoundPage';
import './styles/base.css';

const baseUrl = import.meta.env.BASE_URL ?? '/';

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
        { path: 'links', element: <LinksPage /> },
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
