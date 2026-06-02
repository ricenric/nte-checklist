# NTE H.E.L.P.E.R. Checklist System

A modern, high-performance static web application designed as a progression tracker and reset checklist for the open-world game **Neverness to Everness (NTE)**. 

This tool is optimized for zero-overhead deployment via **GitHub Pages**, utilizing client-side computing to offer automated lifecycle resets and real-time countdown trackers locked perfectly to the server standard **North American Eastern Time (ET)** zone.

---

## 🚀 Live Deployment

The system is hosted entirely as a serverless static webpage. You can view, bookmark, and use your personal checklist instance here:
👉 **`https://<your-github-username>.github.io/<your-repo-name>/`**

---

## ✨ Features

- **🔒 Client-Side Persistence:** Utilizing browser-level HTML5 `localStorage` keys, your checkbox completions are saved natively. Closing, updating, or completely crashing your browser will not clear your current progression logs.
- **⏰ Live Timezone Syncing:** Integrated standard `America/New_York` (ET) engine tracking clock. The timers match target server intervals regardless of whether your local machine is in Europe, Asia, or California.
- **🔄 Smart Boundary Resets:** The page monitors progression thresholds passively every 30 seconds. If an active reset crossway passes while you are offline or while the webpage is open in a background tab, it handles state wipeout immediately.
- **⏳ Micro-Countdown Clocks:** Displays real-time metrics showing exactly how long you have left to squeeze out activities before a specific tier's items wipe clean.
- **🌌 Cyberpunk Aesthetic:** A responsive dual-column dark dashboard modeled around the game's neon visual elements, completely optimized for desktop monitors, tablets, and mobile devices.

---

## 📊 Reset Intervals & Tasks

The application coordinates four highly specific temporal intervals:

### 1. Daily Priorities (Cyan)
- **Reset Schedule:** Evaluates daily at exactly **5:00 AM ET**.
- **Monitored Tasks:** Café & Fons management, wishing pools, Fortune Shades tree prayer, bond events, fortune readings, gift giving, daily free modules, item farming, and civilian rewards.

### 2. Weekly Priorities (Purple)
- **Reset Schedule:** Evaluates weekly every **Monday morning at 5:00 AM ET**.
- **Monitored Tasks:** Anomaly Pilgrimage weekly bosses, city stamina management, Special Delivery Commissions, Realm of Greed Mammon clear, Ebisu's Auction House bidding, and Battle Pass loops.

### 3. Bi-Weekly Events (Emerald)
- **Reset Schedule:** Rotates on a strict **14-day loop** linked directly to the server baseline milestone anchor (**Monday, June 8, 2026, at 5:00 AM ET**).
- **Monitored Tasks:** Pink Paws Heist event tracking.

### 4. Monthly Shop (Amber)
- **Reset Schedule:** Automatically triggers on the **1st of every calendar month at 5:00 AM ET**.
- **Monitored Tasks:** Hunter Exchange inventory refreshes.

---

## 🛠️ Architecture & Core Code Mechanics

The tool is completely self-contained in a single `index.html` file, avoiding external framework build-steps or server databases like Node.js or Python.

### Core Mathematical Mechanics (How resets work without a backend)

Instead of running a continuous database script, the system uses **Epoch Timestamp Evaluation**. Every time the application mounts, the JavaScript engine calculates exactly *when the most recent reset was supposed to happen* relative to the exact current time in New York:

```javascript
// Sample calculation workflow for checking boundaries
let dReset = new Date(nowET);
dReset.setHours(5, 0, 0, 0); // Target 5:00 AM
if (nowET < dReset) dReset.setDate(dReset.getDate() - 1); // Shift backward if current hour hasn't passed 5 AM
const dailyTarget = dReset.getTime();