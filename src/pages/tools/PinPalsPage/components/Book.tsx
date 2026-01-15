/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Download, RefreshCw } from "lucide-react";
import { AuraButton, AuraCard } from "@/components/aura";

interface BookProps {
  imageUrl: string;
  onReset: () => void;
}

export const Book: React.FC<BookProps> = ({ imageUrl, onReset }) => {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "pin-pals-design.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AuraCard
      variant="glass"
      padding="lg"
      className="w-full max-w-lg mx-auto flex flex-col items-center animate-scale-in"
    >
      <div className="mb-8 w-full aspect-square relative rounded-full overflow-hidden border border-aura-border bg-black shadow-2xl shadow-black/50">
        <img
          src={imageUrl}
          alt="Generated Pin"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <AuraButton
          onClick={handleDownload}
          variant="primary"
          className="flex-1 justify-center"
          icon={<Download size={20} />}
        >
          Download Image
        </AuraButton>
        <AuraButton
          onClick={onReset}
          variant="secondary"
          className="flex-1 justify-center"
          icon={<RefreshCw size={20} />}
        >
          Start Over
        </AuraButton>
      </div>
    </AuraCard>
  );
};
