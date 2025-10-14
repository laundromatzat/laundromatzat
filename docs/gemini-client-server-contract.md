# Gemini Client ↔ Server Contract

This document summarizes how the front end and Express server collaborate when a
user chats with the portfolio assistant. Keeping the contract lightweight makes
it easier to iterate on Gemini prompts and server adapters without breaking the
UI.

## HTTP Endpoints

### `POST /api/chat`
- **Request body**: `{ "message": string }`
- **Success response**: `{ "message": string }`
  - The `message` field contains the assistant's natural-language reply. It may
    also encode structured actions (e.g., JSON describing a search). The client
    is responsible for interpreting those instructions.
- **Failure response**: `{ "error": string }` with an appropriate HTTP status.

### `POST /api/generate-content`
- **Request body**: `{ "prompt": string }`
- **Success response**: `{ "content": string }`
- **Failure response**: `{ "error": string }`

## Client Abstraction

`services/geminiClient.ts` exports `createChatSession`, which returns a
`ClientChatSession` object:

```ts
interface ClientChatSession {
  sendMessage(message: string): Promise<string>;
  sendMessageStream(message: string): AsyncIterable<{ text: string }>;
}
```

- `sendMessage` issues a single `/api/chat` request and resolves with the final
  assistant text.
- `sendMessageStream` wraps `sendMessage` and yields incremental `{ text }`
  chunks. Today it emits a single chunk, but it can be upgraded to true
  streaming responses without changing the component contract.

Both helpers surface any `fetch` errors so React components can show fallback
messages.

## UI Expectations

- When the chat bubble is opened the client calls `createChatSession()` and
  greets the user immediately.
- Each user message is piped to `sendMessageStream`. As chunks arrive the UI
  updates the active assistant bubble; once the full payload is received the
  component attempts to parse action JSON and either filters projects or shows
  the free-form reply.
- If JSON includes a `projects` array the client calls `onSearch(projects)` and
  replaces the last assistant message with "I've updated the grid with your
  search results.".

## Extending the Contract

- To support true streaming, update `/api/chat` to return a streamable payload
  (SSE, Fetch streaming, etc.) and modify `ClientChatSession.sendMessageStream`
  to yield the partial text. Components will automatically consume it.
- Additional structured actions can be added by extending the parsing logic in
  `ChatAssistant.tsx`. Keep responses machine-readable (JSON fenced or bare)
  alongside conversational text for resilience.
- Whenever server payloads change, add or update tests under `tests/` to codify
  the expected flow.
