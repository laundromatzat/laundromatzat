import google.generativeai as genai
from your_app.config import Config # Import our config

class AIService:
    """
    A service class to interact with Google's Generative AI models.
    It encapsulates the logic for model initialization and content generation.
    """
    def __init__(self, model_name: str = None):
        """
        Initializes the AIService with a specified or default model.

        Args:
            model_name (str, optional): The name of the AI model to use.
                                        If None, Config.AI_MODEL_NAME will be used.
        Raises:
            Exception: If the GenerativeModel fails to initialize.
        """
        # Ensure genai is configured before attempting to initialize a model
        if not Config._configured_genai:
            print("Warning: genai SDK not configured. Attempting to re-initialize.")
            Config.initialize_genai() # Try to configure again if not already

        self.model_name = model_name if model_name else Config.AI_MODEL_NAME
        try:
            # The model name is expected in the format 'model-name', not 'models/model-name'.
            # The SDK handles prepending 'models/' internally.
            self.model = genai.GenerativeModel(self.model_name)
            print(f"AI Service initialized with model: '{self.model_name}'")
        except Exception as e:
            print(f"CRITICAL ERROR: Failed to initialize GenerativeModel '{self.model_name}'. "
                  f"Please check model name and API key. Details: {e}")
            raise # Re-raise to prevent the application from starting with a broken AI service

    def generate_content(self, prompt: str) -> str:
        """
        Generates content from the AI model based on the given prompt.

        Args:
            prompt (str): The text prompt for the AI.

        Returns:
            str: The generated text content, or an error message if generation fails.

        Raises:
            genai.APIError: For specific API-related errors.
            Exception: For any other unexpected errors during generation.
        """
        try:
            response = self.model.generate_content(prompt)

            # Check if the response contains any candidates (generated text)
            if response.candidates:
                # Access the text from the first candidate.
                # In most cases, there's only one candidate.
                return response.text
            else:
                # This block is typically hit when content is blocked by safety filters
                # or if the model could not generate a response for other reasons.
                error_message = f"AI generation failed for prompt: '{prompt}'. No candidates found."
                if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
                    # Provide more details if prompt_feedback is available
                    error_message += f"\nPrompt Feedback: {response.prompt_feedback}"
                print(f"Warning: {error_message}")
                return "AI could not generate a response for this prompt due to content policies or other issues."

        except genai.APIError as e:
            print(f"API Error during content generation: {e}")
            # Re-raise the APIError to allow upstream components to handle it specifically
            raise
        except Exception as e:
            print(f"An unexpected error occurred during content generation: {e}")
            # Re-raise generic exceptions for broader error handling
            raise

# Example of usage (for demonstration/testing purposes)
if __name__ == "__main__":
    print("Running AI Service example...")
    try:
        # The Config.initialize_genai() will have already been called when 'config' is imported.
        # This ensures the API key is set before AIService tries to use it.
        service = AIService()
        question = "Tell me a short, inspiring quote about perseverance."
        quote = service.generate_content(question)
        print(f"\nPrompt: {question}")
        print(f"AI Response:\n{quote}")

        print("\nTesting a different prompt...")
        question2 = "Write a simple Python function that calculates the factorial of a number."
        code_example = service.generate_content(question2)
        print(f"\nPrompt: {question2}")
        print(f"AI Response:\n{code_example}")

    except Exception as e:
        print(f"Application encountered a critical error: {e}")
