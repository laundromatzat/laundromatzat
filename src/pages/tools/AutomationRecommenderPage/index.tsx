import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Container from "@/components/Container";
import PageMetadata from "@/components/PageMetadata";
import { useLoading } from "@/context/LoadingContext";
import {
  analyzeForAutomations,
  type AutomationAnalysis,
  type AutomationCategory,
  type AutomationRecommendation,
  type EffortLevel,
  type ImpactLevel,
} from "@/services/automationRecommenderService";

const PLACEHOLDER = `Every Monday I manually compile a spreadsheet from 3 different Google Sheets and email it to the team.

I check 5 Slack channels every morning for updates and copy the important ones to a Notion doc.

I run the same 4 SQL queries every Friday and paste the results into a PowerPoint for leadership.

I manually rename and resize product photos before uploading them to our website.`;

const EFFORT_STYLES: Record<EffortLevel, string> = {
  low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-red-100 text-red-800 border-red-200",
};

const IMPACT_STYLES: Record<ImpactLevel, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-sky-100 text-sky-800 border-sky-200",
  high: "bg-violet-100 text-violet-800 border-violet-200",
};

const CATEGORY_ICON: Record<AutomationCategory, string> = {
  development: "⚙️",
  communication: "💬",
  data: "📊",
  files: "📁",
  scheduling: "📅",
  other: "✨",
};

function roiLabel(effort: EffortLevel, impact: ImpactLevel): string {
  const e = { low: 1, medium: 2, high: 3 }[effort];
  const i = { low: 1, medium: 2, high: 3 }[impact];
  const ratio = i / e;
  if (ratio >= 2) return "Excellent ROI";
  if (ratio >= 1) return "Good ROI";
  return "Low ROI";
}

function roiDotColor(effort: EffortLevel, impact: ImpactLevel): string {
  const e = { low: 1, medium: 2, high: 3 }[effort];
  const i = { low: 1, medium: 2, high: 3 }[impact];
  const ratio = i / e;
  if (ratio >= 2) return "bg-emerald-500";
  if (ratio >= 1) return "bg-amber-500";
  return "bg-slate-400";
}

interface CardProps {
  rec: AutomationRecommendation;
  index: number;
}

function RecommendationCard({ rec, index }: CardProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="relative rounded-2xl border border-aura-border bg-white shadow-aura-sm hover:shadow-aura-md transition-all duration-300 overflow-hidden animate-reveal"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      {rec.quickWin && (
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400"
        />
      )}

      <div className="p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0" aria-hidden>
              {CATEGORY_ICON[rec.category]}
            </span>
            <h3 className="font-semibold text-aura-text-primary leading-snug">
              {rec.title}
            </h3>
          </div>
          {rec.quickWin && (
            <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ⚡ Quick Win
            </span>
          )}
        </div>

        <p className="text-sm text-aura-text-secondary leading-relaxed mb-4">
          {rec.description}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${EFFORT_STYLES[rec.effortLevel]}`}
          >
            Effort: {rec.effortLevel}
          </span>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${IMPACT_STYLES[rec.impactLevel]}`}
          >
            Impact: {rec.impactLevel}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full border bg-aura-accent-light text-aura-text-secondary border-aura-border">
            ⏱ {rec.timeSavingsPerWeek}
          </span>
        </div>

        {/* ROI dot */}
        <div className="flex items-center gap-1.5 mb-3">
          <span
            className={`inline-block w-2 h-2 rounded-full ${roiDotColor(rec.effortLevel, rec.impactLevel)}`}
            aria-hidden
          />
          <span className="text-xs text-aura-text-tertiary">
            {roiLabel(rec.effortLevel, rec.impactLevel)}
          </span>
        </div>

        {/* Tools */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {rec.tools.map((tool) => (
            <span
              key={tool}
              className="text-xs px-2 py-0.5 rounded bg-aura-accent-light text-aura-text-tertiary font-mono"
            >
              {tool}
            </span>
          ))}
        </div>

        {/* Toggle */}
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-xs text-aura-text-tertiary hover:text-aura-text-primary transition-colors flex items-center gap-1"
          aria-expanded={expanded}
          aria-controls={`steps-${rec.id}`}
        >
          {expanded ? "▲ Hide steps" : "▼ How to implement"}
        </button>
      </div>

      {/* Expanded steps */}
      {expanded && (
        <div
          id={`steps-${rec.id}`}
          className="border-t border-aura-border px-5 pb-5 pt-4 bg-aura-surface-elevated"
        >
          <h4 className="text-xs font-semibold uppercase tracking-widest text-aura-text-tertiary mb-3">
            Implementation Steps
          </h4>
          <ol className="space-y-2">
            {rec.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-aura-text-secondary">
                <span className="shrink-0 w-5 h-5 rounded-full bg-aura-accent text-aura-text-primary text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {rec.exampleCommand && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-aura-text-tertiary mb-2">
                Example
              </h4>
              <code className="block font-mono text-xs bg-aura-text-primary text-aura-accent-light rounded-lg px-4 py-3 overflow-x-auto whitespace-pre">
                {rec.exampleCommand}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type FilterValue = "all" | "quickWins" | EffortLevel;

export default function AutomationRecommenderPage(): React.ReactElement {
  const [taskInput, setTaskInput] = useState("");
  const [analysis, setAnalysis] = useState<AutomationAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");
  const { setIsLoading } = useLoading();
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async () => {
    if (!taskInput.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setIsLoading(true);
    try {
      const result = await analyzeForAutomations(taskInput);
      setAnalysis(result);
      setFilter("all");
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Analysis failed. Please try again.",
      );
    } finally {
      setIsAnalyzing(false);
      setIsLoading(false);
    }
  };

  const quickWinCount = analysis?.recommendations.filter((r) => r.quickWin).length ?? 0;

  const filteredRecs =
    analysis?.recommendations.filter((rec) => {
      if (filter === "quickWins") return rec.quickWin;
      if (filter === "low" || filter === "medium" || filter === "high")
        return rec.effortLevel === filter;
      return true;
    }) ?? [];

  const filterOptions: Array<{ value: FilterValue; label: string }> = [
    { value: "all", label: `All (${analysis?.recommendations.length ?? 0})` },
    { value: "quickWins", label: `⚡ Quick Wins (${quickWinCount})` },
    { value: "low", label: "Low effort" },
    { value: "medium", label: "Medium effort" },
    { value: "high", label: "High effort" },
  ];

  return (
    <Container className="space-y-10 pt-8 pb-16">
      <PageMetadata
        title="Automation Recommender"
        description="Describe your repetitive tasks and get AI-powered automation recommendations to reclaim your time."
        path="/tools/automation-recommender"
        type="article"
      />

      {/* Header */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-aura-text-secondary">
          <Link to="/tools" className="text-brand-accent hover:underline">
            ← back to tools
          </Link>
          <span>·</span>
          <span>Powered by Gemini 2.5 Flash</span>
        </div>

        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-aura-text-primary">
              Automation Recommender
            </h1>
            <p className="mt-2 text-lg text-aura-text-secondary max-w-2xl">
              Describe your repetitive workflows and let AI surface the
              highest-value automation opportunities — ranked by effort vs.
              impact.
            </p>
          </div>

          {analysis && (
            <div className="hidden lg:flex gap-6 shrink-0 pt-1">
              <div className="text-center">
                <div className="text-2xl font-bold text-aura-text-primary">
                  {analysis.recommendations.length}
                </div>
                <div className="text-xs uppercase tracking-wide text-aura-text-tertiary">
                  Opportunities
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {quickWinCount}
                </div>
                <div className="text-xs uppercase tracking-wide text-aura-text-tertiary">
                  Quick Wins
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Dark terminal input panel */}
      <section
        className="relative rounded-3xl overflow-hidden border border-aura-text-primary/20 shadow-aura-xl"
        style={{ background: "#1a1916" }}
      >
        {/* Subtle dot-grid background */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative p-6 sm:p-8">
          {/* Fake terminal chrome */}
          <div className="flex items-center gap-2 mb-6">
            <span
              className="w-3 h-3 rounded-full bg-red-500/70"
              aria-hidden
            />
            <span
              className="w-3 h-3 rounded-full bg-amber-400/70"
              aria-hidden
            />
            <span
              className="w-3 h-3 rounded-full bg-emerald-500/70"
              aria-hidden
            />
            <span className="ml-3 font-mono text-xs text-white/30">
              automation-recommender ~ describe workflows
            </span>
          </div>

          <div className="space-y-4">
            <label
              htmlFor="task-input"
              className="block text-sm font-medium text-white/80"
            >
              Describe your repetitive tasks and workflows
            </label>
            <textarea
              id="task-input"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              rows={7}
              placeholder={PLACEHOLDER}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/20 resize-none focus:outline-none focus:border-emerald-500/50 focus:bg-black/40 transition-colors"
              aria-describedby="task-hint"
            />
            <p id="task-hint" className="text-xs text-white/30">
              Tip: Include how often the task happens and roughly how long it
              takes. More detail → better recommendations.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing || !taskInput.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <span
                      className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                      aria-hidden
                    />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <span aria-hidden>⚡</span>
                    Find Automations
                  </>
                )}
              </button>

              {taskInput === "" && (
                <button
                  type="button"
                  onClick={() => setTaskInput(PLACEHOLDER)}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Try example tasks →
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-aura-error/30 bg-aura-error-light p-4 text-sm text-aura-error"
        >
          {error}
        </div>
      )}

      {/* Results */}
      {analysis && (
        <section ref={resultsRef} className="space-y-6">
          {/* Summary banner */}
          <div className="flex items-start gap-4 rounded-2xl border border-aura-border bg-aura-surface p-5 shadow-aura-sm">
            <span className="text-2xl shrink-0" aria-hidden>
              🎯
            </span>
            <div>
              <p className="font-medium text-aura-text-primary">
                {analysis.summary}
              </p>
              {analysis.topPriority && (
                <p className="mt-1 text-sm text-aura-text-secondary">
                  <span className="font-semibold">Start here:</span>{" "}
                  {analysis.topPriority}
                </p>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filter recommendations by effort"
          >
            {filterOptions.map(({ value, label }) => (
              <button
                key={value}
                role="tab"
                aria-selected={filter === value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === value
                    ? "bg-aura-text-primary text-white"
                    : "border border-aura-border bg-aura-surface text-aura-text-secondary hover:border-aura-text-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Cards grid */}
          {filteredRecs.length === 0 ? (
            <p className="text-sm text-aura-text-tertiary">
              No recommendations match this filter.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredRecs.map((rec, index) => (
                <RecommendationCard key={rec.id} rec={rec} index={index} />
              ))}
            </div>
          )}
        </section>
      )}
    </Container>
  );
}
