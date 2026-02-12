const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

export const generateIdea = async (textInput) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ideas/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: textInput }),
    });

    // Check for HTTP errors
    if (!response.ok) {
      const errorData = await response.json();
      // Propagate the backend's error message
      throw new Error(errorData.message || 'Failed to generate ideas due to a server error.');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    // Re-throw to be caught by the component
    throw error;
  }
};
