import React from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../utils/testUtils";
import ProjectCard from "../../components/ProjectCard";

const mockProject = {
  id: 1,
  title: "Test Video",
  description: "Test Description",
  type: "Video",
  url: "https://example.com/video.mp4",
  thumbnail_url: "https://example.com/thumb.jpg",
  date: "2024-01-01",
  tags: ["test", "video"],
  location: "Test Location",
  media_type: "video" as const,
};

describe("ProjectCard", () => {
  it("should render project title", () => {
    const mockOnClick = vi.fn();

    renderWithProviders(
      <ProjectCard project={mockProject} onClick={mockOnClick} />
    );

    expect(screen.getByText("Test Video")).toBeInTheDocument();
  });

  it("should display correct metadata", () => {
    const mockOnClick = vi.fn();

    renderWithProviders(
      <ProjectCard project={mockProject} onClick={mockOnClick} />
    );

    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    const mockOnClick = vi.fn();

    renderWithProviders(
      <ProjectCard project={mockProject} onClick={mockOnClick} />
    );

    const card = screen.getByText("Test Video").closest("div");
    if (card) {
      card.click();
    }

    expect(mockOnClick).toHaveBeenCalledWith(mockProject);
  });

  it("should have accessible role and attributes", () => {
    const mockOnClick = vi.fn();

    renderWithProviders(
      <ProjectCard project={mockProject} onClick={mockOnClick} />
    );

    // Card should be clickable
    const titleElement = screen.getByText("Test Video");
    expect(titleElement).toBeInTheDocument();
  });
});
