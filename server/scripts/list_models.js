const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "../../.env.local" });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to get client
    // Actually, getting the model doesn't give us list method directly on the instance usually,
    // but the SDK structure exposes it on the top level or via a specific manager?
    // Checking SDK docs: genAI.getGenerativeModel is for inference.
    // Use direct REST call or check if SDK has listModels.
    // SDK 0.24.1 isn't exposing listModels easily?
    // Let's use simple fetch to the API.

    console.log(
      "Using API Key:",
      process.env.GEMINI_API_KEY ? "Found" : "Missing",
    );

    const fetch = require("node-fetch");
    const key = process.env.GEMINI_API_KEY;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
    );

    if (!response.ok) {
      console.error(
        "Failed to list models:",
        response.status,
        response.statusText,
      );
      const text = await response.text();
      console.error(text);
      return;
    }

    const data = await response.json();
    console.log("Available Models:");
    data.models.forEach((m) => {
      if (m.name.includes("gemini")) {
        console.log(`- ${m.name}`);
        console.log(`  Methods: ${m.supportedGenerationMethods.join(", ")}`);
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
