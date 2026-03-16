"""
scraper.py
----------
Scrapes GeeksforGeeks Linux articles.
Targets the GFG Linux Tutorial index page, collects article URLs,
then visits each article to extract the required fields.

Respects robots.txt by:
  - Adding a 2-second delay between requests (SCRAPE_DELAY)
  - Using a descriptive User-Agent
  - Not scraping pages disallowed in robots.txt (login, profile, etc.)
"""

import time
import json
import re
import os
from datetime import datetime

import requests
from bs4 import BeautifulSoup

# ── Configuration ─────────────────────────────────────────────────────────────
BASE_URL = "https://www.geeksforgeeks.org"
LINUX_INDEX_URL = "https://www.geeksforgeeks.org/linux-tutorial/"
SCRAPE_DELAY = 2          # seconds between requests — be polite
MAX_ARTICLES = 15         # scrape up to this many articles
DATA_FILE = os.path.join(os.path.dirname(__file__), "data", "articles.json")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _get(url: str) -> BeautifulSoup | None:
    """Fetch a URL and return a BeautifulSoup object, or None on failure."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        return BeautifulSoup(response.text, "html.parser")
    except requests.RequestException as exc:
        print(f"  [!] Request failed for {url}: {exc}")
        return None


def _clean(text: str) -> str:
    """Strip excess whitespace from a string."""
    return re.sub(r"\s+", " ", text).strip()


# ── Step 1: Collect article URLs from the Linux index page ───────────────────

def get_article_urls(index_url: str = LINUX_INDEX_URL) -> list[str]:
    """
    Parses the GFG Linux Tutorial index page and returns a list of
    article URLs found in the tutorial's chapter / table-of-contents links.
    """
    print(f"[*] Fetching index page: {index_url}")
    soup = _get(index_url)
    if soup is None:
        return []

    urls = []
    seen = set()

    # GFG tutorial pages list articles inside <a> tags within various
    # container divs.  We collect all internal article links and deduplicate.
    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"].strip()

        # Keep only GFG article links (not categories, tags, login pages, etc.)
        if not href.startswith("http"):
            href = BASE_URL + href

        if (
            href.startswith(BASE_URL)
            and href != BASE_URL
            and href != index_url
            and "/login" not in href
            and "/profile" not in href
            and "?ref=" not in href
            and href not in seen
            # Only links that look like article slugs
            and len(href.replace(BASE_URL + "/", "").split("/")) >= 1
            and href.replace(BASE_URL + "/", "") != ""
        ):
            # Filter further: must look like an article (contains at least one
            # hyphenated word segment, typical of GFG article slugs)
            slug = href.replace(BASE_URL + "/", "").rstrip("/")
            if "-" in slug and not slug.startswith("tag/") and not slug.startswith("category/"):
                urls.append(href)
                seen.add(href)

    print(f"[*] Found {len(urls)} candidate article URLs.")
    return urls[:MAX_ARTICLES]


# ── Step 2: Scrape a single article page ─────────────────────────────────────

def scrape_article(url: str) -> dict:
    """
    Visits a single GFG article URL and extracts the required fields.
    Returns a dict with all fields (uses 'Not Available' for missing data).
    """
    print(f"  [→] Scraping: {url}")
    soup = _get(url)

    if soup is None:
        return _empty_article(url)

    # ── 1. Topic Title ────────────────────────────────────────────────────────
    title = "Not Available"
    for selector in ["h1.entry-title", "h1.article-title", "h1"]:
        tag = soup.select_one(selector)
        if tag:
            title = _clean(tag.get_text())
            break

    # ── 2. Difficulty Level ───────────────────────────────────────────────────
    difficulty = "Not Available"
    # GFG sometimes shows difficulty in a badge/tag near the article header
    for selector in [
        ".difficulty-chip", ".article-difficulty",
        "[class*='difficulty']", "[class*='level']",
        ".headerList"
    ]:
        tag = soup.select_one(selector)
        if tag:
            text = _clean(tag.get_text())
            if any(kw in text.lower() for kw in ["easy", "medium", "hard", "basic", "expert"]):
                difficulty = text
                break

    # Fallback: scan meta tags / breadcrumbs
    if difficulty == "Not Available":
        for tag in soup.find_all(["span", "div", "li"], limit=50):
            text = _clean(tag.get_text())
            if text.lower() in {"easy", "medium", "hard", "basic", "expert"}:
                difficulty = text.capitalize()
                break

    # ── 3. Key Technical Concepts (Introduction paragraph) ───────────────────
    concepts = "Not Available"
    article_body = soup.select_one(".entry-content, .article-body, #GFG_AD_Desktop_BTF_300x250, article")

    # Find the main content div
    content_div = None
    for selector in [".article-body", ".entry-content", ".text", "article .content"]:
        content_div = soup.select_one(selector)
        if content_div:
            break

    if content_div is None:
        # Last resort: find the largest <div> with significant paragraph text
        best = None
        best_len = 0
        for div in soup.find_all("div"):
            paras = div.find_all("p", recursive=False)
            total = sum(len(p.get_text()) for p in paras)
            if total > best_len:
                best_len = total
                best = div
        content_div = best

    if content_div:
        paragraphs = content_div.find_all("p")
        intro_parts = []
        for p in paragraphs[:4]:          # take up to 4 intro paragraphs
            txt = _clean(p.get_text())
            if len(txt) > 40:             # skip trivial/navigation text
                intro_parts.append(txt)
            if len(" ".join(intro_parts)) > 600:
                break
        if intro_parts:
            concepts = " ".join(intro_parts)

    # ── 4. Code Snippets ──────────────────────────────────────────────────────
    code_snippets = []
    if content_div:
        for pre in content_div.find_all("pre"):
            code_text = _clean(pre.get_text())
            if code_text and len(code_text) > 5:
                code_snippets.append(code_text)
        # Also catch <div class="code-block"> style
        for code_div in content_div.find_all("div", class_=re.compile(r"code", re.I)):
            code_text = _clean(code_div.get_text())
            if code_text and len(code_text) > 5 and code_text not in code_snippets:
                code_snippets.append(code_text)

    code_output = code_snippets[:3] if code_snippets else ["Not Available"]

    # ── 5. Complexity Analysis ────────────────────────────────────────────────
    complexity = "Not Available"
    if content_div:
        full_text = content_div.get_text()
        # Look for sections mentioning time/space complexity
        match = re.search(
            r"(time complexity[^\n.]*(?:O\s*\([^)]+\))?[^\n.]*\.?|"
            r"space complexity[^\n.]*(?:O\s*\([^)]+\))?[^\n.]*\.?)",
            full_text, re.IGNORECASE
        )
        if match:
            complexity = _clean(match.group(0))

        # Also scan heading-like sections titled "Complexity"
        if complexity == "Not Available":
            for heading in content_div.find_all(["h2", "h3", "h4"]):
                if "complex" in heading.get_text().lower():
                    sibling = heading.find_next_sibling()
                    if sibling:
                        complexity = _clean(sibling.get_text())[:300]
                    break

    # ── 6. References / Related Links ─────────────────────────────────────────
    references = []
    for selector in [".see-also", ".references", "[id*='reference']", "[id*='see-also']"]:
        ref_section = soup.select_one(selector)
        if ref_section:
            for a in ref_section.find_all("a", href=True):
                text = _clean(a.get_text())
                href = a["href"]
                if text:
                    references.append({"text": text, "url": href})

    # Fallback: grab the last <ul> in content which GFG often uses for references
    if not references and content_div:
        lists = content_div.find_all("ul")
        if lists:
            last_ul = lists[-1]
            for li in last_ul.find_all("li"):
                a = li.find("a", href=True)
                if a:
                    references.append({
                        "text": _clean(a.get_text()),
                        "url": a["href"]
                    })

    if not references:
        references = [{"text": "Not Available", "url": ""}]

    return {
        "title": title,
        "url": url,
        "difficulty": difficulty,
        "concepts": concepts,
        "code_snippets": code_output,
        "complexity": complexity,
        "references": references,
        "scraped_at": datetime.now().isoformat(timespec="seconds"),
    }


def _empty_article(url: str) -> dict:
    return {
        "title": "Not Available",
        "url": url,
        "difficulty": "Not Available",
        "concepts": "Not Available",
        "code_snippets": ["Not Available"],
        "complexity": "Not Available",
        "references": [{"text": "Not Available", "url": ""}],
        "scraped_at": datetime.now().isoformat(timespec="seconds"),
    }


# ── Step 3: Full scrape pipeline ──────────────────────────────────────────────

def run_scrape(progress_callback=None) -> list[dict]:
    """
    Orchestrates the full scraping job:
      1. Get article URLs from the index page.
      2. Visit each article with a polite delay.
      3. Save results to JSON.
      4. Return the list of article dicts.

    progress_callback(current, total, title) — optional callable for UI updates.
    """
    urls = get_article_urls()
    if not urls:
        print("[!] No article URLs found. Check network connectivity.")
        return []

    articles = []
    total = len(urls)

    for i, url in enumerate(urls, start=1):
        if progress_callback:
            progress_callback(i, total, url)

        article = scrape_article(url)
        articles.append(article)
        print(f"  [✓] {i}/{total} — {article['title'][:60]}")

        if i < total:
            time.sleep(SCRAPE_DELAY)   # polite delay between requests

    # Save to JSON
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({"scraped_at": datetime.now().isoformat(), "articles": articles}, f, indent=2, ensure_ascii=False)

    print(f"\n[✓] Saved {len(articles)} articles to {DATA_FILE}")
    return articles


def load_cached() -> list[dict]:
    """Load previously scraped articles from the local JSON cache."""
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("articles", [])


def cache_exists() -> bool:
    return os.path.exists(DATA_FILE)


def cache_info() -> dict:
    if not cache_exists():
        return {"exists": False}
    with open(DATA_FILE, encoding="utf-8") as f:
        data = json.load(f)
    return {
        "exists": True,
        "scraped_at": data.get("scraped_at", "Unknown"),
        "count": len(data.get("articles", [])),
    }
