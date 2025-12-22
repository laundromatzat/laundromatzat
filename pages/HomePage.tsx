import React, { useState } from "react";
import PageMetadata from "../components/PageMetadata";
import FeaturedHero from "../components/FeaturedHero";
import MasonryGrid from "../components/MasonryGrid";
import PortfolioModal from "../components/PortfolioModal";
import { PROJECTS } from "../constants";

const HomePage: React.FC = () => {
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<
    number | null
  >(null);

  const projects = PROJECTS;

  const featuredProject = projects[0];

  const handleNextProject = () => {
    if (selectedProjectIndex === null) return;
    setSelectedProjectIndex((prev) =>
      prev === null || prev === projects.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevProject = () => {
    if (selectedProjectIndex === null) return;
    setSelectedProjectIndex((prev) =>
      prev === null || prev === 0 ? projects.length - 1 : prev - 1
    );
  };

  return (
    <div className="space-y-12">
      <PageMetadata
        title="Home"
        description="Welcome to Laundromatzat - A Digital Atelier."
      />

      {featuredProject && (
        <FeaturedHero
          project={featuredProject}
          onOpen={() => setSelectedProjectIndex(0)}
        />
      )}

      {/* Main Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-light text-zinc-900 mb-4">
              Selected Works
            </h2>
            <p className="text-zinc-600 max-w-xl text-lg font-light">
              A collection of digital artifacts, creative tools, and visual
              experiments.
            </p>
          </div>
        </div>

        <MasonryGrid
          projects={projects}
          onProjectSelect={setSelectedProjectIndex}
        />
      </section>

      {/* Project Modal */}
      {selectedProjectIndex !== null && (
        <PortfolioModal
          projects={projects}
          currentIndex={selectedProjectIndex}
          onClose={() => setSelectedProjectIndex(null)}
          onNext={handleNextProject}
          onPrev={handlePrevProject}
        />
      )}
    </div>
  );
};

export default HomePage;
