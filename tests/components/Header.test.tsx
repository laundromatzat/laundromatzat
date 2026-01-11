import React from "react";
import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../utils/testUtils";
import Header from "../../components/Header";

// Mock AuthContext
const mockLogout = vi.fn();
vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: null,
    logout: mockLogout,
  })),
}));

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all navigation links", () => {
    renderWithProviders(<Header />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Images")).toBeInTheDocument();
    expect(screen.getByText("Videos")).toBeInTheDocument();
    expect(screen.getByText("Cinemagraphs")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("Links")).toBeInTheDocument();
  });

  it("should show login link when user is not authenticated", () => {
    renderWithProviders(<Header />);

    const loginLinks = screen.getAllByText("Login");
    expect(loginLinks.length).toBeGreaterThan(0);
  });

  it("should show user profile when authenticated", async () => {
    const { useAuth } = await import("../../context/AuthContext");
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        role: "user",
        is_approved: true,
        profile_picture: null,
      },
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
    });

    renderWithProviders(<Header />);

    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("should show admin badge for admin users", async () => {
    const { useAuth } = await import("../../context/AuthContext");
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 1,
        username: "admin",
        email: "admin@example.com",
        role: "admin",
        is_approved: true,
        profile_picture: null,
      },
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
    });

    renderWithProviders(<Header />);

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("should toggle mobile menu when menu button is clicked", () => {
    renderWithProviders(<Header />);

    const menuButton = screen.getByLabelText("Toggle navigation");

    // Click to open menu
    fireEvent.click(menuButton);

    // Menu should be visible (checking for visible mobile links)
    const mobileLinks = screen.getAllByText("Home");
    expect(mobileLinks.length).toBeGreaterThan(1);
  });

  it("should call logout function when logout is clicked", async () => {
    const { useAuth } = await import("../../context/AuthContext");
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        role: "user",
        is_approved: true,
        profile_picture: null,
      },
      logout: mockLogout,
      login: vi.fn(),
      register: vi.fn(),
    });

    renderWithProviders(<Header />);

    const logoutButtons = screen.getAllByText("Log Out");
    fireEvent.click(logoutButtons[0]);

    expect(mockLogout).toHaveBeenCalled();
  });
});
