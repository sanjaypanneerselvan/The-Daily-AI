# Backend README

This backend is a FastAPI app that:
- Fetches RSS feeds (configured in `main.py`)
- Extracts article text with `newspaper3k`
- Summarizes articles using a Hugging Face summarization pipeline

## Setup

1. Create a virtual environment and activate it:

```bash
python -m venv venv
# Linux / macOS
source venv/bin/activate
# Windows (PowerShell)
venv\Scripts\Activate.ps1
# Windows (cmd.exe)
venv\Scripts\activate.bat
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. (Optional) Create a `.env` file to override the summarizer model:

```
SUMMARIZER_MODEL=sshleifer/distilbart-cnn-12-6
```

4. Run the server:

```bash
uvicorn main:app --reload --port 8000
```

5. Open the articles endpoint:

- http://localhost:8000/api/articles
- Health: http://localhost:8000/api/health

Notes:
- The first run will download the summarization model (~200-500MB depending on model).
- `newspaper3k` may attempt to download NLTK data on first use.
