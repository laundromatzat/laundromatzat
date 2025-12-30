import { useState, useEffect } from "react";
import {
  Activity,
  BookOpen,
  Settings as SettingsIcon,
  Stethoscope,
} from "lucide-react";
import { getApiUrl } from "../../../utils/api";
import {
  UserSettings,
  AppState,
  DEFAULT_SETTINGS,
  TrainingExample,
  ModelProvider,
} from "./types";
import { SettingsPanel } from "./components/SettingsPanel";
import { StyleTrainer } from "./components/StyleTrainer";
import { NoteGenerator } from "./components/NoteGenerator";
import PageMetadata from "../../../components/PageMetadata";

function MediscribePage() {
  // Load initial state
  const [state, setState] = useState<AppState>(() => {
    const savedSettings = localStorage.getItem("mediscribe_settings");
    return {
      settings: savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS,
      examples: [], // Start empty, load from API
      currentView: "generator",
    };
  });

  // Load examples from API on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(getApiUrl("/api/mediscribe/examples"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) return { examples: [] }; // Handle unauthorized
        return res.json();
      })
      .then((data) => {
        if (data.examples) {
          // Map DB columns (original_text/rewritten_text) to frontend types (shorthand/fullNote)
          setState((prev) => ({
            ...prev,
            examples: data.examples.map(
              (e: { id: number; original: string; rewritten: string }) => ({
                id: e.id,
                shorthand: e.original, // mapped from API response 'original' -> DB 'original_text'
                fullNote: e.rewritten, // mapped from API response 'rewritten' -> DB 'rewritten_text'
                timestamp: Date.now(), // or store/retrieve timestamp if added to API
              })
            ),
          }));
        }
      })
      .catch((err) => console.error("Failed to load examples:", err));
  }, []);

  // Persist settings changes to localStorage (client preferences)
  useEffect(() => {
    localStorage.setItem("mediscribe_settings", JSON.stringify(state.settings));
  }, [state.settings]);

  const navigate = (view: AppState["currentView"]) => {
    setState((prev) => ({ ...prev, currentView: view }));
  };

  const updateSettings = (newSettings: UserSettings) => {
    setState((prev) => ({ ...prev, settings: newSettings }));
  };

  const addExample = async (example: TrainingExample) => {
    // Optimistic update
    setState((prev) => ({ ...prev, examples: [...prev.examples, example] }));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(getApiUrl("/api/mediscribe/examples"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          original: example.shorthand,
          rewritten: example.fullNote,
          tags: [], // TrainingExample doesn't have tags yet, defaulting to empty
        }),
      });
      if (!res.ok) throw new Error("Failed to save example");
      const data = await res.json();
      // Update with server ID
      setState((prev) => ({
        ...prev,
        examples: prev.examples.map((e) =>
          e.id === example.id ? { ...e, id: data.id.toString() } : e
        ),
      }));
    } catch (err) {
      console.error(err);
      // Revert on failure? Or just alert. verification step will check.
      alert("Failed to save example to server.");
    }
  };

  const removeExample = async (id: string) => {
    // Optimistic update
    setState((prev) => ({
      ...prev,
      examples: prev.examples.filter((e) => e.id !== id),
    }));

    try {
      const token = localStorage.getItem("token");
      await fetch(getApiUrl(`/api/mediscribe/examples/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error(err);
      alert("Failed to delete example from server.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-theme(spacing.20))] bg-aura-bg text-aura-text-primary font-sans rounded-xl overflow-hidden border border-aura-text-primary/10">
      <PageMetadata
        title="MediScribe AI"
        description="AI-powered medical documentation assistant with adaptive style learning."
      />

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-white/50 backdrop-blur-sm text-aura-text-primary flex flex-col z-10 shrink-0 border-r border-aura-text-primary/10">
        <div className="p-6 border-b border-aura-text-primary/10 flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-aura-accent" />
          <h1 className="text-xl font-bold tracking-tight text-aura-text-primary">
            MediScribe AI
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => navigate("generator")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              state.currentView === "generator"
                ? "bg-aura-accent text-white shadow-md shadow-aura-accent/20"
                : "text-aura-text-secondary hover:bg-aura-text-primary/5 hover:text-aura-text-primary"
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>Workspace</span>
          </button>

          <button
            onClick={() => navigate("training")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              state.currentView === "training"
                ? "bg-aura-accent text-white shadow-md shadow-aura-accent/20"
                : "text-aura-text-secondary hover:bg-aura-text-primary/5 hover:text-aura-text-primary"
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="flex-1 text-left">Style & Memory</span>
            <span className="bg-aura-text-primary/10 text-xs py-0.5 px-2 rounded-full text-aura-text-primary">
              {state.examples.length}
            </span>
          </button>

          <button
            onClick={() => navigate("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              state.currentView === "settings"
                ? "bg-aura-accent text-white shadow-md shadow-aura-accent/20"
                : "text-aura-text-secondary hover:bg-aura-text-primary/5 hover:text-aura-text-primary"
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-aura-text-primary/10">
          <div className="text-xs text-aura-text-secondary mb-2">
            Active Provider
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <div
              className={`w-2 h-2 rounded-full ${state.settings.provider === ModelProvider.GEMINI ? "bg-aura-accent shadow-aura-accent/50" : "bg-emerald-500 shadow-emerald-500/50"} shadow-lg`}
            ></div>
            {state.settings.provider === ModelProvider.GEMINI
              ? "Google Gemini"
              : "Local LLM"}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-aura-bg/50">
        <header className="bg-white/80 backdrop-blur-md border-b border-aura-text-primary/10 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-aura-text-primary">
            {state.currentView === "generator" && "Clinical Workspace"}
            {state.currentView === "training" && "Style Training"}
            {state.currentView === "settings" && "System Configuration"}
          </h2>
          <div className="text-sm text-aura-text-secondary">
            {state.examples.length > 0
              ? "Adaptive Style: Active"
              : "Adaptive Style: No Data"}
          </div>
        </header>

        <div className="p-6">
          {state.currentView === "generator" && (
            <NoteGenerator
              settings={state.settings}
              examples={state.examples}
              onLearn={addExample}
            />
          )}

          {state.currentView === "training" && (
            <StyleTrainer
              examples={state.examples}
              onAddExample={addExample}
              onRemoveExample={removeExample}
            />
          )}

          {state.currentView === "settings" && (
            <SettingsPanel settings={state.settings} onSave={updateSettings} />
          )}
        </div>
      </main>
    </div>
  );
}

export default MediscribePage;
