import React from "react";
import { Link } from "react-router-dom";
import PageMetadata from "@/components/PageMetadata";
import Container from "@/components/Container";

const TOOL_LINKS = [
  {
    to: "/tools/background-removal",
    title: "Background Remover",
    description: "Instant, in-browser background removal for your photos.",
    imageUrl: "/assets/tools/bg-remover.png",
    badge: "Core tool",
  },
  {
    to: "/tools/color-palette",
    title: "Color Palette",
    description: "Extract a five-color palette from any image instantly.",
    imageUrl: "/assets/tools/color-palette.png",
    badge: "Core tool",
  },
  {
    to: "/tools/nylon-fabric-designer",
    title: "Nylon Fabric Designer",
    description: "Design and visualize nylon fabric projects with AI.",
    imageUrl: "/assets/tools/fabric-designer.png",
    badge: "New service",
  },
  {
    to: "/tools/wood-carving-visualizer",
    title: "Wood Carving Visualizer",
    description:
      "Generate multiple design variations and create detailed carving renderings.",
    imageUrl: "/assets/tools/wood-carving.png",
    badge: "New service",
  },
  {
    to: "/tools/intelligent-ideas-board",
    title: "Intelligent Ideas",
    description: "Brain-dump thoughts and let AI organize them for you.",
    imageUrl: "/assets/tools/intelligent-ideas.png",
    badge: "New service",
  },
  {
    to: "/tools/pin-pals",
    title: "Pin Pals",
    description: "A collaborative map for pinning your favorite spots.",
    imageUrl: "/assets/tools/pin-pals.png",
    badge: "New tool",
  },
  {
    to: "/tools/paystub-analyzer",
    title: "Paystub Analyzer Pro",
    description: "Intelligent payroll tracking and analysis.",
    imageUrl: "/assets/tools/paystub-analyzer.png",
    badge: "Pro tool",
  },
  {
    to: "/tools/mediscribe",
    title: "MediScribe AI",
    description:
      "AI-powered medical documentation with adaptive style learning.",
    imageUrl: "/assets/tools/mediscribe.png", // I need to generate this or use a placeholder
    badge: "Integrated",
  },
  {
    to: "/tools/public-health",
    title: "Public Health Organizer",
    description: "Securely organize and query public health documents.",
    imageUrl: "/assets/tools/public-health.png",
    badge: "Integrated",
  },
  {
    to: "/tools/neuroaesthetic",
    title: "Neuroaesthetic Lens",
    description: "Reimagine environments using neuroaesthetic principles.",
    imageUrl: "/assets/tools/neuroaesthetic.png",
    badge: "Integrated",
  },
  {
    to: "/tools/media-insight",
    title: "MediaInsight Pro",
    description:
      "Analyze audio, video, and images with AI-powered transcription and insights.",
    imageUrl: "/assets/tools/media-insight.png",
    badge: "AI powered",
  },
];

function ToolsPage(): React.ReactNode {
  return (
    <Container className="space-y-space-5 pt-8">
      <PageMetadata
        title="Tools"
        description="Interactive experiments for background removal, color palettes, and other creative workflows."
        path="/tools"
        type="article"
      />

      <section
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        aria-label="Featured tools"
      >
        {TOOL_LINKS.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className="group relative overflow-hidden rounded-2xl bg-zinc-100 aspect-[4/3]"
          >
            <img
              src={tool.imageUrl}
              alt={tool.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />

            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              {tool.badge && (
                <span className="text-xs font-semibold uppercase tracking-widest text-white/80 mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  {tool.badge}
                </span>
              )}
              <h3 className="text-2xl font-serif text-white mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                {tool.title}
              </h3>
              <p className="text-white/90 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-2">
                {tool.description}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </Container>
  );
}

export default ToolsPage;
