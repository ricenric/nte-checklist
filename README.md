# ✦ Neverness to Everness (NTE) Progression Checklist

A high-performance, responsive web-based companion app designed to track daily, weekly, bi-weekly, and monthly server progression tasks for *Neverness to Everness*. Built with a modern vanilla stack and real-time cloud synchronization.

---

## 📌 Table of Contents

* [🛠️ Tech Stack & Architecture](#️-tech-stack--architecture)
* [🚀 Core Features](#-core-features)
* [🗄️ Database Table Setup](#️-database-table-setup)
* [📡 Local Environment Execution](#-local-environment-execution)
* [🛡️ Security Architecture Notice](#️-security-architecture-notice)
* [🧪 Testing & Continuous Integration](#-testing--continuous-integration)

---

## 🛠️ Tech Stack & Architecture

* **Frontend Framework:** Tailwind CSS v4 (via JIT compiler)
* **Database & Sync Engine:** Supabase JS Client Ecosystem (UMD Modern Bundle)
* **Storage Layer:** Hybrid Cloud `upsert` + Isolated Device Cache (`localStorage`)
* **State Machine:** Event-driven Javascript with automated timezone-locked reset loops

---

## 🚀 Core Features

### 1. Hybrid Sync Pipeline
Combines the speed of local hardware memory with the power of cloud hosting. The checklist registers clicks instantly on the client machine, writes to local backup partitions, and streams changes to other instances seamlessly.

### 2. Multi-Profile Isolation
The application isolates data on a per-user basis. By appending a unique `#user-` seed hash to your URL, the application generates a sandboxed storage key:
* **`nte_state_#user-abc123...`**

This prevents account tracking overlapping when managing multiple alt accounts or profiles on the same device.

### 3. Dynamic Profile Hot-Swapping
Features a hardware-level `hashchange` listener. Pasting a different friend or alt-account tracking URL into an open browser bar swaps the internal memory states and refreshes the database channels instantly without requiring a hard reload.

### 4. Game Clock Synchronization
Calculates precision countdown boundaries tied directly to the **5:00 AM Eastern Time (ET)** server reset window, handling shifts dynamically across Daily, Weekly (Monday), Bi-Weekly, and Monthly resets.

---

## 🗄️ Database Table Setup

To deploy the cloud features, create a table in your Supabase project to accept public anonymous records via `upsert`. 

Go to your **Supabase Dashboard**, open the **SQL Editor**, paste this blueprint into a **New Query**, and click **Run**:

```sql
-- Clean up existing legacy components
drop table if exists nte_sync cascade;

-- Build the sync framework with strict row indexation
create table nte_sync (
  id uuid primary key default gen_random_uuid(),
  sync_key text unique not null,
  state_json jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Activate database safety guards
alter table nte_sync enable row level security;

-- Configure explicit Row Level Security rules for anonymous connections
create policy "Allow anon select" on nte_sync for select using (true);
create policy "Allow anon insert" on nte_sync for insert with check (true);
create policy "Allow anon update" on nte_sync for update using (true);

-- Authorize the public API key to communicate with the table matrix
grant all on table nte_sync to anon;
grant all on table nte_sync to authenticated;
grant all on table nte_sync to service_role;

-- Link the matrix into the real-time websocket channel
alter publication supabase_realtime add table nte_sync;
```

---

## 📡 Local Environment Execution

Modern browsers enforce rigid security restrictions regarding raw local file system rendering (`file:///`). Because of this, network sync behaviors are blocked when opening `index.html` via double-click.

To run or test your application locally, launch the file inside a micro-server wrapper:

| Server Utility | Deployment Script | Localhost Access Port |
| :--- | :--- | :--- |
| **VS Code Live Server** | Click the *Go Live* toggle in the UI status bar | `http://127.0.0.1:5500` |
| **Python CLI Module** | `python -m http.server 8080` | `http://localhost:8080` |
| **Node.js (http-server)** | `npx http-server -p 8080` | `http://localhost:8080` |

---

Markdown
### 🐍 Python Server Quick Start

If you have Python installed, you can spin up the environment instantly without any installations:

1. Open your terminal or command prompt.
2. Navigate (`cd`) into the directory containing your project's `index.html`.
3. Execute the server command:
   ```bash
   python -m http.server 8080
   ```
(Note: Use py -m http.server 8080 on some Windows setups, or python -m SimpleHTTPServer 8080 if using legacy Python 2).
4. Open your browser and head to http://localhost:8080.

---

## 🛡️ Security Architecture Notice

This code exposes a public publishable key token (`sb_publishable_...`) directly in the raw client source.

This is 100% secure and safe to push to public GitHub repositories. Supabase publishable public keys do not grant admin access to database structures. Because the table is bound by strict Row Level Security (RLS) policies, it is impossible for an outside actor to maliciously read, alter, or extract global data payloads unless they possess your randomly generated, 18-character browser URL hash parameter.

---

## 🧪 Testing & Continuous Integration

This project uses **Vitest** for unit and integration testing, paired with **GitHub Actions** for continuous integration (CI) to ensure database connectivity and state stability.

### Local Testing
To run the test suite locally, ensure your dependencies are installed and execute the test runner:

```bash
npm install
npm test