import React, { useState } from 'react';
import { PROJECTS } from '../constants';
import { Project } from '../types';
import ProjectGrid from '../components/ProjectGrid';
import ChatAssistant from '../components/ChatAssistant';
import MailingListSignup from '../components/MailingListSignup';

function HomePage(): React.ReactNode {
  const featuredProjects = PROJECTS.filter(
    project => project.title === 'Sea of Love' || project.title === 'Seasons of Love',
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>(featuredProjects);

  const handleAiSearch = (projects: Project[]) => {
    setDisplayedProjects(projects);
  };

  return (
    <div className="space-y-10">
      <section className="text-center animate-fade-in space-y-2">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-brand-text tracking-tight">
          laundromatzat.com
        </h1>
        <p className="max-w-2xl mx-auto text-base text-brand-text-secondary">
          welcome to the laundromat.
        </p>
      </section>

      <section>
        {displayedProjects === featuredProjects ? (
          <h2 className="text-2xl font-bold text-brand-text mb-4">
            featured
          </h2>
        ) : null}
        <ProjectGrid
          projects={displayedProjects}
          gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        />
      </section>

      <MailingListSignup />

      <ChatAssistant onSearch={handleAiSearch} />
    </div>
  );
}

export default HomePage;
