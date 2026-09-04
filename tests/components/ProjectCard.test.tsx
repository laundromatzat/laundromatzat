import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders, makeVideo } from "../utils/testUtils";
import ProjectCard from "@/components/ProjectCard";

describe("ProjectCard", () => {
  it("renders the video title and description", () => {
    renderWithProviders(<ProjectCard project={makeVideo()} />);

    expect(screen.getByText("Test Video")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders the thumbnail with the title as alt text", () => {
    renderWithProviders(<ProjectCard project={makeVideo()} />);

    expect(screen.getByAltText("Test Video")).toHaveAttribute(
      "src",
      "https://example.com/thumb.webp",
    );
  });

  it("calls onSelect when the card is clicked", () => {
    const onSelect = vi.fn();

    renderWithProviders(
      <ProjectCard project={makeVideo()} onSelect={onSelect} />,
    );

    fireEvent.click(screen.getByText("Test Video"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
