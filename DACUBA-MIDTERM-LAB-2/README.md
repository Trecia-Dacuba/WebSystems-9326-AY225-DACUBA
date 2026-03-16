# NovaScrape — Linux Academic Module Generator

A web-based scraper that automatically extracts Linux articles from GeeksforGeeks and generates a structured, professional PDF learning module.

---

## 📋 Requirements

Before you start, make sure you have the following installed:

- **Python 3.10 or higher** → [Download here](https://www.python.org/downloads/)
- **Git** → [Download here](https://git-scm.com/)
- **VS Code** (recommended) → [Download here](https://code.visualstudio.com/)

> ⚠️ When installing Python, make sure to check **"Add python.exe to PATH"** on the installer screen!

---

## 🚀 How to Run the Project

### Step 1 — Clone the Repository

Open a terminal and run:

```bash
git clone <your-repo-url>
```

Then go into the project folder:

```bash
cd DACUBA-MIDTERM-LAB-2
```

---

### Step 2 — Create a Virtual Environment

A virtual environment keeps the project's packages separate from your system Python.

```bash
python -m venv venv2
```

---

### Step 3 — Activate the Virtual Environment

**Windows (Command Prompt):**
```cmd
venv2\Scripts\activate
```

**Windows (PowerShell):**
```powershell
.\venv2\Scripts\Activate.ps1
```

> ✅ You'll know it worked when you see **(venv2)** appear at the start of your terminal line.

---

### Step 4 — Install Dependencies

```bash
pip install flask requests beautifulsoup4 reportlab
```

> ⏳ This may take a minute. Wait until it finishes before moving on.

---

### Step 5 — Fix the Parser (Important!)

Open `scraper.py` and find this line:

```python
return BeautifulSoup(response.text, "lxml")
```

Change it to:

```python
return BeautifulSoup(response.text, "html.parser")
```

Save the file **(Ctrl + S)**.

---

### Step 6 — Run the App

```bash
python app.py
```

You should see:

```
* Running on http://127.0.0.1:5000
```

---

### Step 7 — Open the Dashboard

Open your browser and go to:

```
http://127.0.0.1:5000
```

---

## 🖥️ How to Use

Once the dashboard is open, follow the 3 steps on screen:

| Step | What to do |
|------|------------|
| **1 — Run Scraper** | Click **▶ Start Scraping** and wait for the progress bar to finish (~2–3 mins) |
| **2 — Preview Articles** | Click **Load Articles** to browse all scraped content. Click any card for details. |
| **3 — Generate PDF** | Enter your name and click **⬇ Generate PDF**, then download it |

---

## 📁 Project Structure

```
DACUBA-MIDTERM-LAB-2/
├── app.py               ← Flask web server (run this)
├── scraper.py           ← Web scraper (BeautifulSoup)
├── pdf_generator.py     ← PDF builder (ReportLab)
├── requirements.txt     ← Python dependencies
├── templates/
│   └── index.html       ← Dashboard UI
├── data/
│   └── articles.json    ← Auto-created when you scrape
└── output/
    └── *.pdf            ← Generated PDFs saved here
```

---

## ❓ Common Issues

**`pip` is not recognized**
→ Make sure your virtual environment is activated (you should see `(venv2)` in the terminal)

**`python` is not recognized**
→ Try using `py` instead of `python`, or reinstall Python and check "Add to PATH"

**Scraper returns 0 articles**
→ Check your internet connection and make sure you changed `"lxml"` to `"html.parser"` in `scraper.py`

**Port already in use**
→ Another app is using port 5000. Open `app.py` and change `port=5000` to `port=5001`, then visit `http://127.0.0.1:5001`

**PDF generation fails**
→ Make sure you ran the scraper first and have cached articles before clicking Generate PDF

---

## 🛑 How to Stop the Server

Press **Ctrl + C** in the terminal.

---

## 📌 Notes

- Scraped data is saved locally in `data/articles.json` — you can generate a PDF anytime without re-scraping
- The scraper waits 2 seconds between each article request to respect GeeksforGeeks' `robots.txt`
- Generated PDFs are stored in the `output/` folder and can be re-downloaded anytime from the dashboard