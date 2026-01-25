import React, { useState, useEffect } from "react";
import { useLoading } from "@/context/LoadingContext";
import { useAuth } from "@/context/AuthContext";
import { marked } from "marked";
import {
  generateSewingGuide,
  generateProjectImages,
} from "@/services/nylonFabricDesignerService";
import { saveDesign, loadDesigns } from "@/services/nylonFabricApi";
import { AuraButton, AuraCard, AuraInput } from "@/components/aura";
import ImageZoomModal from "@/components/ImageZoomModal";

// Configure marked to return HTML strings
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // Use GitHub Flavored Markdown
});

const NylonFabricDesignerPage: React.FC = () => {
  const { setIsLoading: setGlobalLoading } = useLoading();
  const { token } = useAuth(); // Get token from auth context
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
  const [selectedImage, setSelectedImage] = useState<{
    svg: string;
    title: string;
    index: number;
  } | null>(null);

  const examples = {
    stuffsack:
      "I want to make a lightweight stuff sack for camping gear, approximately 12 inches tall and 8 inches in diameter, with a drawstring closure at the top. It should be durable and water-resistant for storing sleeping bags or clothing.",
    tote: "I'd like to create a medium-sized tote bag for grocery shopping, about 15 inches wide, 14 inches tall, and 6 inches deep. I want sturdy handles and maybe an internal pocket for keys and phone.",
    pouch:
      "I want to make a rectangular zipper pouch for toiletries, roughly 10 inches by 6 inches by 3 inches. It should have a waterproof lining and be able to stand up on its own.",
    apron:
      "I need a work apron for my woodshop with multiple pockets for tools. It should be about 24 inches long with adjustable straps and reinforced pocket corners for durability.",
  };

  // Load previous designs on mount
  useEffect(() => {
    loadDesigns()
      .then((designs) => {
        if (designs.length > 0) {
          const latest = designs[0];
          // Parse the visuals JSON if needed
          const visuals =
            typeof latest.visuals_json === "string"
              ? JSON.parse(latest.visuals_json)
              : latest.visuals_json;

          setProjectDescription(latest.description);
          setSanitizedGuideContent(latest.guide_text);
          setVisuals(visuals);
        }
      })
      .catch(console.error);
  }, []);

  const handleGenerateGuide = async () => {
    if (!projectDescription) {
      setError("Please enter a project description");
      return;
    }

    if (!token) {
      setError("Please log in to save your designs");
      return;
    }

    setIsLoading(true);
    setResearchStatus(null);
    setError(null);
    setSanitizedGuideContent(null);
    setVisuals(null);
    setGlobalLoading(true);

    try {
      const guide = await generateSewingGuide(projectDescription, {
        onResearchStart: () =>
          setResearchStatus(
            "Researching technical specifications and materials...",
          ),
        onResearchComplete: () =>
          setResearchStatus("Drafting comprehensive hand-sewing guide..."),
      });

      // Convert markdown to HTML if needed
      const htmlContent =
        guide.includes("<h3>") || guide.includes("<p>")
          ? guide // Already HTML
          : await marked(guide); // Convert markdown to HTML

      setSanitizedGuideContent(htmlContent);
      setResearchStatus(null);

      try {
        const projectVisuals = await generateProjectImages(projectDescription);
        setVisuals(projectVisuals);

        // Save automatically after successful generation
        try {
          await saveDesign(
            {
              projectName: projectDescription.slice(0, 100),
              description: projectDescription,
              guideText: htmlContent,
              visuals: projectVisuals,
            },
            token || undefined,
          );
          console.log("Design auto-saved successfully");
        } catch (saveError) {
          console.error("Failed to auto-save design:", saveError);
          // Show error to user since this affects functionality
          setError(
            `Generated successfully but failed to save: ${saveError instanceof Error ? saveError.message : "Unknown error"}`,
          );
        }
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
    } finally {
      setIsLoading(false);
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
              <AuraButton variant="primary" size="sm" onClick={startNewProject}>
                New Project
              </AuraButton>
            </div>
            {error && <p className="text-aura-error mb-4">{error}</p>}

            {/* Styled Instructions */}
            <div
              className="prose prose-invert max-w-none"
              style={{
                fontSize: "16px",
                lineHeight: "1.75",
              }}
            >
              <style>{`
                .prose h3 {
                  color: var(--aura-accent);
                  font-size: 1.5rem;
                  font-weight: 700;
                  margin-top: 2rem;
                  margin-bottom: 1rem;
                  padding-bottom: 0.5rem;
                  border-bottom: 2px solid var(--aura-border);
                }
                .prose h4 {
                  color: var(--aura-text-primary);
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-top: 1.5rem;
                  margin-bottom: 0.75rem;
                }
                .prose p {
                  color: var(--aura-text-secondary);
                  margin-bottom: 1rem;
                }
                .prose ul, .prose ol {
                  margin-left: 1.5rem;
                  margin-bottom: 1.5rem;
                  color: var(--aura-text-secondary);
                }
                .prose li {
                  margin-bottom: 0.5rem;
                  line-height: 1.6;
                }
                .prose strong {
                  color: var(--aura-text-primary);
                  font-weight: 600;
                }
                .prose .tip-box {
                  background: var(--aura-surface-elevated);
                  border-left: 4px solid var(--aura-accent);
                  padding: 1rem;
                  margin: 1.5rem 0;
                  border-radius: 0.5rem;
                }
              `}</style>
              <div
                dangerouslySetInnerHTML={{ __html: sanitizedGuideContent }}
              />
            </div>

            {visuals && (
              <div className="mt-12">
                <h3 className="text-2xl font-bold text-aura-text-primary mb-6">
                  Visual Blueprints & Renderings
                </h3>
                <p className="text-aura-text-secondary mb-6">
                  Click on any image to zoom and explore details
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {visuals.map((visual, index) => (
                    <div
                      key={index}
                      className="group border border-aura-border rounded-lg shadow-aura-sm overflow-hidden bg-aura-bg hover:shadow-aura-lg hover:border-aura-accent transition-all cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        setSelectedImage({
                          svg: visual.svg,
                          title: visual.stage,
                          index,
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedImage({
                            svg: visual.svg,
                            title: visual.stage,
                            index,
                          });
                        }
                      }}
                    >
                      <div className="bg-aura-surface p-4 flex items-center justify-center min-h-[300px] relative overflow-hidden">
                        <img
                          src={visual.svg}
                          alt={visual.stage}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-aura-accent/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-aura-surface/90 backdrop-blur-sm px-4 py-2 rounded-full text-aura-text-primary font-semibold">
                            Click to zoom
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-aura-surface-elevated">
                        <p className="font-bold text-center text-aura-accent group-hover:text-aura-text-primary transition-colors">
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

      {/* Image Zoom Modal */}
      {selectedImage && visuals && (
        <ImageZoomModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageSrc={selectedImage.svg}
          imageTitle={selectedImage.title}
          images={visuals}
          currentIndex={selectedImage.index}
          onNavigate={(direction) => {
            const newIndex =
              direction === "prev"
                ? selectedImage.index - 1
                : selectedImage.index + 1;
            if (newIndex >= 0 && newIndex < visuals.length) {
              setSelectedImage({
                svg: visuals[newIndex].svg,
                title: visuals[newIndex].stage,
                index: newIndex,
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default NylonFabricDesignerPage;
