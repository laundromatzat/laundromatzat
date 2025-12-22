import dotenv from "dotenv";
import path from "path";

// Assuming CWD is server/ we need to go up one level to find .env.local
dotenv.config({ path: path.resolve(process.cwd(), "../.env.local") });

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://laundromatzat.com",
  "https://www.laundromatzat.com",
];

function parseOrigins(value: string | undefined): string[] {
  if (!value) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export const config = {
  port: Number.parseInt(process.env.PORT ?? "3001", 10),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  allowedOrigins: parseOrigins(process.env.CORS_ORIGINS),
};
