"""
app.py
------
Flask web application that exposes a dashboard for:
  - Triggering the GFG Linux scraper
  - Previewing scraped articles
  - Generating and downloading the academic PDF

Routes
------
GET  /                   → Serves the dashboard HTML page
POST /api/scrape         → Starts a scraping job (runs in a background thread)
GET  /api/scrape/status  → Returns the current status of the scraping job
GET  /api/articles       → Returns cached articles as JSON
POST /api/generate-pdf   → Generates the PDF from cached articles
GET  /api/download/<fn>  → Streams the PDF file for download
GET  /api/cache-info     → Returns metadata about the current cache
DELETE /api/cache        → Deletes the cached JSON data
"""

import os
import json
import threading
from datetime import datetime
from pathlib import Path

from flask import (
    Flask, jsonify, request, send_file,
    render_template, abort
)

import scraper
import pdf_generator

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Global scrape-job state ───────────────────────────────────────────────────
_job = {
    "running": False,
    "progress": 0,
    "total": 0,
    "current_url": "",
    "done": False,
    "error": None,
    "articles_count": 0,
    "started_at": None,
    "finished_at": None,
}
_job_lock = threading.Lock()


def _reset_job():
    with _job_lock:
        _job.update({
            "running": False, "progress": 0, "total": 0,
            "current_url": "", "done": False, "error": None,
            "articles_count": 0, "started_at": None, "finished_at": None,
        })


def _run_scrape_job():
    """Background thread that runs the scraper."""
    with _job_lock:
        _job["running"] = True
        _job["done"] = False
        _job["error"] = None
        _job["started_at"] = datetime.now().isoformat(timespec="seconds")

    def progress_cb(current, total, url):
        with _job_lock:
            _job["progress"]    = current
            _job["total"]       = total
            _job["current_url"] = url

    try:
        articles = scraper.run_scrape(progress_callback=progress_cb)
        with _job_lock:
            _job["articles_count"] = len(articles)
            _job["done"]           = True
            _job["running"]        = False
            _job["finished_at"]    = datetime.now().isoformat(timespec="seconds")
    except Exception as exc:
        with _job_lock:
            _job["error"]    = str(exc)
            _job["running"]  = False
            _job["done"]     = True
            _job["finished_at"] = datetime.now().isoformat(timespec="seconds")


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/scrape", methods=["POST"])
def api_scrape():
    """Start a new scraping job (only one at a time)."""
    with _job_lock:
        if _job["running"]:
            return jsonify({"error": "A scraping job is already running."}), 409

    _reset_job()
    thread = threading.Thread(target=_run_scrape_job, daemon=True)
    thread.start()
    return jsonify({"message": "Scraping job started."}), 202


@app.route("/api/scrape/status")
def api_scrape_status():
    """Return the current scrape-job status."""
    with _job_lock:
        return jsonify(dict(_job))


@app.route("/api/articles")
def api_articles():
    """Return all cached articles as JSON."""
    articles = scraper.load_cached()
    return jsonify({
        "count": len(articles),
        "articles": articles,
    })


@app.route("/api/cache-info")
def api_cache_info():
    return jsonify(scraper.cache_info())


@app.route("/api/cache", methods=["DELETE"])
def api_delete_cache():
    if os.path.exists(scraper.DATA_FILE):
        os.remove(scraper.DATA_FILE)
        return jsonify({"message": "Cache deleted."})
    return jsonify({"message": "No cache to delete."})


@app.route("/api/generate-pdf", methods=["POST"])
def api_generate_pdf():
    """Generate a PDF from the currently cached articles."""
    articles = scraper.load_cached()
    if not articles:
        return jsonify({"error": "No cached articles found. Run the scraper first."}), 400

    body = request.get_json(silent=True) or {}
    student_name = body.get("student_name", pdf_generator.GENERATOR_NAME)

    try:
        filepath = pdf_generator.generate_pdf(articles, student_name=student_name)
        filename = os.path.basename(filepath)
        return jsonify({
            "message": "PDF generated successfully.",
            "filename": filename,
            "download_url": f"/api/download/{filename}",
        })
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/download/<filename>")
def api_download(filename):
    """Stream a generated PDF file for download."""
    # Security: only allow filenames that look like our generated PDFs
    if not filename.startswith("GFG_Linux_Module_") or not filename.endswith(".pdf"):
        abort(404)

    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        abort(404)

    return send_file(
        filepath,
        as_attachment=True,
        download_name=filename,
        mimetype="application/pdf",
    )


@app.route("/api/delete-pdf/<filename>", methods=["DELETE"])
def api_delete_pdf(filename):
    """Delete a generated PDF file."""
    if not filename.startswith("GFG_Linux_Module_") or not filename.endswith(".pdf"):
        abort(404)

    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "File not found."}), 404

    os.remove(filepath)
    return jsonify({"message": f"{filename} deleted successfully."})


@app.route("/api/pdfs")
def api_list_pdfs():
    """List all previously generated PDFs."""
    pdfs = sorted(
        [f for f in os.listdir(OUTPUT_DIR) if f.endswith(".pdf")],
        reverse=True,
    )
    return jsonify([
        {
            "filename": f,
            "download_url": f"/api/download/{f}",
            "size_kb": round(os.path.getsize(os.path.join(OUTPUT_DIR, f)) / 1024, 1),
        }
        for f in pdfs
    ])


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  GFG Linux Academic Scraper — Dashboard")
    print("  Open http://127.0.0.1:5000 in your browser")
    print("=" * 60)
    app.run(debug=True, host="0.0.0.0", port=5000)