/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface ApiKeyDialogProps {
  onContinue: () => void;
}

export const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          API Key Required
        </h2>

        <p className="text-zinc-400 text-center mb-8 leading-relaxed text-sm">
          To generate high-quality vector art, this application requires a paid
          Google Gemini API key.
        </p>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 text-zinc-500 shrink-0"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="16" y2="12" />
              <line x1="12" x2="12.01" y1="8" y2="8" />
            </svg>
            <div className="space-y-1">
              <p className="text-xs text-zinc-300 font-medium">
                Billing Account Required
              </p>
              <p className="text-xs text-zinc-500">
                Gemini 3 Pro Image Preview requires a billing-enabled project.
                <a
                  href="https://ai.google.dev/gemini-api/docs/billing"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white hover:underline ml-1"
                >
                  Learn more
                </a>
              </p>
            </div>
          </div>
        </div>

        {(window as any).aistudio ? (
          <button onClick={onContinue} className="btn-primary w-full">
            Authenticate & Continue
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Enter your Gemini API Key"
              className="w-full bg-zinc-800 border-zinc-700 text-white rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-aura-accent focus:outline-none"
              onChange={(e) => {
                if (e.target.value) {
                  localStorage.setItem("gemini_api_key", e.target.value.trim());
                }
              }}
            />
            <button onClick={onContinue} className="btn-primary w-full">
              Save & Continue
            </button>
            <p className="text-xs text-center text-zinc-500 mt-2">
              Don't have a key?{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-zinc-400 hover:text-white underline"
              >
                Get one here
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
