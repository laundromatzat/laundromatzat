import React from "react";
import { AuraButton, AuraCard } from "@/components/aura";
import { AssemblyStep } from "../hooks/useProjectState";

interface StepByStepGuideProps {
  steps: AssemblyStep[];
  currentStep: number;
  completedSteps: number[];
  onCompleteStep: (stepNumber: number) => void;
  onGoToStep: (stepNumber: number) => void;
  onBack: () => void;
  onFinish: () => void;
}

const StepByStepGuide: React.FC<StepByStepGuideProps> = ({
  steps,
  currentStep,
  completedSteps,
  onCompleteStep,
  onGoToStep,
  onBack,
  onFinish,
}) => {
  const activeStep = steps.find((s) => s.number === currentStep) || steps[0];
  const progressPercent =
    steps.length > 0
      ? Math.round((completedSteps.length / steps.length) * 100)
      : 0;
  const isLastStep = currentStep >= steps.length;
  const allComplete =
    completedSteps.length === steps.length && steps.length > 0;

  if (steps.length === 0) {
    return (
      <AuraCard variant="glass" padding="lg" className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-aura-accent mx-auto" />
          <p className="mt-6 text-xl text-aura-text-primary">
            Preparing assembly instructions...
          </p>
        </div>
      </AuraCard>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="bg-aura-surface-elevated rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-aura-text-secondary">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm font-semibold text-aura-accent">
            {progressPercent}% Complete
          </span>
        </div>
        <div className="h-2 bg-aura-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-aura-accent to-purple-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-3">
          {steps.map((step) => {
            const isComplete = completedSteps.includes(step.number);
            const isCurrent = step.number === currentStep;
            return (
              <button
                key={step.number}
                type="button"
                onClick={() => onGoToStep(step.number)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isComplete
                    ? "bg-aura-accent text-white"
                    : isCurrent
                      ? "bg-aura-accent/30 text-aura-accent ring-2 ring-aura-accent"
                      : "bg-aura-surface text-aura-text-secondary hover:bg-aura-surface-elevated"
                }`}
                title={step.title}
              >
                {isComplete ? "✓" : step.number}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Step Card */}
      {activeStep && !allComplete && (
        <AuraCard variant="elevated" padding="lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image */}
            <div className="order-2 lg:order-1">
              {activeStep.imageUrl ? (
                <div className="rounded-xl overflow-hidden bg-aura-surface aspect-video">
                  <img
                    src={activeStep.imageUrl}
                    alt={activeStep.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-xl bg-aura-surface aspect-video flex items-center justify-center">
                  <span className="text-6xl opacity-30">🧵</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2 space-y-4">
              <div>
                <span className="text-sm text-aura-accent font-semibold">
                  Step {activeStep.number}
                </span>
                <h2 className="text-2xl font-bold text-aura-text-primary mt-1">
                  {activeStep.title}
                </h2>
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-aura-text-secondary leading-relaxed">
                  {activeStep.instructions}
                </p>
              </div>

              {/* Tips */}
              {activeStep.tips.length > 0 && (
                <div className="bg-aura-accent/10 border-l-4 border-aura-accent rounded-r-lg p-4">
                  <p className="text-sm font-semibold text-aura-accent mb-2">
                    💡 Pro Tips
                  </p>
                  <ul className="space-y-1">
                    {activeStep.tips.map((tip, i) => (
                      <li
                        key={i}
                        className="text-sm text-aura-text-secondary flex gap-2"
                      >
                        <span className="text-aura-accent">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Step Actions */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-aura-border">
            <AuraButton
              variant="secondary"
              onClick={() => onGoToStep(currentStep - 1)}
              disabled={currentStep <= 1}
            >
              ← Previous
            </AuraButton>

            <div className="flex gap-3">
              {!completedSteps.includes(activeStep.number) && (
                <AuraButton
                  variant="accent"
                  onClick={() => {
                    onCompleteStep(activeStep.number);
                    if (currentStep < steps.length) {
                      onGoToStep(currentStep + 1);
                    }
                  }}
                >
                  Mark Complete ✓
                </AuraButton>
              )}

              {completedSteps.includes(activeStep.number) &&
                currentStep < steps.length && (
                  <AuraButton
                    variant="primary"
                    onClick={() => onGoToStep(currentStep + 1)}
                  >
                    Next Step →
                  </AuraButton>
                )}
            </div>
          </div>
        </AuraCard>
      )}

      {/* Completion Screen */}
      {allComplete && (
        <AuraCard variant="elevated" padding="lg" className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-aura-text-primary mb-2">
            Project Complete!
          </h2>
          <p className="text-aura-text-secondary mb-8 max-w-md mx-auto">
            Congratulations! You've completed all {steps.length} steps. Your
            handmade nylon project is ready to use.
          </p>
          <div className="flex justify-center gap-4">
            <AuraButton variant="secondary" onClick={onBack}>
              Review Steps
            </AuraButton>
            <AuraButton variant="accent" onClick={onFinish}>
              Start New Project
            </AuraButton>
          </div>
        </AuraCard>
      )}

      {/* Back to Materials */}
      <div className="flex justify-start">
        <AuraButton variant="ghost" size="sm" onClick={onBack}>
          ← Back to Materials
        </AuraButton>
      </div>
    </div>
  );
};

export default StepByStepGuide;
