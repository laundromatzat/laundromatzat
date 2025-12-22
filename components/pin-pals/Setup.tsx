/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface SetupProps {
  petImage: string | null;
  petType: string;
  petCount: number;
  isDetecting: boolean;
  onImageUpload: (file: File) => void;
  onTypeChange: (val: string) => void;
  onCountChange: (count: number) => void;
  onGenerate: () => void;
}

export const Setup: React.FC<SetupProps> = ({ 
  petImage, 
  petType, 
  petCount, 
  isDetecting, 
  onImageUpload, 
  onTypeChange, 
  onCountChange, 
  onGenerate 
}) => {
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);

  const isDog = petType === 'DOG' || petType === 'DOGS';
  const isCat = petType === 'CAT' || petType === 'CATS';
  const isCustom = !isDog && !isCat;

  return (
    <div className="card animate-in-up">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left: Upload Area */}
        <div className="flex-1">
          <label className="text-label">Source Image</label>
          <div className={`
            relative h-72 rounded-xl border border-dashed transition-all duration-300
            flex flex-col items-center justify-center p-6 cursor-pointer group overflow-hidden
            ${petImage 
                ? 'border-zinc-700 bg-zinc-950' 
                : 'border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900 hover:border-zinc-600'
            }
          `}>
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0])} 
            />
            
            {petImage ? (
              <>
                <img 
                  src={`data:image/jpeg;base64,${petImage}`} 
                  alt="Pet Preview" 
                  className="w-full h-full object-cover rounded-lg opacity-80 group-hover:opacity-40 transition-opacity" 
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                   <span className="bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                      Change Photo
                   </span>
                </div>
              </>
            ) : (
              <div className="text-center text-zinc-500 space-y-3 pointer-events-none">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-400 group-hover:text-white transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                </div>
                <div>
                    <span className="block text-sm font-medium text-zinc-300">Upload Photo</span>
                    <span className="block text-xs mt-1 text-zinc-600">JPG, PNG up to 5MB</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex-1 flex flex-col">
           <div className="flex-grow">
             <label className="text-label">Subject Analysis</label>
             
             {isDetecting ? (
                 <div className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400 text-sm h-[52px]">
                    <div className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
                    <span>Identifying species...</span>
                 </div>
             ) : (
                 <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg h-[52px]">
                    <div className="flex items-center gap-2">
                        <svg className="text-emerald-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        <span className="text-sm font-medium text-white uppercase tracking-wide">
                            {petCount > 1 ? `${petCount} ` : ''}{petType}
                        </span>
                    </div>
                    
                    <button 
                        onClick={() => setIsOverrideOpen(!isOverrideOpen)}
                        className={`p-2 rounded-md transition-colors ${isOverrideOpen ? 'text-white bg-zinc-800' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                 </div>
             )}

             {isOverrideOpen && (
               <div className="mt-4 p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-4 animate-in-up">
                   
                   {/* Species Toggle */}
                   <div>
                       <label className="text-xs text-zinc-500 font-medium mb-2 block">Species</label>
                       <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                           <button 
                               onClick={() => onTypeChange(petCount > 1 ? 'DOGS' : 'DOG')}
                               className={`btn-pill ${isDog ? 'active' : 'inactive'}`}
                           >
                               Dog
                           </button>
                           <button 
                               onClick={() => onTypeChange(petCount > 1 ? 'CATS' : 'CAT')}
                               className={`btn-pill ${isCat ? 'active' : 'inactive'}`}
                           >
                               Cat
                           </button>
                           <button 
                               onClick={() => { if(!isCustom) onTypeChange(''); }}
                               className={`btn-pill ${isCustom ? 'active' : 'inactive'}`}
                           >
                               Custom
                           </button>
                       </div>
                       
                       {isCustom && (
                           <div className="mt-2">
                               <input 
                                   type="text" 
                                   value={petType}
                                   onChange={(e) => onTypeChange(e.target.value.toUpperCase())}
                                   placeholder="Enter species..."
                                   className="input-minimal"
                               />
                           </div>
                       )}
                   </div>

                   {/* Count Stepper */}
                   <div>
                       <label className="text-xs text-zinc-500 font-medium mb-2 block">Quantity</label>
                       <div className="flex items-center gap-3">
                           <button 
                               onClick={() => onCountChange(Math.max(1, petCount - 1))}
                               className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors"
                           >
                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                           </button>
                           
                           <span className="w-8 text-center font-medium text-white">{petCount}</span>
                           
                           <button 
                               onClick={() => onCountChange(petCount + 1)}
                               className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-white transition-colors"
                           >
                               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                           </button>
                       </div>
                   </div>
               </div>
             )}
           </div>

           <button 
             onClick={onGenerate}
             disabled={!petImage || isDetecting}
             className="btn-primary w-full mt-8"
           >
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
             Generate Pin
           </button>
        </div>
      </div>
    </div>
  );
};