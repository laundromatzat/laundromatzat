/**
 * AuthContext Tests
 *
 * Tests cover:
 * - Token persistence in localStorage
 * - Token validation on mount
 * - Login/logout state transitions
 * - API error handling
 * - Mock token support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../../src/context/AuthContext";
import React from "react";

// Mock the API URL utility
vi.mock("@/utils/api", () => ({
  getApiUrl: (path: string) => `http://localhost:4000${path}`,
}));

// Helper component to access auth context
function AuthConsumer({
  onAuth,
}: {
  onAuth: (auth: ReturnType<typeof useAuth>) => void;
}) {
  const auth = useAuth();
  React.useEffect(() => {
    onAuth(auth);
  }, [auth, onAuth]);
  return (
    <div>
      <span data-testid="loading">{auth.loading ? "loading" : "ready"}</span>
      <span data-testid="user">{auth.user?.username || "no-user"}</span>
      <span data-testid="token">{auth.token || "no-token"}</span>
    </div>
  );
}

// Helper component for testing login/logout
function AuthTester() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{auth.loading ? "loading" : "ready"}</span>
      <span data-testid="user">{auth.user?.username || "no-user"}</span>
      <span data-testid="token">{auth.token || "no-token"}</span>
      <button
        data-testid="login-btn"
        onClick={() =>
          auth.login("test-token", { id: 1, username: "testuser" })
        }
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={() => auth.logout()}>
        Logout
      </button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset fetch mock
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ============================================
  // INITIAL STATE TESTS
  // ============================================
  describe("Initial State", () => {
    it("should start with loading state when no token exists", async () => {
      render(
        <AuthProvider>
          <AuthTester />
        </AuthProvider>
      );

      // Should quickly transition to ready state with no user
      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });
      expect(screen.getByTestId("user")).toHaveTextContent("no-user");
      expect(screen.getByTestId("token")).toHaveTextContent("no-token");
    });

    it("should have null user and token initially", async () => {
      let authState: ReturnType<typeof useAuth> | null = null;

      render(
        <AuthProvider>
          <AuthConsumer onAuth={(auth) => (authState = auth)} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState?.loading).toBe(false);
      });

      expect(authState?.user).toBeNull();
      expect(authState?.token).toBeNull();
    });
  });

  // ============================================
  // TOKEN PERSISTENCE TESTS
  // ============================================
  describe("Token Persistence", () => {
    it("should store token in localStorage on login", async () => {
      render(
        <AuthProvider>
          <AuthTester />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      act(() => {
        screen.getByTestId("login-btn").click();
      });

      expect(localStorage.getItem("token")).toBe("test-token");
    });

    it("should remove token from localStorage on logout", async () => {
      // Start with a token
      localStorage.setItem("token", "mock-jwt-token");

      render(
        <AuthProvider>
          <AuthTester />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      act(() => {
        screen.getByTestId("logout-btn").click();
      });

      expect(localStorage.getItem("token")).toBeNull();
    });

    it("should read token from localStorage on mount", async () => {
      // Set up mock token (which gets special handling)
      localStorage.setItem("token", "mock-jwt-token");

      render(
        <AuthProvider>
          <AuthTester />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      // Mock token should be recognized
      expect(screen.getByTestId("token")).toHaveTextContent("mock-jwt-token");
      expect(screen.getByTestId("user")).toHaveTextContent("Demo User");
    });
  });

  // ============================================
  // TOKEN VALIDATION TESTS
  // ============================================
  describe("Token Validation", () => {
    it("should validate token with backend on mount", async () => {
      localStorage.setItem("token", "valid-backend-token");

      const mockUser = { id: 1, username: "backenduser", role: "user" };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      });

      render(
        <AuthProvider>
          <AuthTester />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/auth/me",
        {
          headers: { Authorization: "Bearer valid-backend-token" },
        }
      );

      expect(screen.getByTestId("user")).toHaveTextContent("backenduser");
      expect(screen.getByTestId("token")).toHaveTextContent(
        "valid-backend-token"
      );
    });

    it("should clear invalid token on validation failure", async () => {
      localStorage.setItem("token", "invalid-token");

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      render(
        <AuthProvider>
          <AuthTester />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      // Token should be cleared
      expect(localStorage.getItem("token")).toBeNull();
      expect(screen.getByTestId("user")).toHaveTextContent("no-user");
      expect(screen.getByTestId("token")).toHaveTextContent("no-token");
    });

    it("should handle network errors during validation", async () => {
      localStorage.setItem("token", "some-token");

      global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

      render(
        <AuthProvider>
          <AuthTester />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      // Token should be cleared on error
      expect(localStorage.getItem("token")).toBeNull();
      expect(screen.getByTestId("user")).toHaveTextContent("no-user");
    });
  });

  // ============================================
  // MOCK TOKEN SUPPORT TESTS
  // ============================================
  describe("Mock Token Support", () => {
    it("should recognize mock-jwt-token without backend validation", async () => {
      localStorage.setItem("token", "mock-jwt-token");

      // Fetch should NOT be called for mock token
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy;

      render(
        <AuthProvider>
          <AuthTester />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      // Fetch should not have been called
      expect(fetchSpy).not.toHaveBeenCalled();

      // Mock user should be set
      expect(screen.getByTestId("user")).toHaveTextContent("Demo User");
      expect(screen.getByTestId("token")).toHaveTextContent("mock-jwt-token");
    });

    it("should set user id to 999 for mock token", async () => {
      localStorage.setItem("token", "mock-jwt-token");
      let authState: ReturnType<typeof useAuth> | null = null;

      render(
        <AuthProvider>
          <AuthConsumer onAuth={(auth) => (authState = auth)} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState?.loading).toBe(false);
      });

      expect(authState?.user?.id).toBe(999);
    });
  });

  // ============================================
  // LOGIN/LOGOUT STATE TRANSITIONS TESTS
  // ============================================
  describe("Login/Logout State Transitions", () => {
    it("should update state on login", async () => {
      let authState: ReturnType<typeof useAuth> | null = null;

      render(
        <AuthProvider>
          <AuthConsumer onAuth={(auth) => (authState = auth)} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState?.loading).toBe(false);
      });

      // Initially no user
      expect(authState?.user).toBeNull();

      // Login
      act(() => {
        authState?.login("new-token", { id: 5, username: "newuser" });
      });

      expect(authState?.user?.id).toBe(5);
      expect(authState?.user?.username).toBe("newuser");
      expect(authState?.token).toBe("new-token");
    });

    it("should clear state on logout", async () => {
      // Start logged in
      localStorage.setItem("token", "mock-jwt-token");
      let authState: ReturnType<typeof useAuth> | null = null;

      render(
        <AuthProvider>
          <AuthConsumer onAuth={(auth) => (authState = auth)} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState?.loading).toBe(false);
      });

      // Initially logged in
      expect(authState?.user).not.toBeNull();

      // Logout
      act(() => {
        authState?.logout();
      });

      expect(authState?.user).toBeNull();
      expect(authState?.token).toBeNull();
    });

    it("should support multiple login/logout cycles", async () => {
      let authState: ReturnType<typeof useAuth> | null = null;

      render(
        <AuthProvider>
          <AuthConsumer onAuth={(auth) => (authState = auth)} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState?.loading).toBe(false);
      });

      // Cycle 1: Login
      act(() => {
        authState?.login("token1", { id: 1, username: "user1" });
      });
      expect(authState?.user?.username).toBe("user1");

      // Cycle 1: Logout
      act(() => {
        authState?.logout();
      });
      expect(authState?.user).toBeNull();

      // Cycle 2: Login with different user
      act(() => {
        authState?.login("token2", { id: 2, username: "user2" });
      });
      expect(authState?.user?.username).toBe("user2");
      expect(authState?.token).toBe("token2");
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================
  describe("Error Handling", () => {
    it("should handle JSON parsing errors in API response", async () => {
      localStorage.setItem("token", "some-token");

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      render(
        <AuthProvider>
          <AuthTester />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      // Should handle gracefully - token cleared
      expect(localStorage.getItem("token")).toBeNull();
    });

    it("should complete loading even when API throws", async () => {
      localStorage.setItem("token", "some-token");

      // Mock a rejected promise instead of synchronous throw
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("Fetch failed"));

      render(
        <AuthProvider>
          <AuthTester />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      });

      // Loading should complete, token should be cleared
      expect(screen.getByTestId("user")).toHaveTextContent("no-user");
    });
  });

  // ============================================
  // HOOK USAGE TESTS
  // ============================================
  describe("useAuth Hook", () => {
    it("should throw error when used outside AuthProvider", () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<AuthTester />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleError.mockRestore();
    });

    it("should provide all expected properties", async () => {
      let authState: ReturnType<typeof useAuth> | null = null;

      render(
        <AuthProvider>
          <AuthConsumer onAuth={(auth) => (authState = auth)} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState?.loading).toBe(false);
      });

      // Check all properties exist
      expect(authState).toHaveProperty("user");
      expect(authState).toHaveProperty("token");
      expect(authState).toHaveProperty("login");
      expect(authState).toHaveProperty("logout");
      expect(authState).toHaveProperty("loading");

      // Check functions are callable
      expect(typeof authState?.login).toBe("function");
      expect(typeof authState?.logout).toBe("function");
    });
  });
});
