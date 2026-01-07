import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "@dr.pogodin/react-helmet";
import { AuthProvider } from "../../context/AuthContext";

// Custom render function with all providers
export function renderWithProviders(
  ui: React.ReactElement,
  {
    initialEntries = ["/"],
    ...options
  }: RenderOptions & { initialEntries?: string[] } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <HelmetProvider>
          <AuthProvider>{children}</AuthProvider>
        </HelmetProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock data factories
export const mockUser = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  role: "user" as const,
  is_approved: true,
  profile_picture: null,
};

export const mockAdminUser = {
  ...mockUser,
  id: 2,
  username: "admin",
  email: "admin@example.com",
  role: "admin" as const,
};

export const mockProject = {
  id: 1,
  title: "Test Project",
  description: "Test Description",
  type: "Video",
  url: "https://example.com/test.mp4",
  thumbnail_url: "https://example.com/thumb.jpg",
  date: "2024-01-01",
  tags: ["test", "video"],
};

export const mockPaycheckData = {
  id: 1,
  filename: "paystub.pdf",
  upload_date: "2024-01-01T00:00:00Z",
  pay_period_start: "2024-01-01",
  pay_period_end: "2024-01-15",
  pay_date: "2024-01-20",
  gross_pay: 5000,
  net_pay: 3500,
  deductions: {
    federal_tax: 800,
    state_tax: 300,
    social_security: 310,
    medicare: 90,
  },
  employer_info: {
    name: "Test Company",
    address: "123 Test St",
  },
  hours_by_week: {},
  user_reported_hours: {},
};

// Async utilities
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

export * from "@testing-library/react";
