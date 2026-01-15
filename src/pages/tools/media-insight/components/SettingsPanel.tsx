/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Info } from "lucide-react";
import { AuraModal, AuraButton, AuraInput, AuraCard } from "@/components/aura";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [useLocalModel, setUseLocalModel] = useState(false);
  const [localEndpoint, setLocalEndpoint] = useState(
    "http://localhost:1234/v1"
  );
  const [chatModel, setChatModel] = useState("phi-3-mini-4k-instruct");
  const [visionModel, setVisionModel] = useState("llava-phi-3-mini");

  // Load settings from localStorage
  useEffect(() => {
    const savedUseLocal = localStorage.getItem("mediainsight_use_local_model");
    const savedEndpoint = localStorage.getItem("mediainsight_local_endpoint");
    const savedChatModel = localStorage.getItem(
      "mediainsight_local_chat_model"
    );
    const savedVisionModel = localStorage.getItem(
      "mediainsight_local_vision_model"
    );

    // Default to true if not set, otherwise parse string
    if (savedUseLocal === null) {
      setUseLocalModel(true);
    } else {
      setUseLocalModel(savedUseLocal === "true");
    }

    if (savedEndpoint) setLocalEndpoint(savedEndpoint);
    if (savedChatModel) setChatModel(savedChatModel);
    if (savedVisionModel) setVisionModel(savedVisionModel);
  }, []);

  const handleSave = () => {
    localStorage.setItem("mediainsight_use_local_model", String(useLocalModel));
    localStorage.setItem("mediainsight_local_endpoint", localEndpoint);
    localStorage.setItem("mediainsight_local_chat_model", chatModel);
    localStorage.setItem("mediainsight_local_vision_model", visionModel);
    onClose();
  };

  return (
    <AuraModal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Model Settings"
      size="lg"
      footer={
        <>
          <AuraButton variant="ghost" onClick={onClose}>
            Cancel
          </AuraButton>
          <AuraButton variant="accent" onClick={handleSave}>
            Save Settings
          </AuraButton>
        </>
      }
    >
      <div className="space-y-6">
        {/* Model Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-aura-text-primary">
            Model Selection
          </h3>

          <AuraCard
            variant={!useLocalModel ? "bordered" : "elevated"}
            padding="md"
            className={`cursor-pointer transition-colors ${!useLocalModel ? "bg-aura-accent-light/30 border-aura-accent" : "hover:bg-aura-bg"}`}
            onClick={() => setUseLocalModel(false)}
          >
            <div className="flex items-start gap-3">
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
            </div>
          </AuraCard>

          <AuraCard
            variant={useLocalModel ? "bordered" : "elevated"}
            padding="md"
            className={`cursor-pointer transition-colors ${useLocalModel ? "bg-aura-accent-light/30 border-aura-accent" : "hover:bg-aura-bg"}`}
            onClick={() => setUseLocalModel(true)}
          >
            <div className="flex items-start gap-3">
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
            </div>
          </AuraCard>
        </div>

        {/* Local Model Configuration */}
        {useLocalModel && (
          <AuraCard
            variant="glass"
            padding="md"
            className="space-y-4 bg-aura-bg/50"
          >
            <AuraInput
              label="Local Endpoint URL"
              inputType="url"
              value={localEndpoint}
              onChange={(e) => setLocalEndpoint(e.target.value)}
              placeholder="http://localhost:1234/v1"
              helperText="Default LM Studio endpoint: http://localhost:1234/v1"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AuraInput
                label="Chat Model Name"
                value={chatModel}
                onChange={(e) => setChatModel(e.target.value)}
                placeholder="phi-3-mini-4k-instruct"
              />
              <AuraInput
                label="Vision Model Name"
                value={visionModel}
                onChange={(e) => setVisionModel(e.target.value)}
                placeholder="llava-phi-3-mini"
              />
            </div>
          </AuraCard>
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
                  <span className="font-medium">Llama 3.2 Vision (11B)</span> -
                  Best multimodal choice for image/video analysis with Apple
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
    </AuraModal>
  );
};

export default SettingsPanel;
