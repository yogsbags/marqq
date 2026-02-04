# martech

## Running locally

- **Full dev (frontend + API, required for GTM Strategy Chat):**

  ```bash
  npm run dev:full
  ```

  Then open **http://localhost:3007**. The backend runs on port 3008; Vite on 3007 proxies `/api/*` to it.

- **Frontend only:** `npm run dev` (port 3007). API calls like `/api/gtm/questions` will fail with `ERR_CONNECTION_REFUSED` unless the backend is also running.

**GTM Strategy Chat** needs a Gemini API key. In `enhanced-bulk-generator-frontend/.env` set:
`GEMINI_API_KEY=your-key` (get one at https://aistudio.google.com/app/apikey). Without it, `/api/gtm/questions` returns 500.
