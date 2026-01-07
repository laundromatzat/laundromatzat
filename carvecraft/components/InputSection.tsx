import React, { useState, useRef } from 'react';

interface InputSectionProps {
  onGenerate: (text: string, imageBase64?: string) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [base64Img, setBase64Img] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        // Extract base64 raw string for API
        const base64 = result.split(',')[1];
        setBase64Img(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt && !base64Img) return;
    onGenerate(prompt, base64Img);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-lg shadow-sage-200/50 p-8 border border-sage-100 transition-all duration-300 hover:shadow-xl hover:shadow-sage-200/60">
        <h2 className="text-2xl font-semibold text-sage-800 mb-2 tracking-tight">What are we carving today?</h2>
        <p className="text-sage-500 mb-8 text-sm">Describe your idea or upload a reference photo.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Text Input */}
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A sleeping fox curled up..."
              className="w-full h-32 p-4 bg-sage-50 rounded-2xl border-none focus:ring-2 focus:ring-timber-400 focus:bg-white transition-all text-sage-800 placeholder-sage-300 resize-none text-lg"
              disabled={isLoading}
            />
          </div>

          {/* Image Upload Area */}
          <div className="flex items-center space-x-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-colors ${
                preview 
                  ? 'bg-sage-100 text-sage-700 hover:bg-sage-200' 
                  : 'bg-white border border-sage-200 text-sage-500 hover:bg-sage-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
              </svg>
              <span>{preview ? "Change Image" : "Upload Reference"}</span>
            </button>

            {preview && (
              <div className="h-12 w-12 rounded-lg overflow-hidden border border-sage-200">
                <img src={preview} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading || (!prompt && !preview)}
            className={`w-full py-4 rounded-2xl font-medium text-lg shadow-md transition-all transform active:scale-[0.99] flex justify-center items-center space-x-2
              ${isLoading 
                ? 'bg-sage-200 text-sage-400 cursor-not-allowed' 
                : 'bg-timber-600 text-white hover:bg-timber-700 shadow-timber-200'
              }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Carving...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/>
                  <path d="m14 7 3 3"/>
                  <path d="M5 6v4"/>
                  <path d="M19 14v4"/>
                  <path d="M10 2v2"/>
                  <path d="M7 8H5"/>
                  <path d="M22 12h-2"/>
                  <path d="M16 20h2"/>
                </svg>
                <span>Generate Design Deck</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InputSection;
