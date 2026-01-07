import React, { useState, useEffect } from 'react';
import InputSection from './components/InputSection';
import CutCalculator from './components/CutCalculator';
import { generateCarvingPlan } from './services/geminiService';
import { AppPhase, Unit, GeneratedDesign } from './types';

function App() {
  const [phase, setPhase] = useState<AppPhase>(AppPhase.INPUT);
  const [unit, setUnit] = useState<Unit>(Unit.INCHES);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [designData, setDesignData] = useState<GeneratedDesign | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        // Fallback for environments where aistudio is not injected
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  // Handle API Key Selection
  const handleAuth = async () => {
    if ((window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        setHasApiKey(true);
        setErrorMsg(null);
      } catch (e) {
        console.error("Key selection cancelled or failed", e);
      }
    }
  };

  // Load unit preference from localStorage
  useEffect(() => {
    const savedUnit = localStorage.getItem('carvecraft_unit');
    if (savedUnit) {
      setUnit(savedUnit as Unit);
    }
  }, []);

  const toggleUnit = () => {
    const newUnit = unit === Unit.INCHES ? Unit.MM : Unit.INCHES;
    setUnit(newUnit);
    localStorage.setItem('carvecraft_unit', newUnit);
  };

  const handleGenerate = async (prompt: string, imageBase64?: string) => {
    setPhase(AppPhase.GENERATING);
    setErrorMsg(null);
    try {
      const data = await generateCarvingPlan(prompt, imageBase64);
      setDesignData(data);
      setPhase(AppPhase.RESULTS);
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes('403') || err.message.includes('permission') || err.message.includes('PERMISSION_DENIED'))) {
        setErrorMsg("Permission denied. Please select a valid Google Cloud Project API key.");
        setHasApiKey(false); // Force re-selection
      } else {
        setErrorMsg(err.message || "Something went wrong.");
      }
      setPhase(AppPhase.INPUT);
    }
  };

  const handleReset = () => {
    setPhase(AppPhase.INPUT);
    setDesignData(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen pb-20 font-sans selection:bg-timber-200 selection:text-timber-900">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sage-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
          <div className="w-8 h-8 bg-timber-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md shadow-timber-200">
            C
          </div>
          <h1 className="text-xl font-bold text-sage-800 tracking-tight">CarveCraft</h1>
        </div>
        
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-sage-500 hover:text-sage-800 hover:bg-sage-100 rounded-full transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pt-12">
        
        {/* Error Banner */}
        {errorMsg && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            {errorMsg}
          </div>
        )}

        {/* Phase: Input (Only if Key is selected) */}
        {(phase === AppPhase.INPUT || phase === AppPhase.GENERATING) && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
             <div className="mb-8 text-center max-w-lg">
               <h2 className="text-4xl font-bold text-sage-900 mb-4 tracking-tight">Visualize. Plan. Carve.</h2>
               <p className="text-sage-600 text-lg">Turn a vague idea into a precise cutting plan with AI-powered conceptualization and measurement tools.</p>
             </div>
             
             {hasApiKey ? (
               <InputSection onGenerate={handleGenerate} isLoading={phase === AppPhase.GENERATING} />
             ) : (
                /* Auth Section */
                <div className="w-full max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg border border-sage-100 text-center animate-fade-in">
                  <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mx-auto mb-6 text-timber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-sage-800 mb-2">Connect Google AI</h3>
                  <p className="text-sage-500 mb-8">To access the high-fidelity design models, please connect your Google Cloud Project API Key.</p>
                  <button 
                    onClick={handleAuth}
                    className="w-full py-3 bg-timber-600 hover:bg-timber-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Connect API Key</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </button>
                  <p className="text-xs text-sage-400 mt-4"><a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-timber-600">Billing information</a></p>
                </div>
             )}
           </div>
        )}

        {/* Phase: Results */}
        {phase === AppPhase.RESULTS && designData && (
          <div className="space-y-12 animate-fade-in">
            
            {/* Design Deck Header */}
            <div className="flex justify-between items-end border-b border-sage-200 pb-4">
              <div>
                <h2 className="text-3xl font-bold text-sage-900">Design Deck</h2>
                <p className="text-sage-500 mt-1">Generated assets for your project</p>
              </div>
              <button onClick={handleReset} className="text-sage-500 hover:text-timber-600 font-medium text-sm">
                Start Over
              </button>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Card 1: Concept Art */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-sage-100 flex flex-col">
                <h3 className="text-lg font-semibold text-sage-700 mb-4">Concept Visualization</h3>
                <div className="bg-sage-50 rounded-xl overflow-hidden flex-grow shadow-inner">
                  <img src={designData.conceptUrl} alt="Concept" className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Card 2: Strategy Guide */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-sage-100 h-96 overflow-y-auto">
                <h3 className="text-lg font-semibold text-sage-700 mb-4">Carving Strategy</h3>
                <div className="prose prose-sage prose-p:text-sage-600 prose-headings:text-sage-800">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{designData.guideText}</pre>
                </div>
              </div>

              {/* Card 3: Cut Calculator (Full Width) */}
              <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-md border border-sage-100 ring-1 ring-sage-50">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-sage-700">Technical Blueprint & Cut Calculator</h3>
                  <p className="text-sage-500 text-sm">Use the tool below to calibrate and measure cut distances on the blueprint.</p>
                </div>
                <CutCalculator imageUrl={designData.schematicUrl} unit={unit} />
              </div>
              
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sage-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
            <h3 className="text-xl font-bold text-sage-800 mb-6">Settings</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sage-600 font-medium">Measurement Unit</span>
                <button 
                  onClick={toggleUnit}
                  className="bg-sage-100 px-3 py-1 rounded-lg text-sage-800 font-semibold text-sm hover:bg-sage-200 transition-colors"
                >
                  {unit === Unit.INCHES ? 'Inches (in)' : 'Millimeters (mm)'}
                </button>
              </div>

              {(window as any).aistudio && (
                <div className="pt-4 border-t border-sage-100">
                  <button 
                    onClick={() => {
                        handleAuth();
                        setIsSettingsOpen(false);
                    }}
                    className="w-full py-2 bg-white border border-sage-200 text-sage-600 rounded-lg text-sm hover:bg-sage-50 transition-colors"
                  >
                    Change API Key
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2 bg-timber-600 text-white rounded-xl hover:bg-timber-700 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Basic inline animations for nicer UX */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default App;