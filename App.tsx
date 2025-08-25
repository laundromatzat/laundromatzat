
import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import ChatAssistant from './components/ChatAssistant';
import HomePage from './pages/HomePage';
import ImagesPage from './pages/ImagesPage';
import VideosPage from './pages/VideosPage';
import ToolsPage from './pages/ToolsPage';
import CinemagraphsPage from './pages/CinemagraphsPage';

function App(): React.ReactNode {
  return (
    <HashRouter>
      <div className="min-h-screen bg-brand-primary">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/images" element={<ImagesPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/cinemagraphs" element={<CinemagraphsPage />} />
            <Route path="/tools" element={<ToolsPage />} />
          </Routes>
        </main>
        
      </div>
    </HashRouter>
  );
}

export default App;