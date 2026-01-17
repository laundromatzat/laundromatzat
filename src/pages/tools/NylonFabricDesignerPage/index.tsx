import React, { useState, useEffect } from "react";
import { useLoading } from "@/context/LoadingContext";
import {
  generateSewingGuide,
  generateProjectImages,
} from "@/services/nylonFabricDesignerService";
import {
  persistDesign,
  loadDesigns,
  clearDesigns,
} from "@/services/nylonFabricStorage";
import { AuraButton, AuraCard, AuraInput } from "@/components/aura";

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

  // Load history on mount
  useEffect(() => {
    loadDesigns()
      .then((designs) => {
        if (designs.length > 0) {
          // Restore the most recent design
          const latest = designs[0];
          setProjectDescription(latest.description);
          setSanitizedGuideContent(latest.guideText);
          setVisuals(latest.visuals);
        }
      })
      .catch(console.error);
  }, []);

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
            "Researching technical specifications and materials...",
          ),
        onResearchComplete: () =>
          setResearchStatus("Drafting comprehensive hand-sewing guide..."),
      });
      setSanitizedGuideContent(guide);
      setResearchStatus(null);

      try {
        const projectVisuals = await generateProjectImages(projectDescription);
        setVisuals(projectVisuals);

        // Save automatically after successful generation
        await persistDesign({
          id: `design-${Date.now()}`,
          projectName: projectDescription.slice(0, 30) + "...",
          description: projectDescription,
          createdAt: Date.now(),
          guideText: guide,
          visuals: projectVisuals,
        });
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

  const handleClearHistory = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all saved designs? This cannot be undone.",
      )
    ) {
      clearDesigns()
        .then(() => startNewProject())
        .catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-aura-bg font-sans text-aura-text-primary">
      <header className="bg-aura-surface/50 border-b border-aura-border backdrop-blur-md p-8 text-center sticky top-0 z-10">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-aura-accent to-purple-400">
          Nylon Fabric Project Designer
        </h1>
        <p className="text-lg text-aura-text-secondary mt-2">
          Describe your project and get professional sewing guidance with
          cutting templates and visual previews
        </p>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {!sanitizedGuideContent && (
          <AuraCard variant="glass" padding="lg">
            <h2 className="text-2xl font-semibold text-aura-text-primary mb-4">
              Describe Your Project
            </h2>
            <p className="text-aura-text-secondary mb-6">
              Tell us what you want to make with nylon fabric. Be as detailed as
              possible about the item, its purpose, size, and any specific
              features you’d like.
            </p>
            <AuraInput
              id="projectDescription"
              type="textarea"
              placeholder="Example: I want to make a lightweight stuff sack for camping gear..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="min-h-[150px]"
            />
            <div className="flex gap-4 mt-4 flex-wrap">
              {Object.entries(examples).map(([key, value]) => (
                <AuraButton
                  key={key}
                  variant="secondary"
                  size="sm"
                  onClick={() => setProjectDescription(value)}
                  className="rounded-full text-xs"
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </AuraButton>
              ))}
            </div>
            <AuraButton
              fullWidth
              variant="accent"
              size="lg"
              className="mt-6"
              onClick={handleGenerateGuide}
              isLoading={isLoading}
              disabled={isLoading}
            >
              Generate Sewing Guide
            </AuraButton>
            {error && <p className="text-aura-error mt-4">{error}</p>}
          </AuraCard>
        )}

        {isLoading && !sanitizedGuideContent && (
          <AuraCard variant="glass" padding="lg" className="text-center p-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-aura-accent mx-auto"></div>
            <p className="mt-4 text-xl text-aura-text-primary">
              {researchStatus || "Analyzing your project..."}
            </p>
            <p className="text-aura-text-secondary">
              {!researchStatus
                ? "Researching best practices and generating your custom guide"
                : "Please wait..."}
            </p>
          </AuraCard>
        )}

        {sanitizedGuideContent && (
          <AuraCard variant="elevated" padding="lg">
            <div className="flex justify-between items-center border-b border-aura-border pb-4 mb-6">
              <h2 className="text-3xl font-bold text-aura-text-primary">
                Your Custom Sewing Guide
              </h2>
              <div className="flex gap-2">
                <AuraButton
                  variant="danger"
                  size="sm"
                  onClick={handleClearHistory}
                >
                  Clear History
                </AuraButton>
                <AuraButton
                  variant="primary"
                  size="sm"
                  onClick={startNewProject}
                >
                  New Project
                </AuraButton>
              </div>
            </div>
            {error && <p className="text-aura-error mb-4">{error}</p>}
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
                      className="border border-aura-border rounded-lg shadow-aura-sm overflow-hidden bg-aura-bg"
                    >
                      <div
                        className="bg-aura-surface p-4 flex items-center justify-center min-h-[300px]"
                        dangerouslySetInnerHTML={{ __html: visual.svg }}
                      />
                      <div className="p-4 bg-aura-surface-elevated">
                        <p className="font-bold text-center text-aura-accent">
                          {visual.stage}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isLoading && !visuals && (
              <div className="text-center p-12 bg-aura-surface border border-aura-border rounded-lg shadow-aura-sm mt-8">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-aura-accent mx-auto"></div>
                <p className="mt-4 text-xl text-aura-text-primary">
                  Generating visual diagrams...
                </p>
              </div>
            )}
          </AuraCard>
        )}
      </main>
    </div>
  );
};

export default NylonFabricDesignerPage;
