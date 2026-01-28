import React, { useState, useCallback } from 'react';
import { generateIdea } from '../services/ideasService'; // Assumed service file

const IntelligentIdeasTool = () => {
  const [inputText, setInputText] = useState('');
  const [ideas, setIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setIdeas([]); // Clear previous ideas

    if (!inputText.trim()) {
      setError('Please enter some text to generate ideas.');
      return;
    }

    setIsLoading(true);
    try {
      const generatedIdeas = await generateIdea(inputText);
      setIdeas(generatedIdeas.ideas || []); // Assuming the backend returns { ideas: [...] }
      // Optional: clear input after successful submission
      setInputText(''); 
    } catch (err) {
      console.error('Failed to generate ideas:', err);
      // Display a user-friendly error message
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [inputText]);

  return (
    <div className="intelligent-ideas-tool">
      <h2>Generate Intelligent Ideas</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe your topic or problem..."
          rows="5"
          disabled={isLoading}
        ></textarea>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Ideas'}
        </button>
      </form>

      {error && <p className="error-message">Error: {error}</p>}

      {ideas.length > 0 && (
        <div className="ideas-list">
          <h3>Generated Ideas:</h3>
          <ul>
            {ideas.map((idea, index) => (
              <li key={index}>{idea}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Optional: Add a simple loading spinner/indicator */}
      {isLoading && <div className="loading-spinner"></div>}
    </div>
  );
};

export default IntelligentIdeasTool;
