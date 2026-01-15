import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "@/context/AuthContext"; // Unused
import { Lock, User } from "lucide-react";
import { AuraButton, AuraCard, AuraInput } from "@/components/aura";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  // const { login } = useAuth(); // Unused now that we redirect
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // NO auto-login anymore.
      // Show success feedback and redirect to Login.
      // login(data.token, data.user); // <--- REMOVED

      // Redirect to the pending approval page instead of login
      navigate("/registration-pending");
    } catch (err) {
      console.error("Registration error:", err);
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
          Create Account
        </h2>

        {error && (
          <div className="bg-aura-error/10 border border-aura-error/20 text-aura-error p-3 rounded-lg mb-4 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AuraInput
            label="Username"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
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
            placeholder="Create a password"
            required
            prefixIcon={<Lock size={18} />}
            fullWidth
          />

          <AuraInput
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
            prefixIcon={<Lock size={18} />}
            fullWidth
          />

          <AuraButton type="submit" variant="primary" fullWidth size="lg">
            Register
          </AuraButton>
        </form>

        <p className="mt-4 text-center text-sm text-aura-text-secondary">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-aura-text-primary font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </AuraCard>
    </div>
  );
}
