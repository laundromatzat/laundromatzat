import { http, HttpResponse } from "msw";

const API_URL = "http://localhost:4000/api";

export const handlers = [
  // Auth endpoints
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
        user: {
          id: 1,
          username: "testuser",
          email: "test@example.com",
          role: "user",
          is_approved: true,
        },
      });
    }

    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),

  // Paystub endpoints
  http.post(`${API_URL}/analyze`, async () => {
    return HttpResponse.json({
      id: 1,
      filename: "test.pdf",
      gross_pay: 5000,
      net_pay: 3500,
    });
  }),

  http.get(`${API_URL}/paychecks`, async () => {
    return HttpResponse.json([
      {
        id: 1,
        filename: "paystub1.pdf",
        upload_date: "2024-01-01T00:00:00Z",
        gross_pay: 5000,
        net_pay: 3500,
      },
    ]);
  }),

  http.put(`${API_URL}/paychecks/:id`, async () => {
    return HttpResponse.json({ success: true });
  }),

  http.delete(`${API_URL}/paychecks`, async () => {
    return HttpResponse.json({ success: true });
  }),
];
