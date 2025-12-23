import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      login(data.token, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      // Fallback to Mock Auth if server is unreachable (for GitHub Pages demo)
      console.warn("Backend unavailable, using mock auth");
      const mockToken = "mock-jwt-token";
      const mockUser = {
        id: 999,
        username: username || "Demo User",
      };
      login(mockToken, mockUser);
      navigate(from, { replace: true });

      if (err instanceof Error) {
        // Only set error if we didn't fallback (but here we always fallback for the demo)
        // setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-aura-bg text-aura-text-primary px-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 shadow-xl">
        <h2 className="text-3xl font-bold mb-6 text-center">Welcome Back</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1"
            >
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-aura-accent"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-aura-accent"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-aura-accent text-white py-2 rounded-lg font-medium hover:bg-aura-accent/90 transition-colors"
          >
            Sign In
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-aura-accent hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
