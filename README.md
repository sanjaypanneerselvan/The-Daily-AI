# AI-Newspaper — Full Project (Backend + Frontend)

This package contains a runnable example of an automated AI-powered daily newspaper.

## Contents

- `backend/` — FastAPI backend that fetches RSS feeds, extracts article text (newspaper3k), and summarizes with a Hugging Face summarization model.
- `frontend/` — Pure HTML/CSS/JS classic newspaper UI with download & share features.

## Requirements

- Python 3.9+
- Node/npm is NOT required (frontend is pure static files)
- Internet access (to fetch RSS feeds and to download the summarization model on first run)

---

## Run Backend

1. Open a terminal and go to the backend folder:

```bash
cd ai-newspaper-full/backend
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
# Linux / macOS
source venv/bin/activate
# Windows (PowerShell)
venv\Scripts\Activate.ps1
# Windows (cmd.exe)
venv\Scripts\activate.bat
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. (Optional) Customize RSS feeds in `main.py` (the FEEDS list).

5. Run the server:

```bash
uvicorn main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`.
Check health at `http://localhost:8000/api/health`.
Articles endpoint: `http://localhost:8000/api/articles`.

---

## Run Frontend

1. Open a new terminal and serve the static frontend folder. The simplest way:

```bash
cd ai-newspaper-full/frontend
python -m http.server 5174
```

2. Open `http://localhost:5174` in your browser.

> Make sure the backend is running (port 8000). The frontend calls `/api/articles` on the same host; if you serve frontend from a different origin, enable CORS in backend or use a proxy.

---

## Notes & Troubleshooting

- The first time you call the summarizer, the model will be downloaded — this can take time and bandwidth.
- `newspaper3k` may download NLTK resources on first use; ensure the server environment allows internet access.
- If some sites block scraping, article extraction may be incomplete; the app falls back to RSS summaries where possible.
- To run as a single host in production, consider:
  - Using a process manager (systemd, PM2) for backend.
  - Serving frontend via Nginx.
  - Enabling HTTPS.
  - Adding caching (Redis) to avoid re-summarizing articles on every request.

---

## Optional Improvements

- Add a scheduler in backend to pre-generate and cache daily newspapers.
- Add server-side PDF generation (WeasyPrint/wkhtmltopdf) for higher fidelity.
- Add user subscription & distribution (email/WhatsApp using WhatsApp Cloud API).
