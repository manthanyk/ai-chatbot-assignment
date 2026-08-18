# Orbit Chat — Secure AI Chatbot

## What I Built

Orbit Chat is a minimal but fully functional AI chatbot with a polished vanilla JavaScript interface and a Node.js Express backend. The frontend maintains the complete conversation history, sends that history to the backend, and renders the returned answer in the chat workspace. The backend validates the request, calls the AI provider, and returns only the assistant's text to the browser.

## API and Model

**API:** OpenRouter Chat Completions API  
**Model:** `openai/gpt-4o-mini`  
**Request path:** Browser → `POST /chat` → backend → OpenRouter → backend → browser

**Why backend only:** The API call is made from the backend because a key embedded in frontend JavaScript can be read by anyone through page source or browser DevTools and then reused to create unauthorized API costs. The key is loaded from `process.env.OPENROUTER_API_KEY` on the server and is never sent to the browser.

**Fallback provider:** Google Gemini API. Switching providers requires changing the OpenAI-compatible base URL to `https://generativelanguage.googleapis.com/v1beta/openai/` and changing the model name to a Gemini model such as `gemini-1.5-flash`; the frontend and conversation-history plumbing remain unchanged.

## Conversation Context

The browser stores messages as `{ role, content }` objects. Every request sends the complete array, including earlier user and assistant messages. This allows a follow-up such as “Can you give me an example of that?” to refer to the previous answer instead of starting a new conversation.

## Security Checks

The frontend contains no API key, no `OPENROUTER_API_KEY` reference, and no request to an AI provider. The only frontend request is a relative `fetch("/chat")` call to the application backend. The real environment file is ignored by Git, while `backend/.env.example` documents placeholder configuration.

## Run Locally

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add an actual OpenRouter key.
npm start
```

Open [http://localhost:3000](http://localhost:3000). To test context, ask “What is JavaScript?” and then ask “Can you give me an example of that?” in the same session.

Run the automated backend checks with:

```bash
cd backend
npm test
```

## Deployment

The backend serves the frontend as static files, so one Node.js web service can expose both parts of the assignment. For Render, use the following settings:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build command | `cd backend && npm install` |
| Start command | `cd backend && npm start` |
| Environment variable | `OPENROUTER_API_KEY=<your-secret-key>` |
| Optional model variable | `OPENROUTER_MODEL=openai/gpt-4o-mini` |

**Live Deployment:** Not deployed in this session because no Render account or deployment credential was available. The included `render.yaml` is ready for a Render web service.  
**Frontend:** Same service URL after deployment, because Express serves `frontend/`.  
**Backend:** Same service URL with `/chat` and `/health` routes.

## Technical Documentation

The project-specific technical documentation assignment is available in [docs/technical-documentation.pdf](docs/technical-documentation.pdf). Its editable source is [docs/technical-documentation.md](docs/technical-documentation.md), and the architecture diagram source is [docs/architecture.mmd](docs/architecture.mmd).

The walkthrough video is available on [Google Drive](https://drive.google.com/file/d/1p33inOZWW9pSv2DyY4dUOkjpOsP9Kdtq/view?usp=drivesdk), shared as **Anyone with the link — Viewer**.

## Project Structure

```text
.
├── backend
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── tests
│   └── backend.test.js
└── README.md
```
