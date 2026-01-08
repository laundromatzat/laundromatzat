/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { X, Settings2, Info } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [useLocalModel, setUseLocalModel] = useState(false);
  const [localEndpoint, setLocalEndpoint] = useState(
    "http://localhost:1234/v1"
  );

  // Load settings from localStorage
  useEffect(() => {
    const savedUseLocal = localStorage.getItem("mediainsight_use_local_model");
    const savedEndpoint = localStorage.getItem("mediainsight_local_endpoint");

    // Default to true if not set, otherwise parse string
    if (savedUseLocal === null) {
      setUseLocalModel(true);
    } else {
      setUseLocalModel(savedUseLocal === "true");
    }

    if (savedEndpoint) setLocalEndpoint(savedEndpoint);
  }, []);

  const handleSave = () => {
    localStorage.setItem("mediainsight_use_local_model", String(useLocalModel));
    localStorage.setItem("mediainsight_local_endpoint", localEndpoint);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-brand-secondary/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings2 className="text-brand-accent" size={24} />
            <h2 className="text-2xl font-bold text-aura-text-primary">
              AI Model Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-brand-secondary/10 rounded-lg transition-colors"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Model Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-aura-text-primary">
              Model Selection
            </h3>

            <label className="flex items-start gap-3 p-4 border border-brand-secondary/40 rounded-xl cursor-pointer hover:bg-brand-secondary/5 transition-colors">
              <input
                type="radio"
                name="model"
                checked={!useLocalModel}
                onChange={() => setUseLocalModel(false)}
                className="mt-1"
                aria-label="Gemini API (Cloud)"
              />
              <div className="flex-1">
                <div className="font-semibold text-aura-text-primary">
                  Gemini API (Cloud)
                </div>
                <div className="text-sm text-aura-text-secondary mt-1">
                  Use Google&apos;s Gemini 2.0 Flash model for fast, accurate
                  analysis. Requires API key.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border border-brand-secondary/40 rounded-xl cursor-pointer hover:bg-brand-secondary/5 transition-colors">
              <input
                type="radio"
                name="model"
                checked={useLocalModel}
                onChange={() => setUseLocalModel(true)}
                className="mt-1"
                aria-label="Local AI Model"
              />
              <div className="flex-1">
                <div className="font-semibold text-aura-text-primary">
                  Local AI Model
                </div>
                <div className="text-sm text-aura-text-secondary mt-1">
                  Use a locally running AI model (LM Studio, Ollama, etc.) for
                  privacy and offline use.
                </div>
              </div>
            </label>
          </div>

          {/* Local Model Configuration */}
          {useLocalModel && (
            <div className="space-y-4 p-4 bg-brand-secondary/5 rounded-xl border border-brand-secondary/20">
              <div>
                <label
                  htmlFor="endpoint"
                  className="block text-sm font-medium text-aura-text-primary mb-2"
                >
                  Local Endpoint URL
                </label>
                <input
                  id="endpoint"
                  type="text"
                  value={localEndpoint}
                  onChange={(e) => setLocalEndpoint(e.target.value)}
                  placeholder="http://localhost:1234/v1"
                  className="w-full px-4 py-2 border border-brand-secondary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white"
                />
                <p className="text-xs text-aura-text-secondary mt-2">
                  Default LM Studio endpoint: http://localhost:1234/v1
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="chatModel"
                    className="block text-sm font-medium text-aura-text-primary mb-2"
                  >
                    Chat Model Name
                  </label>
                  <input
                    id="chatModel"
                    type="text"
                    value={
                      localStorage.getItem("mediainsight_local_chat_model") ||
                      "phi-3-mini-4k-instruct"
                    }
                    onChange={(e) =>
                      localStorage.setItem(
                        "mediainsight_local_chat_model",
                        e.target.value
                      )
                    }
                    placeholder="phi-3-mini-4k-instruct"
                    className="w-full px-4 py-2 border border-brand-secondary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="visionModel"
                    className="block text-sm font-medium text-aura-text-primary mb-2"
                  >
                    Vision Model Name
                  </label>
                  <input
                    id="visionModel"
                    type="text"
                    value={
                      localStorage.getItem("mediainsight_local_vision_model") ||
                      "llava-phi-3-mini"
                    }
                    onChange={(e) =>
                      localStorage.setItem(
                        "mediainsight_local_vision_model",
                        e.target.value
                      )
                    }
                    placeholder="llava-phi-3-mini"
                    className="w-full px-4 py-2 border border-brand-secondary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Model Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="text-blue-600 mt-0.5 shrink-0" size={20} />
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-blue-900">
                  Recommended Local Models for Mac Mini
                </div>
                <div className="text-blue-800 space-y-2">
                  <div>
                    <span className="font-medium">Llama 3.2 Vision (11B)</span>{" "}
                    - Best multimodal choice for image/video analysis with Apple
                    Silicon optimization
                  </div>
                  <div>
                    <span className="font-medium">Qwen2-VL (7B)</span> - Lighter
                    alternative with strong vision capabilities
                  </div>
                  <div className="text-xs text-blue-700 mt-2">
                    Note: For audio transcription, pair with Whisper Large v3 in
                    LM Studio
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-brand-secondary/30 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-brand-secondary/40 rounded-lg hover:bg-brand-secondary/10 transition-colors text-aura-text-primary font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-brand-accent text-brand-on-accent rounded-lg hover:bg-brand-accent-strong transition-colors font-semibold shadow-md"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
