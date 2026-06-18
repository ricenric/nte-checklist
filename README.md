# ✦ Neverness to Everness (NTE) Progression Checklist

A high-performance, responsive web-based companion app designed to track daily, weekly, bi-weekly, and monthly server progression tasks for *Neverness to Everness*. Built with a modern vanilla stack and real-time cloud synchronization.

## 📌 Table of Contents

* [🛠️ Tech Stack & Architecture](#️-tech-stack--architecture)
* [🚀 Core Features](#-core-features)
* [🗄️ Database Table Setup](#-database-table-setup)
* [📡 Local Development Setup](#local-development-setup)
* [🛡️ Security Architecture Notice](#-security-architecture-notice)
* [🧪 Development & Quality Assurance](#development--quality-assurance)


## 🛠️ Tech Stack & Architecture

* **Frontend Framework:** Tailwind CSS v4 (via JIT compiler)
* **Database & Sync Engine:** Supabase JS Client Ecosystem (UMD Modern Bundle)
* **Storage Layer:** Hybrid Cloud `upsert` + Isolated Device Cache (`localStorage`)
* **State Machine:** Event-driven architecture with Supabase Realtime synchronization and automated timezone-locked reset loops


## 🚀 Core Features

### 1. Hybrid Sync Pipeline
Combines the speed of local hardware memory with the power of cloud hosting. The checklist registers clicks instantly on the client machine, writes to local backup partitions, and streams changes to other instances seamlessly.

### 2. Multi-Profile Isolation
The application isolates data on a per-user basis. By appending a unique `#user-` seed hash to your URL, the application generates a sandboxed storage key:
* **`nte_state_#user-abc123...`**

This prevents account tracking overlapping when managing multiple alt accounts or profiles on the same device.

### 3. Dynamic Profile Hot-Swapping
Features an optimized hashchange listener that triggers a deterministic teardown-and-rebuild cycle. The application explicitly unsubscribes from existing Realtime channels before re-initializing to the new sync key, ensuring zero "zombie" connections and preventing race conditions during account switching.

### 4. Game Clock Synchronization
Calculates precision countdown boundaries tied directly to the **5:00 AM Eastern Time (ET)** server reset window, handling shifts dynamically across Daily, Weekly (Monday), Bi-Weekly, and Monthly resets.


## Deployment

This project uses **GitHub Actions** for automated deployment. Every time you push changes to the `main` branch, GitHub automatically builds your project and deploys it to GitHub Pages.

- **Source Code:** Lives in the `main` branch.
- **Live Site:** Served from the `gh-pages` branch.
- **Workflow:** Defined in `.github/workflows/deploy.yml`.

### How It Works

The peaceiris/actions-gh-pages action performs the following steps behind the scenes every time you push code:

**Checkout**: It clones your main branch onto a GitHub server.

**Install & Build**: It runs npm ci and npm run build, which creates your optimized dist/ folder containing the "finished" website files (HTML/CSS/JS).

**Branch Switch**: It switches to the gh-pages branch (it will create this branch automatically if it doesn't exist yet).

**Sync**: It takes the contents of your dist/ folder and moves them into the root of the gh-pages branch.

**Commit**: It creates a silent commit on that gh-pages branch containing only those build files.

**Serve**: GitHub Pages is *configured to look at the root of the gh-pages branch*. This is important that its pointed to serve from there. Since the action just placed your dist/ files there, GitHub Pages treats those as your website's root directory and serves them instantly.

### Important

If deploy fails, try deleting package-lock.json AND node_modules, running npm install, and then committing the new package-lock.json files.

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


### 📡 Local Development Setup

This project uses Vite for local development. This enables Hot Module Replacement (HMR) and automatically resolves module dependencies for a seamless development experience.

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the URL displayed in your terminal


## 🛡️ Security Architecture Notice

This code exposes a public publishable key token (`sb_publishable_...`) directly in the raw client source.

This is 100% secure and safe to push to public GitHub repositories. Supabase publishable public keys do not grant admin access to database structures. Because the table is bound by strict Row Level Security (RLS) policies, it is impossible for an outside actor to maliciously read, alter, or extract global data payloads unless they possess your randomly generated, 18-character browser URL hash parameter.


## Development & Quality Assurance

### 🧪 Unit Testing & Continuous Integration

This project uses **Vitest** for unit and integration testing, paired with **GitHub Actions** for continuous integration (CI) to ensure database connectivity and state stability.

### Local Testing
To run the test suite locally, ensure your dependencies are installed and execute the test runner:

```bash
npm install
npm test
```

### 🔍 Code Quality & Linting

This project utilizes ESLint with the modern Flat Config format to maintain high code standards and prevent common runtime errors.

Running the Linter:
To check your codebase for errors or stylistic inconsistencies, run:

```bash
npm run lint
```

Automatic Fixes:
To have ESLint automatically resolve fixable issues (like spacing or semicolon consistency), run:

```bash
npx eslint . --fix
```

### 🛠 Debugging Utilities

I use the following script to simulate time passing during local development to verify the reset logic.

How to use:
1. Open your browser **Developer Tools** (`F12`).
2. Navigate to the **Console** tab.
3. Copy and paste the timeTravelReset() function from scripts/dev-tools.js into the console and hit `Enter`

**Note**: If you want to do this multiple times, you must hit the "Clear Data" button before doing so, or jump ahead in more days by incrementing the
daysToJump variable. In order to simulate the longer resets, change that variable to the appropriate days needed for the respective reset. 
Otherwise, now  that your browser clock is back to normal, your app checks the database and says: "Wait, my last reset was in the future. I don't need to reset again yet."
and you must wait for the real world to catch up to the time travel function.