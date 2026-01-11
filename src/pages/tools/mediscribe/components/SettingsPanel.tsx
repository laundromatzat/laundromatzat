import React, { useState } from "react";
import { UserSettings, ModelProvider } from "../types";
import { checkLocalHealth, HealthCheckResult } from "../services/llmService";
import { Button } from "./Button";
import {
  CheckCircle2,
  AlertCircle,
  Server,
  Cpu,
  Zap,
  WifiOff,
  FileQuestion,
} from "lucide-react";

interface SettingsPanelProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [healthCheck, setHealthCheck] = useState<{
    status: "idle" | "checking" | "ok" | "error";
    result?: HealthCheckResult;
  }>({ status: "idle" });

  const handleChange = (key: keyof UserSettings, value: unknown) => {
    const newSettings = { ...localSettings, [key]: value } as UserSettings;
    setLocalSettings(newSettings);
    onSave(newSettings);
  };

  const runHealthCheck = async () => {
    setHealthCheck({ status: "checking" });
    const result = await checkLocalHealth(
      localSettings.localModelUrl,
      localSettings.localModelName
    );
    if (result.ok) {
      setHealthCheck({ status: "ok", result });
    } else {
      setHealthCheck({ status: "error", result });
    }
  };

  const renderErrorGuidance = (result: HealthCheckResult) => {
    if (!result || result.ok) return null;

    let icon = <AlertCircle className="w-5 h-5 text-red-600" />;
    let title = "Connection Error";
    let steps = [];

    switch (result.errorType) {
      case "NETWORK_CORS":
        icon = <WifiOff className="w-5 h-5 text-red-600" />;
        title = "Network or CORS Issue";
        steps = [
          "Ensure your local model server (e.g., Ollama) is running.",
          "BROWSER SECURITY (CORS): Browsers block requests to localhost by default.",
          'For Ollama: Stop the server and run `OLLAMA_ORIGINS="*" ollama serve`',
          "For LM Studio: Enable 'CORS' in the server settings.",
        ];
        break;
      case "MODEL_NOT_FOUND":
        icon = <FileQuestion className="w-5 h-5 text-orange-600" />;
        title = "Model Not Found (404)";
        steps = [
          `The server is reachable, but model '${localSettings.localModelName}' was not found.`,
          "For Ollama: Run `ollama pull ${localSettings.localModelName}` in your terminal.",
          "Check for typos in the model name.",
        ];
        break;
      case "URL_INVALID":
        title = "Invalid URL";
        steps = [
          "Check the URL format. It usually ends in /api/generate (Ollama) or /v1/chat/completions.",
        ];
        break;
      case "INVALID_FORMAT":
        title = "Unexpected Response";
        steps = [
          "The server replied, but the data wasn't what we expected. Check if the API endpoint is compatible with Ollama/OpenAI formats.",
        ];
        break;
      default:
        title = "Server Error";
        steps = [
          `Error Code: ${result.message}`,
          "Check your server logs for details.",
          "Ensure the port (usually 11434) is correct.",
        ];
    }

    return (
      <div className="mt-4 p-4 bg-red-50 text-red-900 text-sm rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-2 font-bold mb-2">
          {icon}
          {title}
        </div>
        <div className="bg-white/60 p-2 rounded border border-red-100 font-mono text-xs text-red-700 mb-3 whitespace-pre-wrap">
          {result.detailedError}
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-1">
          Troubleshooting Steps
        </div>
        <ul className="list-disc ml-4 space-y-1 text-xs text-red-800">
          {steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Server className="w-6 h-6 text-blue-600" />
          Model Configuration
        </h2>
        <p className="text-slate-500 mt-1">
          Choose between cloud intelligence or local privacy.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Provider Selection */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 block">
            AI Provider
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleChange("provider", ModelProvider.GEMINI)}
              className={`flex flex-col items-center p-6 rounded-lg border-2 transition-all ${
                localSettings.provider === ModelProvider.GEMINI
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-100 hover:border-slate-200 bg-slate-50"
              }`}
            >
              <Cpu
                className={`w-8 h-8 mb-3 ${localSettings.provider === ModelProvider.GEMINI ? "text-blue-600" : "text-slate-400"}`}
              />
              <span className="font-semibold text-slate-800">
                Google Gemini
              </span>
              <span className="text-xs text-slate-500 mt-1">
                High Accuracy & Speed
              </span>
            </button>

            <button
              onClick={() => handleChange("provider", ModelProvider.LOCAL)}
              className={`flex flex-col items-center p-6 rounded-lg border-2 transition-all ${
                localSettings.provider === ModelProvider.LOCAL
                  ? "border-green-500 bg-green-50"
                  : "border-slate-100 hover:border-slate-200 bg-slate-50"
              }`}
            >
              <Server
                className={`w-8 h-8 mb-3 ${localSettings.provider === ModelProvider.LOCAL ? "text-green-600" : "text-slate-400"}`}
              />
              <span className="font-semibold text-slate-800">Local LLM</span>
              <span className="text-xs text-slate-500 mt-1">
                Privacy Focused (Ollama/LM Studio)
              </span>
            </button>
          </div>
        </div>

        {/* Gemini Settings */}
        {localSettings.provider === ModelProvider.GEMINI && (
          <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
            <div className="flex items-start gap-4">
              <Zap className="w-6 h-6 text-yellow-500 mt-1" />
              <div>
                <h3 className="font-medium text-slate-800">
                  Gemini Configuration
                </h3>
                <div className="mt-4 flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.useThinkingMode}
                      onChange={(e) =>
                        handleChange("useThinkingMode", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-medium text-slate-700">
                      Enable Thinking Mode (Gemini 3.0 Pro)
                    </span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Enables deep reasoning (Budget: 32k tokens) for complex style
                  matching. Disable for faster responses via Flash Lite.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Local Settings */}
        {localSettings.provider === ModelProvider.LOCAL && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-medium text-slate-800">
              Local Model Connection
            </h3>

            <div>
              <label
                htmlFor="model-url"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Model Endpoint URL
              </label>
              <input
                id="model-url"
                type="text"
                value={localSettings.localModelUrl}
                onChange={(e) => handleChange("localModelUrl", e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="http://localhost:11434/api/generate"
              />
            </div>

            <div>
              <label
                htmlFor="model-name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Model Name
              </label>
              <input
                id="model-name"
                type="text"
                value={localSettings.localModelName}
                onChange={(e) => handleChange("localModelName", e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="llama3"
              />
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={runHealthCheck}
                  disabled={healthCheck.status === "checking"}
                >
                  {healthCheck.status === "checking"
                    ? "Checking..."
                    : "Test Connection"}
                </Button>

                {healthCheck.status === "ok" && (
                  <span className="text-green-600 flex items-center text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Connected
                  </span>
                )}

                {healthCheck.status === "error" && (
                  <span className="text-red-600 flex items-center text-sm font-medium">
                    <AlertCircle className="w-4 h-4 mr-1" /> Failed
                  </span>
                )}
              </div>

              {healthCheck.result &&
                !healthCheck.result.ok &&
                renderErrorGuidance(healthCheck.result)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
