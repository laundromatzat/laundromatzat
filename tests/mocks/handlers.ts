import { http, HttpResponse } from "msw";

const API_URL = "http://localhost:4000/api";

export const handlers = [
  // ============================================
  // Auth endpoints
  // ============================================
  http.post(`${API_URL}/auth/register`, async () => {
    return HttpResponse.json(
      { message: "Registration successful" },
      { status: 201 }
    );
  }),

  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as {
      username: string;
      password: string;
    };

    if (body.username === "testuser" && body.password === "password") {
      return HttpResponse.json({
        token: "mock-jwt-token",
        refreshToken: "mock-refresh-token",
        user: {
          id: 1,
          username: "testuser",
          email: "test@example.com",
          role: "user",
          is_approved: true,
        },
      });
    }

    if (body.username === "admin" && body.password === "admin") {
      return HttpResponse.json({
        token: "mock-admin-token",
        refreshToken: "mock-admin-refresh-token",
        user: {
          id: 2,
          username: "admin",
          email: "admin@example.com",
          role: "admin",
          is_approved: true,
        },
      });
    }

    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),

  http.get(`${API_URL}/auth/me`, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token === "mock-jwt-token" || token === "valid-backend-token") {
      return HttpResponse.json({
        user: {
          id: 1,
          username: "testuser",
          email: "test@example.com",
          role: "user",
          is_approved: true,
          profile_picture: null,
        },
      });
    }

    if (token === "mock-admin-token") {
      return HttpResponse.json({
        user: {
          id: 2,
          username: "admin",
          email: "admin@example.com",
          role: "admin",
          is_approved: true,
          profile_picture: null,
        },
      });
    }

    return HttpResponse.json({ error: "Invalid token" }, { status: 401 });
  }),

  http.post(`${API_URL}/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refreshToken: string };
    if (body.refreshToken === "mock-refresh-token") {
      return HttpResponse.json({
        token: "new-mock-jwt-token",
        refreshToken: "new-mock-refresh-token",
      });
    }
    return HttpResponse.json(
      { error: "Invalid refresh token" },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/auth/logout`, async () => {
    return HttpResponse.json({ message: "Logged out successfully" });
  }),

  // ============================================
  // Paystub endpoints
  // ============================================
  http.post(`${API_URL}/analyze`, async () => {
    return HttpResponse.json({
      id: 1,
      filename: "test.pdf",
      payPeriodStart: "2024-01-01",
      payPeriodEnd: "2024-01-15",
      paidHours: [{ category: "RegularPay", hours: 80 }],
      bankedHours: [{ category: "Vacation", hours: 120 }],
      userReportedHours: {},
    });
  }),

  http.get(`${API_URL}/paychecks`, async () => {
    return HttpResponse.json([
      {
        id: 1,
        filename: "paystub1.pdf",
        upload_date: "2024-01-01T00:00:00Z",
        payPeriodStart: "2024-01-01",
        payPeriodEnd: "2024-01-15",
        paidHours: [{ category: "RegularPay", hours: 80 }],
        bankedHours: [{ category: "Vacation", hours: 120 }],
        userReportedHours: {},
      },
    ]);
  }),

  http.put(`${API_URL}/paychecks/:id`, async () => {
    return HttpResponse.json({ message: "Updated successfully" });
  }),

  http.delete(`${API_URL}/paychecks`, async () => {
    return HttpResponse.json({ message: "All data cleared successfully" });
  }),

  // ============================================
  // Links endpoints
  // ============================================
  http.get(`${API_URL}/links`, async () => {
    return HttpResponse.json([
      {
        id: 1,
        title: "Example Link",
        url: "https://example.com",
        description: "A test link",
        tags: ["test"],
        image_url: "",
      },
    ]);
  }),

  http.post(`${API_URL}/links`, async ({ request }) => {
    const body = (await request.json()) as {
      title: string;
      url: string;
      description?: string;
      tags?: string[];
    };
    return HttpResponse.json(
      {
        id: 1,
        ...body,
        tags: body.tags || [],
      },
      { status: 201 }
    );
  }),

  http.put(`${API_URL}/links/:id`, async () => {
    return HttpResponse.json({ message: "Link updated successfully" });
  }),

  http.delete(`${API_URL}/links/:id`, async () => {
    return HttpResponse.json({ message: "Link deleted successfully" });
  }),

  // ============================================
  // Dev Tasks endpoints
  // ============================================
  http.get(`${API_URL}/dev-tasks`, async () => {
    return HttpResponse.json([
      {
        id: 1,
        title: "Test Task",
        description: "A test task",
        category: "feature",
        priority: "medium",
        status: "new",
      },
    ]);
  }),

  http.post(`${API_URL}/dev-tasks`, async ({ request }) => {
    const body = (await request.json()) as { title: string };
    return HttpResponse.json(
      {
        id: 1,
        ...body,
        category: "feature",
        priority: "medium",
        status: "new",
      },
      { status: 201 }
    );
  }),

  http.put(`${API_URL}/dev-tasks/:id`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 1, ...body });
  }),

  http.delete(`${API_URL}/dev-tasks/:id`, async () => {
    return HttpResponse.json({ message: "Dev task deleted successfully" });
  }),

  // ============================================
  // Admin endpoints
  // ============================================
  http.get(`${API_URL}/admin/users`, async () => {
    return HttpResponse.json([
      { id: 1, username: "admin", role: "admin", is_approved: true },
      { id: 2, username: "testuser", role: "user", is_approved: true },
      { id: 3, username: "pending", role: "user", is_approved: false },
    ]);
  }),

  http.patch(`${API_URL}/admin/users/:id/approve`, async () => {
    return HttpResponse.json({ message: "User approved" });
  }),

  http.delete(`${API_URL}/admin/users/:id`, async () => {
    return HttpResponse.json({ message: "User deleted" });
  }),

  http.get(`${API_URL}/admin/stats`, async () => {
    return HttpResponse.json({
      totalUsers: 10,
      pendingApprovals: 2,
      activeUsers: 5,
      uptime: 3600,
      memory: {
        heapUsed: 50000000,
        heapTotal: 100000000,
        rss: 150000000,
      },
    });
  }),

  http.get(`${API_URL}/admin/ai-usage`, async () => {
    return HttpResponse.json({
      total: { tokens: 10000, cost: 5.0 },
      byUser: [{ username: "testuser", tokens: 5000, cost: 2.5 }],
      byTool: [{ tool_name: "paystub", tokens: 8000, cost: 4.0 }],
      byModel: [{ model_name: "gemini-pro", tokens: 10000, cost: 5.0 }],
      recent: [{ date: "2024-01-01", tokens: 1000, cost: 0.5 }],
    });
  }),

  // ============================================
  // Color Palettes endpoints
  // ============================================
  http.get(`${API_URL}/color-palettes`, async () => {
    return HttpResponse.json({
      palettes: [
        {
          id: 1,
          file_name: "sunset.jpg",
          palette_json: '["#FF5733","#33FF57"]',
          created_at: "2024-01-01T00:00:00Z",
        },
      ],
    });
  }),

  http.post(`${API_URL}/color-palettes`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 1, ...body });
  }),

  http.delete(`${API_URL}/color-palettes/:id`, async () => {
    return HttpResponse.json({ success: true });
  }),

  // ============================================
  // Wood Carving endpoints
  // ============================================
  http.get(`${API_URL}/wood-carving/projects`, async () => {
    return HttpResponse.json({
      projects: [
        {
          id: 1,
          description: "Bear sculpture",
          variations: [],
          selectedVariation: null,
          blueprint: null,
          createdAt: "2024-01-01T00:00:00Z",
        },
      ],
    });
  }),

  http.post(`${API_URL}/wood-carving/projects`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 1,
      ...body,
      variations: [],
      selectedVariation: null,
      blueprint: null,
      createdAt: new Date().toISOString(),
    });
  }),

  http.put(`${API_URL}/wood-carving/projects/:id`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 1, ...body });
  }),

  http.delete(`${API_URL}/wood-carving/projects/:id`, async () => {
    return HttpResponse.json({ success: true });
  }),

  // ============================================
  // Nylon Fabric endpoints
  // ============================================
  http.get(`${API_URL}/nylon-fabric-designs`, async () => {
    return HttpResponse.json({
      designs: [
        {
          id: 1,
          design_name: "Geometric Pattern",
          instruction_image_url: "",
          nylon_image_url: "",
          prompts: null,
          created_at: "2024-01-01T00:00:00Z",
        },
      ],
    });
  }),

  http.post(`${API_URL}/nylon-fabric-designs`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 1,
      ...body,
      created_at: new Date().toISOString(),
    });
  }),

  http.delete(`${API_URL}/nylon-fabric-designs/:id`, async () => {
    return HttpResponse.json({ success: true });
  }),
];
