const express = require('express');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const path = require('path');


const app = express();
const port = 3000;

// Initialize Secret Manager client
const client = new SecretManagerServiceClient();

// Serve a basic message for the root path
app.use(express.json());

app.get('/', (req, res) => {
  res.send('<h1>Welcome to the AI Studio API Test Server</h1>');
});



// Endpoint to handle requests to generate content
app.post('/api/generate', async (req, res) => {
  console.log('Received a request to /api/generate');
  console.log('Request body:', req.body);

  try {
    // Retrieve the API key from Secret Manager
    const [accessResponse] = await client.accessSecretVersion({
      name: 'projects/laundromatzat/secrets/ai_studio_api_key/versions/latest',
    });
    const apiKey = accessResponse.payload.data.toString('utf8');

    // Make the request to the Google Generative Language API
    const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body), // Forward the request body
    });

    // Check if the API response is OK
    if (!apiResponse.ok) {
      throw new Error(`API request failed with status ${apiResponse.status}`);
    }

    // Send the API response back to the frontend
    const apiData = await apiResponse.json();
    console.log("API response:", apiData)
    res.json(apiData);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});