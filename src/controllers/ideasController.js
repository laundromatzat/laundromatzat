const OpenAI = require('openai');
const ApiError = require('../utils/apiError'); // Custom error class

// Ensure OPENAI_API_KEY is loaded from environment variables
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY is not set. The Intelligent Ideas tool will not function.');
  // In a real app, you might want to throw an error or exit if critical env vars are missing at startup
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.generateIdeas = async (req, res, next) => {
  const { input } = req.body;

  if (!input || typeof input !== 'string' || input.trim().length < 5) {
    return next(new ApiError(400, 'Invalid input: Please provide a text input of at least 5 characters.'));
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Or your preferred model
      messages: [
        { role: "system", content: "You are a creative assistant that generates intelligent ideas based on user input. Provide 3 distinct ideas." },
        { role: "user", content: `Generate ideas for: ${input}` },
      ],
      temperature: 0.7,
      max_tokens: 200,
      n: 3, // Request 3 ideas
    });

    const rawIdeas = completion.choices.map(choice => choice.message.content.trim());

    // Basic parsing: split by lines, filter empty, potentially format further
    const ideas = rawIdeas.flatMap(ideaBlock =>
      ideaBlock.split('\n')
               .map(line => line.trim())
               .filter(line => line.length > 0 && !/^\d+\./.test(line)) // Remove numbering if present
    );

    // Filter for unique, non-empty, and reasonably long ideas
    const uniqueIdeas = [...new Set(ideas)].filter(idea => idea.length > 10); // Example filter

    if (uniqueIdeas.length === 0) {
        return next(new ApiError(500, 'Could not generate any meaningful ideas. Please try a different input.'));
    }

    res.status(200).json({ ideas: uniqueIdeas });

  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      // Handle specific OpenAI API errors (e.g., invalid key, rate limit)
      console.error('OpenAI API Error:', error.status, error.code, error.type, error.message);
      let errorMessage = 'Failed to communicate with the AI service.';
      let statusCode = 502; // Bad Gateway or Service Unavailable

      if (error.status === 401) { // Invalid API key
        errorMessage = 'AI service authentication failed. Please check the API key configuration.';
        statusCode = 500; // Internal Server Error due to backend config issue
      } else if (error.status === 429) { // Rate limit exceeded
        errorMessage = 'AI service is busy. Please try again shortly.';
        statusCode = 429;
      } else if (error.status >= 500) { // OpenAI internal server errors
        errorMessage = 'AI service is currently unavailable. Please try again later.';
        statusCode = 503;
      }
      return next(new ApiError(statusCode, errorMessage));

    } else if (error.name === 'AbortError') {
      // Handle request timeouts/cancellations
      return next(new ApiError(504, 'AI service request timed out.'));
    } else {
      // Handle any other unexpected errors
      console.error('Unexpected error generating ideas:', error);
      return next(new ApiError(500, 'An internal server error occurred while generating ideas.'));
    }
  }
};
