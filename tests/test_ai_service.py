import unittest
import os
from unittest.mock import patch, MagicMock
import google.generativeai as genai
from your_app.ai_service import AIService
from your_app.config import Config
from dotenv import load_dotenv

# Load environment variables for potential use in integration tests.
# Unit tests will mock os.environ, but integration tests need real values.
load_dotenv()

# --- Unit Tests ---
# Unit tests mock the external genai library to ensure our AIService logic is correct
# without making actual network calls.

@patch.dict(os.environ, {
    'AI_MODEL_NAME': 'gemini-unit-test-model',
    'GEMINI_API_KEY': 'mock-api-key' # Even though genai is mocked, config might check for existence
})
class TestAIServiceUnit(unittest.TestCase):
    """
    Unit tests for the AIService class, mocking external dependencies.
    """
    @classmethod
    def setUpClass(cls):
        # Re-initialize config for unit tests to ensure it uses the patched environment.
        # This is important because config.py might have loaded env vars before patching.
        Config.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
        Config.AI_MODEL_NAME = os.getenv("AI_MODEL_NAME")
        # Prevent actual genai.configure from running in unit tests if not already configured
        # Or ensure it's configured with dummy data if it must run
        if not Config._configured_genai:
             # Manually set to true to bypass actual genai.configure in unit tests
             Config._configured_genai = True

    def setUp(self):
        # Reset the mock for each test
        # Patching google.generativeai.GenerativeModel at the class level will apply to all methods
        # The specific patch decorator on methods also works but class level is cleaner for unit tests.
        pass # Actual mocking happens in the test methods themselves via decorators

    @patch('google.generativeai.GenerativeModel') # Mock the GenerativeModel constructor
    def test_service_initializes_with_correct_model(self, mock_generative_model):
        """
        Tests that AIService initializes genai.GenerativeModel with the correct model name
        from configuration.
        """
        # Configure the mock to return a mock instance
        mock_generative_model.return_value = MagicMock()

        # Re-initialize service to ensure it uses the mock
        service = AIService()

        # Assert that GenerativeModel was called with the expected model name from patched env
        mock_generative_model.assert_called_once_with('gemini-unit-test-model')
        self.assertEqual(service.model_name, 'gemini-unit-test-model')

    @patch('google.generativeai.GenerativeModel')
    def test_generate_content_calls_model_with_prompt(self, mock_generative_model):
        """
        Tests that generate_content method correctly calls the underlying
        GenerativeModel's generate_content with the given prompt.
        """
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.return_value = MagicMock(text="Mocked AI response")
        mock_generative_model.return_value = mock_model_instance

        service = AIService()
        prompt = "Hello AI"
        response = service.generate_content(prompt)

        # Assert that generate_content was called on the mock model instance
        mock_model_instance.generate_content.assert_called_once_with(prompt)
        self.assertEqual(response, "Mocked AI response")

    @patch('google.generativeai.GenerativeModel')
    def test_generate_content_handles_api_error(self, mock_generative_model):
        """
        Tests that APIError from the GenerativeModel is correctly propagated.
        """
        mock_model_instance = MagicMock()
        mock_model_instance.generate_content.side_effect = genai.APIError("Test API Error")
        mock_generative_model.return_value = mock_model_instance

        service = AIService()
        prompt = "Problematic prompt"
        with self.assertRaises(genai.APIError):
            service.generate_content(prompt)

    @patch('google.generativeai.GenerativeModel')
    def test_generate_content_handles_no_candidates(self, mock_generative_model):
        """
        Tests that the service gracefully handles responses with no generated candidates
        (e.g., due to safety filters).
        """
        mock_model_instance = MagicMock()
        # Simulate a response object with no text and no candidates
        mock_response_no_text = MagicMock()
        mock_response_no_text.candidates = [] # Crucial for this test case
        mock_response_no_text.text = None # Ensure text property is None
        mock_response_no_text.prompt_feedback = MagicMock(block_reason=1, safety_ratings=[]) # Example feedback
        mock_model_instance.generate_content.return_value = mock_response_no_text
        mock_generative_model.return_value = mock_model_instance

        service = AIService()
        prompt = "Prompt that might be blocked by safety filters."
        response = service.generate_content(prompt)

        self.assertIn("AI could not generate a response", response)
        self.assertIsInstance(response, str)


# --- Integration Tests ---
# Integration tests make actual API calls to the Google Generative AI service.
# Requires a real API key set in the environment variable GEMINI_API_KEY_TEST.

# Skip these tests if GEMINI_API_KEY_TEST is not set, as they require live API calls.
@unittest.skipUnless(os.getenv("GEMINI_API_KEY_TEST"),
                     "GEMINI_API_KEY_TEST environment variable not set. Skipping integration tests.")
class TestAIServiceIntegration(unittest.TestCase):
    """
    Integration tests for the AIService class, making real API calls.
    Requires GEMINI_API_KEY_TEST and AI_MODEL_NAME to be set in the environment.
    """
    _original_genai_api_key = None # To restore original API key if it was set

    @classmethod
    def setUpClass(cls):
        # Store original genai config if it exists
        if genai.get_default_options():
            cls._original_genai_api_key = genai.get_default_options().api_key
        else:
            cls._original_genai_api_key = None

        # Configure genai with the test API key for integration tests
        test_api_key = os.getenv("GEMINI_API_KEY_TEST")
        if not test_api_key:
            raise unittest.SkipTest("GEMINI_API_KEY_TEST not set for integration tests")

        genai.configure(api_key=test_api_key)
        Config._configured_genai = True # Mark as configured

        # Ensure Config.AI_MODEL_NAME reflects the actual model for integration tests
        cls.integration_model_name = os.getenv("AI_MODEL_NAME", "gemini-1.5-pro-latest")
        Config.AI_MODEL_NAME = cls.integration_model_name # Update config for the service

        try:
            # Pre-check if the chosen model is available for the test API key
            found_model = False
            for m in genai.list_models():
                if m.name == f"models/{cls.integration_model_name}" and 'generateContent' in m.supported_generation_methods:
                    found_model = True
                    break
            if not found_model:
                raise unittest.SkipTest(f"Configured model '{cls.integration_model_name}' not found or "
                                        f"does not support generateContent for the provided API key. "
                                        f"Please check AI_MODEL_NAME and GEMINI_API_KEY_TEST.")
            print(f"\nIntegration tests configured with model: {cls.integration_model_name}")

        except Exception as e:
            raise unittest.SkipTest(f"Failed to list models or verify chosen model for integration tests: {e}")

    @classmethod
    def tearDownClass(cls):
        # Restore original genai config if it was set
        if cls._original_genai_api_key:
            genai.configure(api_key=cls._original_genai_api_key)
        elif genai.get_default_options(): # If no original key, unset it if currently set
            genai.get_default_options().api_key = None
        Config._configured_genai = False # Reset config flag

    def test_real_generate_content_call_success(self):
        """
        Tests that a real API call to generate content is successful and returns
        a plausible response.
        """
        service = AIService()
        prompt = "What is the capital of France?"
        try:
            response = service.generate_content(prompt)
            self.assertIsInstance(response, str)
            self.assertGreater(len(response), 0)
            self.assertIn("Paris", response, "Expected 'Paris' in the AI response")
            print(f"\nIntegration Test (Success) Output for '{prompt}':\n{response[:100]}...")
        except Exception as e:
            self.fail(f"Integration test failed unexpectedly: {e}")

    def test_real_generate_content_call_with_slightly_longer_prompt(self):
        """
        Tests a real API call with a slightly longer prompt to ensure robustness.
        """
        service = AIService()
        prompt = "Explain the concept of quantum entanglement in simple terms, as if you're talking to a high school student. Provide an analogy."
        try:
            response = service.generate_content(prompt)
            self.assertIsInstance(response, str)
            self.assertGreater(len(response), 50) # Expect a more substantial response
            self.assertIn("analogy", response.lower(), "Expected an analogy in the AI response")
            print(f"\nIntegration Test (Longer Prompt) Output:\n{response[:100]}...")
        except Exception as e:
            self.fail(f"Integration test with longer prompt failed: {e}")

    def test_real_generate_content_call_with_potential_safety_issue(self):
        """
        Tests that the service handles potential safety-blocked content gracefully,
        returning a predefined message rather than raw API error.
        This test might occasionally pass if the prompt isn't actually blocked,
        but it verifies the error handling path if it were.
        """
        service = AIService()
        # Craft a prompt that might trigger safety filters (be careful not to make it actually offensive)
        # This is hard to guarantee, but we test the return path if it happens.
        prompt = "Tell me a story with extreme violence and graphic descriptions."
        try:
            response = service.generate_content(prompt)
            # If it passes safety, it will return content, otherwise the specific message
            if "AI could not generate a response" not in response:
                print(f"\nNote: Prompt was not blocked, received AI response:\n{response[:100]}...")
            else:
                self.assertIn("AI could not generate a response", response)
                print(f"\nIntegration Test (Safety) Output: Prompt was blocked as expected.")
        except Exception as e:
            self.fail(f"Integration test with safety prompt failed unexpectedly: {e}")
