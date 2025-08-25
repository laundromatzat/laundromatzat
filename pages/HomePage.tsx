import React, { useState } from 'react';
import { PROJECTS } from '../constants';
import { Project } from '../types';
import ProjectCard from '../components/ProjectCard';
import ChatAssistant from '../components/ChatAssistant';

function HomePage(): React.ReactNode {
  const featuredProjects = PROJECTS.slice(0, 6);
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
        <h2 className="text-3xl font-bold text-brand-text mb-6">
          {displayedProjects === featuredProjects ? 'featured' : 'search results'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
      <ChatAssistant onSearch={handleAiSearch} />
    </div>
  );
}

export default HomePage;