import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function RegistrationPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-aura-bg text-aura-text-primary px-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 shadow-xl text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-4">Registration Successful</h2>

        <div className="bg-aura-accent/10 border border-aura-accent/20 rounded-lg p-4 mb-8">
          <p className="text-lg mb-2 font-medium">
            Your account is pending approval.
          </p>
          <p className="text-sm text-aura-text-secondary">
            An administrator has been notified. You will be able to log in once
            your account has been approved.
          </p>
        </div>

        <Link
          to="/login"
          className="inline-block w-full bg-aura-text-primary text-white py-3 rounded-lg font-medium hover:bg-aura-text-primary/90 transition-colors"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
