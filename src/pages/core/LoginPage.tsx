import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Lock, User } from "lucide-react";
import { AuraButton, AuraCard, AuraInput } from "@/components/aura";

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
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      login(data.token, data.user);
      navigate(from, { replace: true, state: { welcome: true } });
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-aura-bg text-aura-text-primary px-4">
      <AuraCard
        variant="glass"
        padding="lg"
        className="max-w-md w-full animate-in-up"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-aura-text-primary">
          Welcome Back
        </h2>

        {error && (
          <div className="bg-aura-error/10 border border-aura-error/20 text-aura-error p-4 rounded-lg mb-4 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuraInput
            label="Username"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            prefixIcon={<User size={18} />}
            fullWidth
          />

          <AuraInput
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            prefixIcon={<Lock size={18} />}
            fullWidth
          />

          <AuraButton type="submit" variant="primary" fullWidth size="lg">
            Sign In
          </AuraButton>
        </form>

        <p className="mt-4 text-center text-sm text-aura-text-secondary">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-aura-text-primary font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </AuraCard>
    </div>
  );
}
