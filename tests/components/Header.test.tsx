import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../utils/testUtils";
import Header from "@/components/Header";

describe("Header", () => {
  it("renders the site title linking back to the library", () => {
    renderWithProviders(<Header />);

    const brand = screen.getByRole("link", { name: "laundromatzat.com" });
    expect(brand).toHaveAttribute("href", "/");
  });

  it("labels the site as the music video library", () => {
    renderWithProviders(<Header />);

    expect(screen.getByText("Music Videos")).toBeInTheDocument();
  });
});
