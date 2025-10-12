
import React, { useState } from 'react';
import { generateSewingGuide, generateProjectImages } from '../services/nylonFabricDesignerService';

const NylonFabricDesignerPage: React.FC = () => {
  const [projectDescription, setProjectDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guideContent, setGuideContent] = useState<string | null>(null);
  const [visuals, setVisuals] = useState<{ stage: string; svg: string }[] | null>(null);

  const examples = {
    stuffsack:
      'I want to make a lightweight stuff sack for camping gear, approximately 12 inches tall and 8 inches in diameter, with a drawstring closure at the top. It should be durable and water-resistant for storing sleeping bags or clothing.',
    tote:
      'I\'d like to create a medium-sized tote bag for grocery shopping, about 15 inches wide, 14 inches tall, and 6 inches deep. I want sturdy handles and maybe an internal pocket for keys and phone.',
    pouch:
      'I want to make a rectangular zipper pouch for toiletries, roughly 10 inches by 6 inches by 3 inches. It should have a waterproof lining and be able to stand up on its own.',
    apron:
      'I need a work apron for my woodshop with multiple pockets for tools. It should be about 24 inches long with adjustable straps and reinforced pocket corners for durability.',
  };

  const handleGenerateGuide = async () => {
    if (!projectDescription) {
      setError('Please enter a project description');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGuideContent(null);
    setVisuals(null);

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('API key not found');
      }

      const guide = await generateSewingGuide(projectDescription, apiKey);
      setGuideContent(guide);

      const projectVisuals = await generateProjectImages(projectDescription, apiKey);
      setVisuals(projectVisuals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewProject = () => {
    setProjectDescription('');
    setGuideContent(null);
    setVisuals(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-brand-primary font-sans text-brand-text">
      <header className="border-b border-brand-surface-highlight/60 bg-brand-secondary/80 px-8 py-10 text-center shadow-layer-1">
        <h1 className="bg-gradient-to-r from-brand-accent to-brand-accent-strong bg-clip-text text-5xl font-bold text-transparent">
          Nylon Fabric Project Designer
        </h1>
        <p className="mt-2 text-lg text-brand-text-secondary">
          Describe your project and get professional sewing guidance with cutting templates and visual previews
        </p>
      </header>

      <main className="mx-auto max-w-7xl p-8">
        {!guideContent && (
          <div className="rounded-radius-lg border border-brand-surface-highlight/60 bg-brand-secondary/70 p-8 shadow-layer-1">
            <h2 className="mb-4 text-2xl font-semibold text-brand-accent">Describe Your Project</h2>
            <p className="mb-6 text-brand-text-secondary">
              Tell us what you want to make with nylon fabric. Be as detailed as possible about the item, its purpose,
              size, and any specific features you'd like.
            </p>
            <textarea
              id="projectDescription"
              className="w-full min-h-[150px] rounded-radius-md border-2 border-brand-surface-highlight/60 bg-brand-primary/60 p-4 text-brand-text placeholder:text-brand-text-secondary/70 transition focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/60 focus:ring-offset-2 focus:ring-offset-brand-primary"
              placeholder="Example: I want to make a lightweight stuff sack for camping gear..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
            <div className="flex gap-4 mt-4 flex-wrap">
              {Object.entries(examples).map(([key, value]) => (
                <button
                  key={key}
                  className="rounded-full bg-brand-secondary/50 px-4 py-2 text-sm font-medium text-brand-text-secondary transition hover:bg-brand-secondary/70 hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
                  onClick={() => setProjectDescription(value)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
            <button
              className="mt-6 w-full rounded-radius-md bg-gradient-to-r from-brand-accent to-brand-accent-strong py-3 px-6 text-sm font-semibold text-brand-on-accent transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleGenerateGuide}
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Sewing Guide'}
            </button>
            {error && <p className="mt-4 rounded-radius-md border border-status-error-bg bg-status-error-bg/40 p-3 text-sm text-status-error-text">{error}</p>}
          </div>
        )}

        {isLoading && !guideContent && (
          <div className="rounded-radius-lg border border-brand-surface-highlight/60 bg-brand-secondary/70 p-12 text-center shadow-layer-1">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-brand-accent"></div>
            <p className="mt-4 text-xl font-semibold text-brand-accent">Analyzing your project...</p>
            <p className="text-brand-text-secondary">Researching best practices and generating your custom guide</p>
          </div>
        )}

        {guideContent && (
          <div className="rounded-radius-lg border border-brand-surface-highlight/60 bg-brand-secondary/70 p-8 shadow-layer-1">
            <div className="mb-6 flex flex-col gap-4 border-b border-brand-surface-highlight/60 pb-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-3xl font-bold text-brand-accent">Your Custom Sewing Guide</h2>
              <button
                className="inline-flex items-center justify-center rounded-radius-md bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-on-accent transition hover:bg-brand-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-secondary"
                onClick={startNewProject}
              >
                New Project
              </button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: guideContent }} />

            {visuals && (
              <div className="mt-8">
                <h3 className="mb-4 text-2xl font-bold text-brand-accent">Visual Blueprints & Renderings</h3>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {visuals.map((visual, index) => (
                    <div key={index} className="overflow-hidden rounded-radius-md border border-brand-surface-highlight/60 bg-brand-secondary/60 shadow-layer-1">
                      <div className="flex min-h-[300px] items-center justify-center bg-brand-primary/60 p-4" dangerouslySetInnerHTML={{ __html: visual.svg }} />
                      <div className="bg-brand-secondary/80 p-4">
                        <p className="text-center text-sm font-semibold text-brand-text">{visual.stage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
             {isLoading && !visuals && (
              <div className="mt-8 rounded-radius-lg border border-brand-surface-highlight/60 bg-brand-secondary/70 p-12 text-center shadow-layer-1">
                <div className="mx-auto h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-brand-accent"></div>
                <p className="mt-4 text-xl font-semibold text-brand-accent">Generating visual diagrams...</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default NylonFabricDesignerPage;
