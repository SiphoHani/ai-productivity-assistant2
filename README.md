# FlowDesk: AI Productivity Assistant

A browser-based assistant that automates common workplace tasks. Five features (the brief required three):

| Feature | What it does |
|---|---|
| Smart Email Generator | Context-based emails; formal / informal / persuasive; adapts to client, manager or team |
| Meeting Notes Summarizer | Summary, key points, decisions, action items, deadlines |
| AI Task Planner | Eisenhower prioritisation, time-blocked schedule, optimisation tips |
| AI Research Assistant | TL;DR, insights, plain-language version, recommendations, verification list |
| AI Chatbot | Multi-turn workplace assistant with conversation memory |

## Run it
1. Unzip and open `index.html` in any modern browser. No install, no build step.
2. **Demo mode** works offline with built-in template engines (`fallback.js`).
3. **Live AI mode**: open Settings, paste a free Gemini API key (https://aistudio.google.com), Save.

Optional local server: `python -m http.server 8000`, then visit http://localhost:8000

## Structure
```
index.html     UI (tabs, forms)
styles.css     Responsive light/dark styling
prompts.js     Prompt library (role, context, task, constraints, format, guardrails)
fallback.js    Offline engines for demo mode
app.js         UI logic, Gemini API calls, PII warning, time-saved meter
docs/          Prompt engineering notes, responsible AI, test cases, impact
```

## Deploy (GitHub Pages)
Create a repo, upload all files, then Settings > Pages > Deploy from branch `main` / root.

## Tools used
Claude (design, code, prompt drafting), Google Gemini API (runtime AI). Tools must be declared in your submission.

## Limitations
Demo mode is rule-based, not generative. AI output can be wrong; always review. The API key is stored in the browser's localStorage only.
