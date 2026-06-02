// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = "https://zpdvqtmxvkzkycvoqvyp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_9jyt1HHwYZcvW-nOXl2iMw_LAUSe50Q";
let supabase = null;

if (SUPABASE_URL && SUPABASE_URL !== "YOUR_SUPABASE_PROJECT_URL" && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const defaultDailies = [
    { name: "Manage Cafe & Collect Fons", subtext: "Update Cafe with new trending items" },
    { name: "Make a Wish at Nacupeda's Pool" },
    { name: "Pray at the Fortune Shades Tree" },
    { name: "Bond Event (Movies, Ferris Wheel)", subtext: "Once per day?" },
    { name: "Witch's House Daily Fortune Readings" },
    { name: "Give Gifts to Characters (Max 10)" },
    { name: "Get Daily Free Module" },
    { name: "Farm Anomaly Furniture Materials", subtext: "Vending Machine, Cursed Sword, Teddy Bear" },
    { name: "Farm Fons with Chiz" },
    { name: "Beat Up Civilians for Items", subtext: "Lost Wallet, Briefcases, Lunch Bags" }
];
const defaultWeeklies = [
    { name: "Defeat 3 Weekly Bosses (Anomaly Pilgrimage)" },
    { name: "Burn all City Stamina" },
    { name: "Steal DSD Toys", subtext: "Bridge Crossings (West + East), Miguel District (West), New Herland District" },
    { name: "Clear Special Delivery Commission (Old Mailbox)" },
    { name: "Enter Realm of Greed & defeat Mammon Boss", subtext: "Auction first to upgrade" },
    { name: "Visit Ebisu's Auction House", subtext: "Prioritize Covetous Coins for Mammon Upgrade" },
    { name: "Complete Weekly Battle Pass Missions", subtext: "Daily play usually means overcapping on Battle Pass" }
];
const defaultBiweeklies = [
    { name: "Pink Paws Heist", subtext: "Cap 1 million Fons" }
];
const defaultMonthlies = [
    { name: "Hunter Exchange" },
    { name: "Lost Exchange (Roll Pieces)", subtext: "350 + 350 + 1400 = 2100 Lost Pieces" }
];

let state = {
    dailies: {}, weeklies: {}, biweeklies: {}, monthlies: {},
    lastCheckedDaily: 0, lastCheckedWeekly: 0, lastCheckedBiweekly: 0, lastCheckedMonthly: 0
};

let syncKey = "";
const BIWEEKLY_ANCHOR = new Date("2026-06-08T05:00:00-04:00").getTime();

export function getTargetResets() {
    // 1. Grab the exact absolute universal time right now
    const now = new Date();
    const currentMs = now.getTime();

    // 2. Calculate today's 5:00 AM ET Server Reset in absolute UTC.
    // Since 5:00 AM ET is exactly 9:00 AM UTC (Standard Time), we anchor here.
    const todayResetUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 9, 0, 0, 0);
    
    let dailyTarget = todayResetUTC;
    // If the absolute current time hasn't reached 9:00 AM UTC yet, the reset boundary was yesterday
    if (currentMs < todayResetUTC) {
        dailyTarget -= 24 * 60 * 60 * 1000; // Subtract 1 full day in milliseconds
    }

    // 3. Weekly Reset Math (Monday at 5:00 AM ET / 9:00 AM UTC)
    let wReset = new Date(dailyTarget);
    // getUTCDay() yields: 0 = Sunday, 1 = Monday, etc.
    const daysSinceMonday = (wReset.getUTCDay() === 0) ? 6 : wReset.getUTCDay() - 1;
    const weeklyTarget = dailyTarget - (daysSinceMonday * 24 * 60 * 60 * 1000);

    // 4. Bi-Weekly Reset Math (Anchored to your fixed absolute Unix timestamp)
    let biweeklyTarget = BIWEEKLY_ANCHOR;
    const msPerTwoWeeks = 14 * 24 * 60 * 60 * 1000;
    if (currentMs >= BIWEEKLY_ANCHOR) {
        biweeklyTarget = BIWEEKLY_ANCHOR + (Math.floor((currentMs - BIWEEKLY_ANCHOR) / msPerTwoWeeks) * msPerTwoWeeks);
    } else {
        biweeklyTarget = BIWEEKLY_ANCHOR - msPerTwoWeeks;
    }

    // 5. Monthly Reset Math (1st of the month at 5:00 AM ET / 9:00 AM UTC)
    const monthlyTarget = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 9, 0, 0, 0);
    let finalizedMonthly = monthlyTarget;
    if (currentMs < monthlyTarget) {
        // If we haven't hit the 1st of this month yet, target the 1st of the previous month
        finalizedMonthly = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 9, 0, 0, 0);
    }

    return { 
        dailyTarget, 
        weeklyTarget, 
        biweeklyTarget, 
        monthlyTarget: finalizedMonthly, 
        nowET: now // Renamed logically internally, but preserves structure compatibility
    };
}

// 💡 REFACTOR/EXPORT INDEPENDENT LOGIC FOR EASIER TESTING
export function checkAndResetState(currentHash, customState = null) {
    const activeState = customState || state;
    const { dailyTarget, weeklyTarget, biweeklyTarget, monthlyTarget } = getTargetResets();
    let resetTriggered = false;

    if (!activeState.lastCheckedDaily || activeState.lastCheckedDaily < dailyTarget) { 
        defaultDailies.forEach(t => activeState.dailies[t.name] = false); 
        activeState.lastCheckedDaily = dailyTarget; 
        resetTriggered = true;
    }
    if (!activeState.lastCheckedWeekly || activeState.lastCheckedWeekly < weeklyTarget) { 
        defaultWeeklies.forEach(t => activeState.weeklies[t.name] = false); 
        activeState.lastCheckedWeekly = weeklyTarget; 
    }
    if (!activeState.lastCheckedBiweekly || activeState.lastCheckedBiweekly < biweeklyTarget) { 
        defaultBiweeklies.forEach(t => activeState.biweeklies[t.name] = false); 
        activeState.lastCheckedBiweekly = biweeklyTarget; 
    }
    if (!activeState.lastCheckedMonthly || activeState.lastCheckedMonthly < monthlyTarget) { 
        defaultMonthlies.forEach(t => activeState.monthlies[t.name] = false); 
        activeState.lastCheckedMonthly = monthlyTarget; 
    }
    return { resetTriggered, tasks: activeState.dailies };
}

function formatCountdown(ms) {
    if (ms < 0) return "Resetting...";
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
    return d > 0 ? `${d}d ${h % 24}h left` : `${h % 24}h ${m % 60}m ${s % 60}s left`;
}

function updateTimers() {
    const { dailyTarget, weeklyTarget, biweeklyTarget, monthlyTarget, nowET } = getTargetResets();
    const currentMs = nowET.getTime();
    document.getElementById('daily-timer').innerText = formatCountdown((dailyTarget + 86400000) - currentMs);
    document.getElementById('weekly-timer').innerText = formatCountdown((weeklyTarget + 604800000) - currentMs);
    document.getElementById('biweekly-timer').innerText = formatCountdown((biweeklyTarget + 1209600000) - currentMs);
    let nm = new Date(monthlyTarget); nm.setMonth(nm.getMonth() + 1);
    document.getElementById('monthly-timer').innerText = formatCountdown(nm.getTime() - currentMs);
}

function updateClock() {
    if (document.getElementById('et-clock')) {
        document.getElementById('et-clock').innerText = "✦ " + new Date().toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) + " ET";
        updateTimers();
    }
}

// 💡 ADD EXPORT HERE TOO
export async function initApp() {
    if (!window.location.hash || window.location.hash.length < 5) {
        const newKey = "#user-" + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
        window.location.hash = newKey;
    }
    syncKey = window.location.hash;

    const localStorageKey = 'nte_state_' + syncKey;
    const savedState = localStorage.getItem(localStorageKey);
    
    if (savedState) {
        state = JSON.parse(savedState);
        ['dailies', 'weeklies', 'biweeklies', 'monthlies'].forEach(cat => {
            if (state[cat] && typeof state[cat] === 'object' && !Array.isArray(state[cat])) {
                for (let key in state[cat]) {
                    if (typeof state[cat][key] === 'object' && state[cat][key] !== null) {
                        state[cat][key] = state[cat][key].checked || false;
                    }
                }
            } else {
                state[cat] = {};
            }
        });
    } else {
        state = {
            dailies: {}, weeklies: {}, biweeklies: {}, monthlies: {},
            lastCheckedDaily: 0, lastCheckedWeekly: 0, lastCheckedBiweekly: 0, lastCheckedMonthly: 0
        };
    }

    if (supabase) {
        const statusDiv = document.getElementById('sync-status');
        if (statusDiv) {
            statusDiv.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Cloud-Synced (${syncKey})`;
            statusDiv.className = "text-xs font-mono px-2 py-1 rounded border bg-slate-800 border-slate-700 text-emerald-400 flex items-center gap-1.5";
        }
        
        try {
            let { data, error } = await supabase.from('nte_sync').select('state_json').eq('sync_key', syncKey).maybeSingle();
            if (data && data.state_json) {
                state = data.state_json;
                if (!state.dailies) state.dailies = {};
                if (!state.weeklies) state.weeklies = {};
                if (!state.biweeklies) state.biweeklies = {};
                if (!state.monthlies) state.monthlies = {};
                localStorage.setItem(localStorageKey, JSON.stringify(state));
            }
        } catch(e) { 
            console.error("Initial load error:", e); 
        }
        
        supabase.channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nte_sync', filter: `sync_key=eq.${syncKey}` }, (payload) => {
            if (payload.new && payload.new.state_json) {
                state = payload.new.state_json;
                if (!state.dailies) state.dailies = {};
                if (!state.weeklies) state.weeklies = {};
                if (!state.biweeklies) state.biweeklies = {};
                if (!state.monthlies) state.monthlies = {};
                localStorage.setItem(localStorageKey, JSON.stringify(state));
                renderLists();
            }
        }).subscribe();
    }

    // Call internal calculation logic
    checkAndResetState(syncKey);

    if (!state.biweeklies) state.biweeklies = {}; if (!state.monthlies) state.monthlies = {};
    defaultDailies.forEach(t => { if (state.dailies[t.name] === undefined) state.dailies[t.name] = false; });
    defaultWeeklies.forEach(t => { if (state.weeklies[t.name] === undefined) state.weeklies[t.name] = false; });
    defaultBiweeklies.forEach(t => { if (state.biweeklies[t.name] === undefined) state.biweeklies[t.name] = false; });
    defaultMonthlies.forEach(t => { if (state.monthlies[t.name] === undefined) state.monthlies[t.name] = false; });

    localStorage.setItem(localStorageKey, JSON.stringify(state));
    renderLists();
}

async function pushStateToCloud() {
    const localStorageKey = 'nte_state_' + syncKey;
    localStorage.setItem(localStorageKey, JSON.stringify(state));
    if (!supabase) return;
    try {
        await supabase.from('nte_sync').upsert(
            { sync_key: syncKey, state_json: state, updated_at: new Date().toISOString() },
            { onConflict: 'sync_key' }
        );
    } catch(e) { console.error("Cloud push error:", e); }
}

function toggleTask(category, taskName, checked) { 
    state[category][taskName] = checked; 
    renderLists(); 
    pushStateToCloud(); 
}

function updateProgressBar(category, defaultList, prefix) {
    const total = defaultList.length;
    const completed = defaultList.filter(t => state[category][t.name]).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    if (document.getElementById(`${prefix}-progress-bar`)) {
        document.getElementById(`${prefix}-progress-bar`).style.width = `${percentage}%`;
        document.getElementById(`${prefix}-progress-text`).innerText = `${percentage}% (${completed}/${total})`;
    }
}

function renderLists() {
    const d = document.getElementById('daily-list'), w = document.getElementById('weekly-list'), b = document.getElementById('biweekly-list'), m = document.getElementById('monthly-list');
    if (!d || !w || !b || !m) return; // Escape check for headless test environment
    
    d.innerHTML = ''; w.innerHTML = ''; b.innerHTML = ''; m.innerHTML = '';
    
    defaultDailies.forEach((t, i) => d.appendChild(createTaskRow('dailies', t, state.dailies[t.name], `d-${i}`, 'checked:bg-cyan-500 checked:border-cyan-500')));
    defaultWeeklies.forEach((t, i) => w.appendChild(createTaskRow('weeklies', t, state.weeklies[t.name], `w-${i}`, 'checked:bg-purple-500 checked:border-purple-500')));
    defaultBiweeklies.forEach((t, i) => b.appendChild(createTaskRow('biweeklies', t, state.biweeklies[t.name], `b-${i}`, 'checked:bg-emerald-500 checked:border-emerald-500')));
    defaultMonthlies.forEach((t, i) => m.appendChild(createTaskRow('monthlies', t, state.monthlies[t.name], `m-${i}`, 'checked:bg-amber-500 checked:border-amber-500')));

    updateProgressBar('dailies', defaultDailies, 'daily');
    updateProgressBar('weeklies', defaultWeeklies, 'weekly');
    updateProgressBar('biweeklies', defaultBiweeklies, 'biweekly');
    updateProgressBar('monthlies', defaultMonthlies, 'monthly');
}

function createTaskRow(category, task, isChecked, id, colorClass) {
    const div = document.createElement('div');
    div.className = "task-row flex items-center py-3 justify-between hover:bg-slate-800/40 px-2 rounded-lg transition-colors group";
    
    div.innerHTML = `
        <label class="flex items-start space-x-3 w-full cursor-pointer select-none">
            <input type="checkbox" id="${id}" ${isChecked ? 'checked' : ''} class="checkbox-custom mt-0.5 h-5 w-5 rounded border-slate-700 bg-slate-900/50 text-slate-900 focus:ring-0 focus:ring-offset-0 transition-all appearance-none border checked:after:content-['✓'] checked:after:flex checked:after:justify-center checked:after:text-xs checked:after:font-bold checked:after:text-slate-900 ${colorClass}">
            <span class="flex flex-col transition-all duration-200">
                <span class="text-slate-200 text-sm font-medium group-hover:text-white transition-colors">${task.name}</span>
                ${task.subtext ? `<span class="text-xs text-slate-400 mt-0.5">${task.subtext}</span>` : ''}
            </span>
        </label>
    `;
    
    div.querySelector('input').addEventListener('change', (e) => toggleTask(category, task.name, e.target.checked));
    return div;
}

export function confirmReset() {
    if (confirm("Are you sure you want to clear this profile's task memory? This resets local and cloud parameters immediately.")) {
        const localStorageKey = 'nte_state_' + syncKey;
        localStorage.removeItem(localStorageKey);
        state = {
            dailies: {}, weeklies: {}, biweeklies: {}, monthlies: {},
            lastCheckedDaily: 0, lastCheckedWeekly: 0, lastCheckedBiweekly: 0, lastCheckedMonthly: 0
        };
        pushStateToCloud();
        initApp();
    }
}

// Global execution runtime hooks - Safe Guarded for Testing Environment
if (typeof window !== 'undefined' && typeof document !== 'undefined' && document.getElementById) {
    // Only initialize UI loops if we are genuinely running in a live browser tab
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initApp(); updateClock();
            setInterval(updateClock, 1000); setInterval(initApp, 30000);
        });
    } else {
        initApp(); updateClock();
        setInterval(updateClock, 1000); setInterval(initApp, 30000);
    }
    
    window.addEventListener('hashchange', () => { initApp(); });
}