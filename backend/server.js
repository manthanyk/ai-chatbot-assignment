import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const frontendDirectory = path.resolve(__dirname, "../frontend");

app.use(cors({ origin: true }));
app.use(express.json({ limit: "64kb" }));
app.use(express.static(frontendDirectory));

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
    return false;
  }

  return messages.every(
    (message) =>
      message &&
      (message.role === "user" || message.role === "assistant" || message.role === "system") &&
      typeof message.content === "string" &&
      message.content.trim().length > 0 &&
      message.content.length <= 4000,
  );
}

export async function requestChatCompletion(messages, fetchImplementation = fetch) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const error = new Error("OPENROUTER_API_KEY is not configured on the server.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetchImplementation(
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Secure AI Chatbot Assignment",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        messages,
        temperature: 0.7,
      }),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    const providerMessage = data?.error?.message || "The AI provider returned an error.";
    const error = new Error(providerMessage);
    error.statusCode = response.status >= 500 ? 502 : 400;
    throw error;
  }

  const reply = data?.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || reply.trim().length === 0) {
    const error = new Error("The AI provider returned an empty response.");
    error.statusCode = 502;
    throw error;
  }

  return reply.trim();
}

app.get("/health", (_request, response) => {
  response.json({ status: "ok", service: "secure-ai-chatbot" });
});

app.post("/chat", async (request, response) => {
  const { messages } = request.body ?? {};
  if (!validateMessages(messages)) {
    return response.status(400).json({
      error: "messages must be a non-empty array of valid conversation messages.",
    });
  }

  try {
    const reply = await requestChatCompletion(messages);
    return response.json({ reply });
  } catch (error) {
    console.error("Chat completion failed:", error.message);
    return response.status(error.statusCode || 500).json({
      error: error.statusCode === 503 ? error.message : "Unable to get an AI response right now.",
    });
  }
});

app.get("*", (_request, response) => {
  response.sendFile(path.join(frontendDirectory, "index.html"));
});

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`AI chatbot running at http://localhost:${port}`);
  });
}

export { app, validateMessages };
