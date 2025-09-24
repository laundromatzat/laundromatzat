import React, { useState } from 'react';
import { PROJECTS } from '../constants';
import { Project } from '../types';
import ProjectGrid from '../components/ProjectGrid';
import ChatAssistant from '../components/ChatAssistant';

function HomePage(): React.ReactNode {
  const featuredProjects = PROJECTS.filter(project => project.title === 'Sea of Love' || project.title === 'Seasons of Love').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>(featuredProjects);

  const handleAiSearch = (projects: Project[]) => {
    setDisplayedProjects(projects);
  };

  return (
    <div className="space-y-12">
      <section className="text-center animate-fade-in">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-brand-text tracking-tight">
          laundromatzat.com
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-brand-text-secondary">
          welcome to the laundromat.
        </p>
      </section>

      <section>
        {displayedProjects === featuredProjects && (
          <h2 className="text-3xl font-bold text-brand-text mb-6">
            featured
          </h2>
        )}
        <ProjectGrid
          projects={displayedProjects}
          gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        />
      </section>
      <ChatAssistant onSearch={handleAiSearch} />
    </div>
  );
}

export default HomePage;