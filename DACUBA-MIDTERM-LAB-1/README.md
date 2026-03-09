# Kotaku Game Database Scraper
### Midterm Lab 1 — Web Scraping with Node.js

A web scraper that pulls real game data (title, developer, publisher, release date, platforms, genre) from **kotaku.com/games** and displays it in a browser-based interface. Built with Node.js, Express, Axios, and Cheerio.

---

## Requirements

Before running the project, make sure you have the following installed:

- **Node.js** (v18 or higher) — https://nodejs.org
- **npm** (comes bundled with Node.js)

To check if you already have them, open a terminal and run:

```
node -v
npm -v
```

Both commands should return a version number.

---

## Setup

**1. Download or clone the repository**

If cloning from GitHub:
```
git clone <repository-url>
```

Then enter the project folder:
```
cd midtermlab1-kotaku-scraper
```

**2. Install dependencies**

Run this once inside the project folder:
```
npm install
```

This installs all required packages (Express, Axios, Cheerio, etc.) listed in `package.json`.

---

## Running the App

**Start the server:**
```
npm start
```

You should see this in the terminal:
```
============================================================
  🎮  KOTAKU SCRAPER SERVER
============================================================
  🌐 Web UI   → http://localhost:3000
  📡 API      → http://localhost:3000/api/games
============================================================
```

**Open the web interface:**

Open your browser and go to:
```
http://localhost:3000
```

---

## How to Scrape Games

1. In the **Target URL** field, paste a Kotaku games URL, for example:
   ```
   https://kotaku.com/games
   ```
2. Click **SCRAPE NOW**
3. Wait for the scrape to finish — it visits each game page individually so it takes a minute or two
4. The game cards will appear automatically when done

You can also try genre-specific pages:
- `https://kotaku.com/games` — all genres
- Any game section URL from kotaku.com

---

## Features

| Feature | Description |
|---|---|
| Search | Search by title, developer, publisher, genre |
| Filter by Platform | Filter games by platform (PS5, PC, Switch, etc.) |
| Filter by Genre | Filter by genre (RPG, Horror, Racing, etc.) |
| Sort | Sort by title or date |
| ⬇Export JSON | Download all scraped data as `.json` |
| ⬇Export CSV | Download all scraped data as `.csv` |
| Grid / List View | Toggle between card grid and list layout |

---

## Stopping the Server

Press **Ctrl + C** in the terminal to stop the server.

---

## Project Structure

```
midtermlab1-kotaku-scraper/
├── scraper.js        # Scraping logic (Axios + Cheerio)
├── server.js         # Express web server + API routes
├── public/
│   └── index.html    # Browser UI
├── data/
│   ├── games.json    # Scraped data (created after first scrape)
│   └── games.csv     # Scraped data in CSV format
├── package.json      # Project dependencies
└── README.md         # This file
```

---

## Tech Stack

- **Node.js** — JavaScript runtime
- **Express** — Web server and API
- **Axios** — HTTP requests to Kotaku
- **Cheerio** — HTML parsing (server-side jQuery)
- **HTML / CSS / JS** — Frontend interface

---

## Notes

- An internet connection is required to scrape live data from kotaku.com
- Previously scraped data is saved to the `data/` folder and loads automatically on restart
- The `node_modules/` folder is not included in the repository — `npm install` recreates it