const aiForm = document.getElementById('aiForm');
const responseDiv = document.getElementById('response');

async function updateAiHtml() {
  const prompt = document.getElementById('prompt').value;
  // The API key should not be stored directly in the client-side code.
    const apiUrl = `/api/generate`;
  const requestData = {
    "prompt": {
      "text": prompt
        }    
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const responseData = await response.json();
      responseDiv.textContent = `Error: ${responseData.error?.message || 'Network response was not ok'}`;
      throw new Error(responseData.error?.message || 'Network response was not ok.');
    }

    const responseData = await response.json();
    if (responseData.response) {
      responseDiv.textContent = responseData.response;
    } else {
      responseDiv.textContent = 'No response';
    }
  } catch (error) {
    console.error('Error during API call:', error);
    responseDiv.textContent = `Error: ${error.message || error}`;
  }
}

aiForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  responseDiv.textContent = 'Loading...';
  try {
    await updateAiHtml();
  } catch (error) {
    console.error('An error occurred during updateAiHtml:', error);
    responseDiv.textContent = `Error: ${error.message}`;
  }
});
