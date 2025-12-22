/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface BookProps {
  imageUrl: string;
  onReset: () => void;
}

export const Book: React.FC<BookProps> = ({ imageUrl, onReset }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'pin-pals-design.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card w-full max-w-lg mx-auto flex flex-col items-center animate-in-up">
      <div className="mb-8 w-full aspect-square relative rounded-full overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
         <img 
            src={imageUrl} 
            alt="Generated Pin" 
            className="w-full h-full object-contain"
         />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button 
          onClick={handleDownload}
          className="btn-primary flex-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          Download Image
        </button>
        <button 
          onClick={onReset}
          className="btn-secondary flex-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Start Over
        </button>
      </div>
    </div>
  );
};