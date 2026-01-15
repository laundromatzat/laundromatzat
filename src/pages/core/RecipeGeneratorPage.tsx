import React from 'react';
import PageMetadata from '../components/PageMetadata';

function RecipeGeneratorPage(): React.ReactNode {
  return (
    <div className="space-y-6">
      <PageMetadata
        title="Recipe Generator"
        description="Generate unique recipes."
        path="/ai-apps/recipe-generator"
      />
      <header className="space-y-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-brand-text">
          Recipe Generator
        </h1>
        <p className="mx-auto max-w-2xl text-base text-brand-text-secondary">
          Coming soon...
        </p>
      </header>
    </div>
  );
}

export default RecipeGeneratorPage;
