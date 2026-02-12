import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
# This should be called once at application startup
load_dotenv()

class Config:
    """
    Configuration class for the application.
    Loads settings from environment variables with sensible defaults.
    """
    # Gemini API Key: Required for accessing the Google Generative AI service.
    # It's highly recommended to set this as an environment variable in production.
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "dummy-api-key-for-dev")

    # AI Model Name: Specifies which Gemini model to use for content generation.
    # 'gemini-1.5-pro-latest' is a powerful, general-purpose model.
    # 'gemini-pro' is a slightly older but stable and often more cost-effective option.
    # 'gemini-pro-vision' for multimodal (text + image) tasks.
    AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", "gemini-1.5-pro-latest")

    # Flag to indicate if configuration was successful
    _configured_genai = False

    @classmethod
    def initialize_genai(cls):
        """
        Initializes the Google Generative AI SDK with the configured API key.
        This method should be called once at application start.
        """
        if cls._configured_genai:
            return

        if cls.GEMINI_API_KEY and cls.GEMINI_API_KEY != "dummy-api-key-for-dev":
            try:
                genai.configure(api_key=cls.GEMINI_API_KEY)
                cls._configured_genai = True
                print("Google Generative AI SDK configured successfully.")
            except Exception as e:
                print(f"Error configuring Google Generative AI SDK: {e}")
                print("AI features may not work. Please check GEMINI_API_KEY.")
        else:
            print("Warning: GEMINI_API_KEY not found or is a dummy value. AI features may not work.")

# Initialize the Generative AI SDK when the config module is imported
Config.initialize_genai()
