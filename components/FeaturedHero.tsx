import React from 'react';
import { Project } from '../types';

interface FeaturedHeroProps {
  project: Project;
  onOpen: () => void;
}

const FeaturedHero: React.FC<FeaturedHeroProps> = ({ project, onOpen }) => {
  return (
    <section className="relative w-full h-[85vh] min-h-[600px] overflow-hidden group">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full transition-transform duration-[2s] ease-out group-hover:scale-105">
        <img
          src={project.imageUrl}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 mix-blend-multiply transition-opacity duration-500 group-hover:bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-4">
             <span className="px-3 py-1 text-xs font-medium uppercase tracking-widest text-white border border-white/30 rounded-full backdrop-blur-md">
              Featured Creation
            </span>
            <span className="text-xs font-medium uppercase tracking-widest text-white/80">
              {project.date} — {project.location}
            </span>
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-light text-white tracking-tight leading-[0.9]">
            {project.title}
          </h1>
          
          <p className="max-w-xl text-lg md:text-xl text-white/90 font-light leading-relaxed line-clamp-3">
            {project.description}
          </p>

          <div className="pt-4">
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full text-sm font-semibold uppercase tracking-widest hover:bg-aura-accent transition-all duration-300 transform hover:-translate-y-1"
            >
              View Project
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedHero;
