/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from "react";

// Interface for the injected window.aistudio object
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

export const useApiKey = () => {
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  const validateApiKey = useCallback(async (): Promise<boolean> => {
    // 1. Check Environment Variables
    const envKey =
      import.meta.env.VITE_GEMINI_API_KEY ||
      import.meta.env.VITE_GOOGLE_GENAI_API_KEY ||
      import.meta.env.VITE_API_KEY;
    if (envKey) return true;

    // 2. Check Local Storage
    const localKey = localStorage.getItem("gemini_api_key");
    if (localKey) return true;

    // 3. Check AI Studio (Project IDX)
    const aistudio = (window as unknown as { aistudio: AIStudio }).aistudio;

    if (aistudio) {
      try {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setShowApiKeyDialog(true);
          return false;
        }
        return true;
      } catch (error) {
        console.warn("API Key check failed", error);
        setShowApiKeyDialog(true);
        return false;
      }
    }

    // 4. No key found anywhere
    setShowApiKeyDialog(true);
    return false;
  }, []);

  const handleApiKeyDialogContinue = useCallback(async () => {
    setShowApiKeyDialog(false);
    const aistudio = (window as unknown as { aistudio: AIStudio }).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
    }
  }, []);

  return {
    showApiKeyDialog,
    setShowApiKeyDialog, // Exposed in case you need to trigger it from API errors
    validateApiKey,
    handleApiKeyDialogContinue,
  };
};
