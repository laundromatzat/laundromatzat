import React, { useState } from "react";
import { useLoading } from "../context/LoadingContext";
import {
  generateSewingGuide,
  generateProjectImages,
} from "../services/nylonFabricDesignerService";

const NylonFabricDesignerPage: React.FC = () => {
  const { setIsLoading: setGlobalLoading } = useLoading();
  const [projectDescription, setProjectDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [researchStatus, setResearchStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sanitizedGuideContent, setSanitizedGuideContent] = useState<
    string | null
  >(null);
  const [visuals, setVisuals] = useState<
    { stage: string; svg: string }[] | null
  >(null);

  const examples = {
    stuffsack:
      "I want to make a lightweight stuff sack for camping gear, approximately 12 inches tall and 8 inches in diameter, with a drawstring closure at the top. It should be durable and water-resistant for storing sleeping bags or clothing.",
    tote: "I'd like to create a medium-sized tote bag for grocery shopping, about 15 inches wide, 14 inches tall, and 6 inches deep. I want sturdy handles and maybe an internal pocket for keys and phone.",
    pouch:
      "I want to make a rectangular zipper pouch for toiletries, roughly 10 inches by 6 inches by 3 inches. It should have a waterproof lining and be able to stand up on its own.",
    apron:
      "I need a work apron for my woodshop with multiple pockets for tools. It should be about 24 inches long with adjustable straps and reinforced pocket corners for durability.",
  };

  const handleGenerateGuide = async () => {
    if (!projectDescription) {
      setError("Please enter a project description");
      return;
    }

    setIsLoading(true);
    setResearchStatus(null);
    setError(null);
    setSanitizedGuideContent(null);
    setVisuals(null);
    setGlobalLoading(true);

    try {
      const guide = await generateSewingGuide(projectDescription, undefined, {
        onResearchStart: () =>
          setResearchStatus(
            "Researching technical specifications and materials..."
          ),
        onResearchComplete: () =>
          setResearchStatus("Drafting comprehensive hand-sewing guide..."),
      });
      setSanitizedGuideContent(guide);
      setResearchStatus(null);

      try {
        const projectVisuals = await generateProjectImages(projectDescription);
        setVisuals(projectVisuals);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "An unknown error occurred while generating visuals for your project.";
        setError(message);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unknown error occurred while generating a sewing guide for your project.";
      setError(message);
      setResearchStatus(null);
      setGlobalLoading(false);
    }
  };

  const startNewProject = () => {
    setProjectDescription("");
    setSanitizedGuideContent(null);
    setVisuals(null);
    setError(null);
    setResearchStatus(null);
  };

  return (
    <div className="min-h-screen bg-brand-primary font-sans text-brand-text">
      <header className="bg-brand-secondary border-b border-brand-surface-highlight shadow-layer-1 p-8 text-center">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-brand-accent-strong">
          Nylon Fabric Project Designer
        </h1>
        <p className="text-lg text-aura-text-secondary mt-2">
          Describe your project and get professional sewing guidance with
          cutting templates and visual previews
        </p>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {!sanitizedGuideContent && (
          <div className="bg-brand-secondary border border-brand-surface-highlight rounded-lg shadow-layer-1 p-8">
            <h2 className="text-2xl font-semibold text-aura-text-primary mb-4">
              Describe Your Project
            </h2>
            <p className="text-aura-text-secondary mb-6">
              Tell us what you want to make with nylon fabric. Be as detailed as
              possible about the item, its purpose, size, and any specific
              features you’d like.
            </p>
            <textarea
              id="projectDescription"
              className="w-full min-h-[150px] p-4 border-2 border-brand-surface-highlight bg-brand-primary text-aura-text-primary placeholder:text-aura-text-secondary rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent transition"
              placeholder="Example: I want to make a lightweight stuff sack for camping gear..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
            <div className="flex gap-4 mt-4 flex-wrap">
              {Object.entries(examples).map(([key, value]) => (
                <button
                  key={key}
                  className="bg-brand-accent/10 text-brand-accent px-4 py-2 rounded-full hover:bg-brand-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition text-sm"
                  onClick={() => setProjectDescription(value)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
            <button
              className="mt-6 w-full bg-gradient-to-r from-brand-accent to-brand-accent-strong text-brand-on-accent font-bold py-3 px-6 rounded-lg hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition disabled:opacity-50"
              onClick={handleGenerateGuide}
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate Sewing Guide"}
            </button>
            {error && <p className="text-status-error-text mt-4">{error}</p>}
          </div>
        )}

        {isLoading && !sanitizedGuideContent && (
          <div className="text-center p-12 bg-brand-secondary border border-brand-surface-highlight rounded-lg shadow-layer-1">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-accent mx-auto"></div>
            <p className="mt-4 text-xl text-aura-text-primary">
              {researchStatus || "Analyzing your project..."}
            </p>
            <p className="text-aura-text-secondary">
              {!researchStatus
                ? "Researching best practices and generating your custom guide"
                : "Please wait..."}
            </p>
          </div>
        )}

        {sanitizedGuideContent && (
          <div className="bg-brand-secondary border border-brand-surface-highlight rounded-lg shadow-layer-1 p-8">
            <div className="flex justify-between items-center border-b border-brand-surface-highlight pb-4 mb-6">
              <h2 className="text-3xl font-bold text-aura-text-primary">
                Your Custom Sewing Guide
              </h2>
              <button
                className="bg-brand-accent text-brand-on-accent font-bold py-2 px-4 rounded-lg hover:bg-brand-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent transition"
                onClick={startNewProject}
              >
                New Project
              </button>
            </div>
            {error && <p className="text-status-error-text mb-4">{error}</p>}
            <div dangerouslySetInnerHTML={{ __html: sanitizedGuideContent }} />

            {visuals && (
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-aura-text-primary mb-4">
                  Visual Blueprints & Renderings
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {visuals.map((visual, index) => (
                    <div
                      key={index}
                      className="border border-brand-surface-highlight rounded-lg shadow-layer-1 overflow-hidden bg-brand-primary"
                    >
                      <div
                        className="bg-brand-secondary p-4 flex items-center justify-center min-h-[300px]"
                        dangerouslySetInnerHTML={{ __html: visual.svg }}
                      />
                      <div className="p-4 bg-brand-primary">
                        <p className="font-bold text-center text-brand-accent">
                          {visual.stage}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isLoading && !visuals && (
              <div className="text-center p-12 bg-brand-secondary border border-brand-surface-highlight rounded-lg shadow-layer-1 mt-8">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-accent mx-auto"></div>
                <p className="mt-4 text-xl text-aura-text-primary">
                  Generating visual diagrams...
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default NylonFabricDesignerPage;
