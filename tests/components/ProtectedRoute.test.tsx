/**
 * ProtectedRoute Component Tests
 *
 * Tests cover:
 * - Redirect when unauthenticated
 * - Loading state display
 * - Render children when authenticated
 * - Location state preservation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "../../src/components/ProtectedRoute";
import { useAuth } from "../../src/context/AuthContext";
import React from "react";

// Mock the AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock API utility
vi.mock("@/utils/api", () => ({
  getApiUrl: (path: string) => `http://localhost:4000${path}`,
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

// Helper component to display current location (for redirect testing)
function LocationDisplay() {
  const location = useLocation();
  return (
    <div>
      <span data-testid="current-path">{location.pathname}</span>
      <span data-testid="from-state">
        {location.state?.from?.pathname || "no-from"}
      </span>
    </div>
  );
}

// Protected content component
function ProtectedContent() {
  return <div data-testid="protected-content">Protected Content</div>;
}

// Login page component
function LoginPage() {
  return (
    <div>
      <span data-testid="login-page">Login Page</span>
      <LocationDisplay />
    </div>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // LOADING STATE TESTS
  // ============================================
  describe("Loading State", () => {
    it("should display loading spinner when auth is loading", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        loading: true,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={["/protected"]}>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Should show spinner (the animate-spin class)
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();

      // Should NOT show protected content yet
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });

    it("should render loading container with proper styling", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        loading: true,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // Check for centering container
      const container = document.querySelector(".flex.items-center.justify-center");
      expect(container).toBeInTheDocument();
    });
  });

  // ============================================
  // UNAUTHENTICATED REDIRECT TESTS
  // ============================================
  describe("Unauthenticated Redirect", () => {
    it("should redirect to /login when user is not authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should redirect to login
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
      expect(screen.getByTestId("current-path")).toHaveTextContent("/login");
    });

    it("should preserve original location in state when redirecting", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should have original path in state
      expect(screen.getByTestId("from-state")).toHaveTextContent("/dashboard");
    });

    it("should NOT show protected content when not authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });
  });

  // ============================================
  // AUTHENTICATED ACCESS TESTS
  // ============================================
  describe("Authenticated Access", () => {
    it("should render children when user is authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: "testuser" },
        token: "valid-token",
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={["/protected"]}>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should NOT show loading spinner when authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: "testuser" },
        token: "valid-token",
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      const spinner = document.querySelector(".animate-spin");
      expect(spinner).not.toBeInTheDocument();
    });

    it("should NOT redirect when user is authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: "testuser" },
        token: "valid-token",
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should NOT be on login page
      expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
      // Should show protected content
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });

  // ============================================
  // NESTED ROUTES TESTS
  // ============================================
  describe("Nested Routes", () => {
    it("should work with nested protected routes", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: "testuser" },
        token: "valid-token",
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={["/parent/child"]}>
          <Routes>
            <Route
              path="/parent/*"
              element={
                <ProtectedRoute>
                  <Routes>
                    <Route
                      path="child"
                      element={<div data-testid="nested-child">Nested Child</div>}
                    />
                  </Routes>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId("nested-child")).toBeInTheDocument();
    });

    it("should protect all nested routes when parent is protected", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        token: null,
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <MemoryRouter initialEntries={["/parent/child"]}>
          <Routes>
            <Route
              path="/parent/*"
              element={
                <ProtectedRoute>
                  <Routes>
                    <Route
                      path="child"
                      element={<div data-testid="nested-child">Nested Child</div>}
                    />
                  </Routes>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should redirect to login, not show nested content
      expect(screen.queryByTestId("nested-child")).not.toBeInTheDocument();
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe("Edge Cases", () => {
    it("should handle user object with minimal properties", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1 }, // minimal user object
        token: "valid-token",
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <ProtectedContent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("should render multiple children correctly", () => {
      mockUseAuth.mockReturnValue({
        user: { id: 1, username: "testuser" },
        token: "valid-token",
        loading: false,
        login: vi.fn(),
        logout: vi.fn(),
      });

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div data-testid="child-1">Child 1</div>
            <div data-testid="child-2">Child 2</div>
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
    });
  });
});
