import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import { Project, ProjectType } from "@/types";

/** Renders a component inside the providers the app actually mounts. */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialEntries = ["/"],
    ...options
  }: RenderOptions & { initialEntries?: string[] } = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <HelmetProvider>{children}</HelmetProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export function makeVideo(overrides: Partial<Project> = {}): Project {
  return {
    id: "1",
    type: ProjectType.Video,
    title: "Test Video",
    description: "Test Description",
    imageUrl: "https://example.com/thumb.webp",
    projectUrl: "https://example.com/video.m4v",
    date: "01/2024",
    year: 2024,
    location: "Test Location",
    tags: ["test", "video"],
    ...overrides,
  };
}

export * from "@testing-library/react";
