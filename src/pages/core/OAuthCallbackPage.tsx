import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/utils/api";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      navigate("/login?error=oauth_failed", { replace: true });
      return;
    }

    // Exchange the authorization code for tokens (secure, single-use)
    fetch(getApiUrl("/api/auth/exchange-code"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to exchange code");
        return res.json();
      })
      .then(({ token, user }) => {
        login(token, user);
        navigate("/", { replace: true, state: { welcome: true } });
      })
      .catch(() => {
        navigate("/login?error=oauth_failed", { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-aura-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-aura-text-secondary border-t-aura-text-primary rounded-full animate-spin" />
        <p className="text-aura-text-secondary text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
