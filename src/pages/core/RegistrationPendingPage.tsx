import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { AuraCard, AuraButton } from "@/components/aura";

export default function RegistrationPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-aura-bg text-aura-text-primary px-4">
      <AuraCard
        variant="glass"
        padding="lg"
        className="max-w-md w-full text-center shadow-aura-xl"
      >
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-aura-success-light rounded-full border border-aura-success/20">
            <CheckCircle className="w-12 h-12 text-aura-success" />
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-4">Registration Successful</h2>

        <AuraCard
          variant="bordered"
          padding="md"
          className="mb-8 bg-aura-info-light border-aura-info/20"
        >
          <p className="text-lg mb-2 font-medium">
            Your account is pending approval.
          </p>
          <p className="text-sm text-aura-text-secondary">
            An administrator has been notified. You will be able to log in once
            your account has been approved.
          </p>
        </AuraCard>

        <Link to="/login" className="block">
          <AuraButton variant="primary" fullWidth size="lg">
            Return to Login
          </AuraButton>
        </Link>
      </AuraCard>
    </div>
  );
}
