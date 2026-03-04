import React, { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Lock, User } from "lucide-react";
import { AuraButton, AuraCard, AuraInput } from "@/components/aura";
import { getApiUrl } from "@/utils/api";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = location.state?.from?.pathname || "/";

  const oauthError = searchParams.get("error");

  const handleGoogleLogin = () => {
    window.location.href = getApiUrl("/api/auth/google");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(getApiUrl("/api/auth/login"), {
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

        {(error || oauthError) && (
          <div className="bg-aura-error/10 border border-aura-error/20 text-aura-error p-4 rounded-lg mb-4 text-sm font-medium text-center">
            {error || "Google sign-in failed. Please try again."}
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

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-aura-text-secondary/20" />
          <span className="text-xs text-aura-text-secondary uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-aura-text-secondary/20" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-3 w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-aura-text-secondary/20 bg-transparent hover:bg-aura-text-primary/5 transition-colors text-sm font-medium text-aura-text-primary"
        >
          <GoogleIcon />
          Continue with Google
        </button>

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
