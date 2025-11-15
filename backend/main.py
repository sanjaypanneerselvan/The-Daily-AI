# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import feedparser
from newspaper import Article
from transformers import pipeline
from datetime import datetime
import asyncio
import httpx
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

app = FastAPI(title="AI Newspaper Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FEEDS = [
    # Example RSS feeds (change or add as needed)
    "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
    "https://www.thehindu.com/news/national/feeder/default.rss",
    "http://feeds.bbci.co.uk/news/world/rss.xml",
    "https://feeds.reuters.com/reuters/topNews",
]

# Summarizer pipeline (will download model on first run)
SUMMARIZER_MODEL = os.getenv("SUMMARIZER_MODEL", "sshleifer/distilbart-cnn-12-6")

# Lazy load summarizer
summarizer = None

async def get_summarizer():
    global summarizer
    if summarizer is None:
        summarizer = pipeline("summarization", model=SUMMARIZER_MODEL)
    return summarizer


class ArticleOut(BaseModel):
    title: str
    summary: str
    link: str
    published: str | None = None
    image: str | None = None


async def fetch_and_summarize(entry):
    try:
        link = entry.get('link')
        title = entry.get('title')
        published = entry.get('published', None)
        image = None

        # Try to extract image and summary from feed first
        summary = entry.get('summary', '')
        
        # Try to extract article content and image using newspaper3k
        try:
            art = Article(link)
            art.download()
            art.parse()
            image = art.top_image if hasattr(art, 'top_image') and art.top_image else None
            
            # Use feed summary if available, otherwise try article text
            if not summary or len(summary.split()) < 20:
                summary = art.text[:500] if art.text else summary
        except:
            # If extraction fails, just use feed summary
            pass

        # Clean up summary to max 300 chars
        if summary:
            summary = summary[:300].strip()
        
        return ArticleOut(
            title=title,
            summary=summary or "No summary available",
            link=link,
            published=published,
            image=image
        )
    except Exception as e:
        # Return a simple fallback so a single failure doesn't break everything
        return ArticleOut(
            title=entry.get('title', 'Untitled'),
            summary=(entry.get('summary', '') or '')[:300],
            link=entry.get('link', ''),
            published=entry.get('published', None),
            image=None
        )


@app.get('/api/articles')
async def get_articles(limit: int = 12):
    """Fetch RSS feeds, extract and summarize articles. Returns up to `limit` articles."""
    entries = []
    for feed_url in FEEDS:
        try:
            parsed = feedparser.parse(feed_url)
            for e in parsed.entries:
                entries.append(e)
        except Exception:
            continue

    # sort by published date if available
    def pub_key(e):
        p = e.get('published_parsed') or e.get('updated_parsed')
        if p:
            try:
                return datetime(*p[:6])
            except Exception:
                return datetime.min
        else:
            return datetime.min

    entries_sorted = sorted(entries, key=pub_key, reverse=True)[:limit]

    # fetch & summarize concurrently
    tasks = [fetch_and_summarize(e) for e in entries_sorted]
    results = await asyncio.gather(*tasks)
    return [r.model_dump() if hasattr(r, 'model_dump') else r.dict() for r in results]


@app.get('/api/health')
async def health():
    return {"status": "ok"}

# Serve frontend static files
frontend_path = Path(__file__).parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

# To run: uvicorn main:app --reload --port 8000
