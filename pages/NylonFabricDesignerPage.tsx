
import React, { useState } from 'react';
import { generateSewingGuide, generateProjectImages } from '../services/nylonFabricDesignerService';

const NylonFabricDesignerPage: React.FC = () => {
  const [projectDescription, setProjectDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sanitizedGuideContent, setSanitizedGuideContent] = useState<string | null>(null);
  const [visuals, setVisuals] = useState<{ stage: string; svg: string }[] | null>(null);

  const examples = {
    stuffsack:
      'I want to make a lightweight stuff sack for camping gear, approximately 12 inches tall and 8 inches in diameter, with a drawstring closure at the top. It should be durable and water-resistant for storing sleeping bags or clothing.',
    tote:
      'I\'d like to create a medium-sized tote bag for grocery shopping, about 15 inches wide, 14 inches tall, and 6 inches deep. I want sturdy handles and maybe an internal pocket for keys and phone.',
    pouch:
      'I want to make a rectangular zipper pouch for toiletries, roughly 10 inches by 6 inches by 3 inches. It should have a waterproof lining and be able to stand up on its own.',
    apron:
      'I need a work apron for my woodshop with multiple pockets for tools. It should be about 24 inches long with adjustable straps and reinforced pocket corners for durability.',
  };

  const handleGenerateGuide = async () => {
    if (!projectDescription) {
      setError('Please enter a project description');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSanitizedGuideContent(null);
    setVisuals(null);

    try {
      const guide = await generateSewingGuide(projectDescription);
      setSanitizedGuideContent(guide);

      try {
        const projectVisuals = await generateProjectImages(projectDescription);
        setVisuals(projectVisuals);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'An unknown error occurred while generating visuals for your project.';
        setError(message);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unknown error occurred while generating a sewing guide for your project.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewProject = () => {
    setProjectDescription('');
    setSanitizedGuideContent(null);
    setVisuals(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      <header className="bg-white shadow-md p-8 text-center">
        <h1 className="text-5xl font-bold text-purple-700 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
          Nylon Fabric Project Designer
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Describe your project and get professional sewing guidance with cutting templates and visual previews
        </p>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        {!sanitizedGuideContent && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-purple-700 mb-4">Describe Your Project</h2>
            <p className="text-gray-600 mb-6">
              Tell us what you want to make with nylon fabric. Be as detailed as possible about the item, its purpose,
              size, and any specific features you'd like.
            </p>
            <textarea
              id="projectDescription"
              className="w-full min-h-[150px] p-4 border-2 border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 transition"
              placeholder="Example: I want to make a lightweight stuff sack for camping gear..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
            <div className="flex gap-4 mt-4 flex-wrap">
              {Object.entries(examples).map(([key, value]) => (
                <button
                  key={key}
                  className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full hover:bg-purple-200 transition text-sm"
                  onClick={() => setProjectDescription(value)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
            <button
              className="mt-6 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition disabled:opacity-50"
              onClick={handleGenerateGuide}
              disabled={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Sewing Guide'}
            </button>
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        )}

        {isLoading && !sanitizedGuideContent && (
          <div className="text-center p-12 bg-white rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-xl text-purple-700">Analyzing your project...</p>
            <p className="text-gray-600">Researching best practices and generating your custom guide</p>
          </div>
        )}

        {sanitizedGuideContent && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center border-b-2 border-gray-200 pb-4 mb-6">
              <h2 className="text-3xl font-bold text-purple-700">Your Custom Sewing Guide</h2>
              <button
                className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition"
                onClick={startNewProject}
              >
                New Project
              </button>
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div dangerouslySetInnerHTML={{ __html: sanitizedGuideContent }} />

            {visuals && (
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-purple-700 mb-4">Visual Blueprints & Renderings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {visuals.map((visual, index) => (
                    <div key={index} className="border rounded-lg shadow-md overflow-hidden">
                      <div className="bg-gray-50 p-4 flex items-center justify-center min-h-[300px]" dangerouslySetInnerHTML={{ __html: visual.svg }} />
                      <div className="p-4 bg-gray-100">
                        <p className="font-bold text-center text-purple-800">{visual.stage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isLoading && !visuals && (
              <div className="text-center p-12 bg-white rounded-lg shadow-lg mt-8">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-xl text-purple-700">Generating visual diagrams...</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default NylonFabricDesignerPage;
