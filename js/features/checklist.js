import { checkAndResetState, getTimerStrings } from '../logic/checklistLogic.js';
import { supabase } from '../supabaseClient.js';

export const defaultDailies = [
    { name: "Manage Cafe & Collect Fons", subtext: "Update Cafe with new trending items" },
    { name: "Make a Wish at Nacupeda's Pool" },
    { name: "Pray at the Fortune Shades Tree", subtext: "It's all random!"},
    { name: "Bond Event (Movies, Ferris Wheel)", subtext: "Once per day? Or per character?" },
    { name: "Witch's House Daily Fortune Readings" },
    { name: "Give Gifts to Characters (Max 10)" },
    { name: "Get Daily Free Apartment Materials", subtext: "Module, Beetle Coins, Fluffy Cotton" },
    { name: "Farm Materials", subtext: "Anomaly Furniture, Monster Upgrade Materials" },
    { name: "Beat Up Civilians for Items", subtext: "Lost Wallet, Briefcases, Lunch Bags" }
];
export const defaultWeeklies = [
    { name: "Defeat 3 Weekly Bosses", subtext: "Anomaly Pilgrimage" },
    { name: "Burn All City Stamina" },
    { name: "Steal DSD Toys", subtext: "Bridge Crossings (West + East), Miguel District (West), New Herland District" },
    { name: "Clear Special Delivery Commission (Old Mailbox)" },
    { name: "Enter Realm of Greed & defeat Mammon Boss", subtext: "Participate in auction first to upgrade" },
    { name: "Visit Ebisu's Auction House", subtext: "Prioritize Covetous Coins for Mammon Upgrade" },
    { name: "Complete Weekly Battle Pass Missions", subtext: "Daily play usually means overcapping on Battle Pass" }
];
export const defaultBiweeklies = [
    { name: "Pink Paws Heist", subtext: "Cap 1 million Fons" }
];
export const defaultMonthlies = [
    { name: "Hunter Exchange", subtext: "Prioritize Annulith items - Lost Keys and Dice" },
    { name: "Lost Exchange (Roll Pieces)", subtext: "350 + 350 + 1400 = 2100 Lost Pieces" }
];

export const defaultBeyondtheRails = { currentFloor: 1, challenges: 0 };

export let state = {
    dailies: {}, weeklies: {}, biweeklies: {}, monthlies: {}, beyond: {},
    lastCheckedDaily: 0, lastCheckedWeekly: 0, lastCheckedBiweekly: 0, lastCheckedMonthly: 0, lastCheckedBeyond: 0,
    ui: { daily: false, weekly: false, biweekly: false, monthly: false, beyond: false } // Added UI state (false = expanded)
};

export function updateProgressBar(category, defaultList, prefix) {
    const total = defaultList.length;
    // Fix: Use state[category] ?? {} to ensure we always have an object to filter
    const completed = defaultList.filter(t => (state[category] ?? {})[t.name]).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const bar = document.getElementById(`${prefix}-progress-bar`);
    const text = document.getElementById(`${prefix}-progress-text`);
    if (bar && text) {
        bar.style.width = `${percentage}%`;
        text.innerText = `${percentage}% (${completed}/${total})`;
    }
}

export async function pushStateToCloud() {
    const localStorageKey = 'nte_state_' + syncKey;
    localStorage.setItem(localStorageKey, JSON.stringify(state));
    if (!supabase) return;
    try {
        await supabase.from('nte_sync').upsert(
            { sync_key: syncKey, state_json: state, updated_at: new Date().toISOString() },
            { onConflict: 'sync_key' }
        );
    } catch(e) { console.debug("Cloud push error:", e); }
}

export function renderLists() {
    const containers = {
        'daily-list': { category: 'dailies', list: defaultDailies, color: 'checked:bg-cyan-500' },
        'weekly-list': { category: 'weeklies', list: defaultWeeklies, color: 'checked:bg-purple-500' },
        'biweekly-list': { category: 'biweeklies', list: defaultBiweeklies, color: 'checked:bg-emerald-500' },
        'monthly-list': { category: 'monthlies', list: defaultMonthlies, color: 'checked:bg-amber-500' }
    };

    Object.keys(containers).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        
        el.innerHTML = '';
        const { category, list, color } = containers[id];
        
        list.forEach((t, i) => {
            // Use Optional Chaining (?.) and Defaulting (?? false)
            const isChecked = state[category]?.[t.name] ?? false;
            el.appendChild(createTaskRow(category, t, isChecked, `${id}-${i}`, color));
        });
    });
    
    updateProgressBar('dailies', defaultDailies, 'daily');
    updateProgressBar('weeklies', defaultWeeklies, 'weekly');
    updateProgressBar('biweeklies', defaultBiweeklies, 'biweekly');
    updateProgressBar('monthlies', defaultMonthlies, 'monthly');
    renderBeyond();

    // Restoration: Re-apply the opening/closing animations based on current UI state
    applyUIStates()
}

export function toggleTask(category, taskName, checked) {    
    // Ensure the category exists in state
    if (!state[category]) {
        state[category] = {};
    }

    state[category][taskName] = checked; 
    renderLists(); 
    pushStateToCloud(); 
}

export function confirmReset() {
    if (confirm("Are you sure you want to clear this profile's task memory? This resets local and cloud parameters immediately.")) {
        const localStorageKey = 'nte_state_' + syncKey;
        localStorage.removeItem(localStorageKey);
        state = {
            dailies: {}, weeklies: {}, biweeklies: {}, monthlies: {}, beyond: {},
            lastCheckedDaily: 0, lastCheckedWeekly: 0, lastCheckedBiweekly: 0, lastCheckedMonthly: 0, lastCheckedBeyond: 0,
            ui: { daily: false, weekly: false, biweekly: false, monthly: false, beyond: false } // Added UI state (false = expanded)
        };
        pushStateToCloud();
        initApp();
    }
}

export function createTaskRow(category, task, isChecked, id, colorClass) {
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

export function updateBeyondChallenges(changeAmount) {
    if (!state.beyond || typeof state.beyond !== 'object') {
        state.beyond = { ...defaultBeyondtheRails };
    }
    
    let newChallenges = (state.beyond.challenges || 0) + changeAmount;
    if (newChallenges < 0) newChallenges = 0;
    if (newChallenges > 36) newChallenges = 36;

    state.beyond.challenges = newChallenges;
    renderBeyond();
    pushStateToCloud();
}

export function updateBeyondFloor(floorValue) {
    if (!state.beyond || typeof state.beyond !== 'object') {
        state.beyond = { ...defaultBeyondtheRails };
    }

    state.beyond.currentFloor = parseInt(floorValue, 10) || 1;
    renderBeyond();
    pushStateToCloud();
}

export function renderBeyond() {
    if (!state.beyond || typeof state.beyond !== 'object') {
        state.beyond = { ...defaultBeyondtheRails };
    }

    const challenges = typeof state.beyond.challenges === 'number' ? state.beyond.challenges : 0;
    const currentFloor = typeof state.beyond.currentFloor === 'number' ? state.beyond.currentFloor : 1;
    const percentage = Math.round((challenges / 36) * 100);

    // Update overall category tracking progress bar
    const bar = document.getElementById('beyond-progress-bar');
    const text = document.getElementById('beyond-progress-text');
    if (bar && text) {
        bar.style.width = `${percentage}%`;
        text.innerText = `${percentage}% (${challenges}/36)`;
    }

    // Synchronize select dropdown position with the state
    const floorSelect = document.getElementById('rails-floor-select');
    if (floorSelect) {
        floorSelect.value = currentFloor;
    }

    // Update text node challenge value
    const challengesText = document.getElementById('rails-challenges-text');
    if (challengesText) {
        if (challenges >= 36) {
            challengesText.innerText = `All Challenges Cleared! (36/36)`;
            challengesText.className = 'text-xs text-rose-400 font-medium whitespace-nowrap';
        } else {
            challengesText.innerText = `${challenges}/36 Challenges Completed`;
            challengesText.className = 'text-xs text-slate-400 font-medium whitespace-nowrap';
        }
    }
}

let syncKey = "";
// 1. Declare a variable to hold the channel at the top level
export let activeChannel = null;

export async function initApp(supabaseClient) {
    console.debug("initApp called. Active channel exists:", !!activeChannel, "Stack trace:", new Error().stack);
    
    // 1. Determine Sync Key
    const newSyncKey = window.location.hash || "#user-" + Math.random().toString(36).substring(2, 11) + Math.random().toString(36).substring(2, 11);
    
    if (!supabaseClient) {
        console.debug("DEBUG: initApp called, but supabaseClient is UNDEFINED!");
    }

    if (window.location.hash !== newSyncKey) {
        window.location.hash = newSyncKey;
    }

    const channelName = `checklist-${newSyncKey.replace('#', '')}`;

    // 2. AGGRESSIVE TEARDOWN: Clear old channels from Supabase memory
    if (supabaseClient) {
        try {
            // First, if we tracked an active channel object, remove it
            if (activeChannel) {
                await supabaseClient.removeChannel(activeChannel);
                activeChannel = null;
            }
            
            // Second, check Supabase's internal array for any cached channel matching this name
            // This prevents rapid double-hash changes from finding a lingering channel instance
            const existingChannel = supabaseClient.channels.find(ch => ch.topic === `realtime:${channelName}` || ch.name === channelName);
            if (existingChannel) {
                console.debug(`Found lingering cached channel [${channelName}], forcing removal...`);
                await supabaseClient.removeChannel(existingChannel);
            }
        } catch (e) {
            console.debug("Error tearing down channel cache:", e);
        }
    } else if (activeChannel) {
        // Fallback if client isn't passed
        await activeChannel.unsubscribe();
        activeChannel = null;
    }

    syncKey = newSyncKey;
    const localStorageKey = 'nte_state_' + syncKey;
    const savedState = localStorage.getItem(localStorageKey);

    // 3. Initialize state from local cache
    state = savedState ? JSON.parse(savedState) : {
        dailies: {}, weeklies: {}, biweeklies: {}, monthlies: {}, beyond: {},
        lastCheckedDaily: 0, lastCheckedWeekly: 0, lastCheckedBiweekly: 0, lastCheckedMonthly: 0, lastCheckedBeyond: 0
    };

    // 4. Realtime Setup
    if (supabaseClient) {
        console.debug(`Attempting cloud sync for channel: ${channelName}`);
        // This is guaranteed to be a completely fresh channel instance now
        const channel = supabaseClient.channel(channelName);

        // MUST register listener BEFORE subscribing
        channel.on(
            'postgres_changes', 
            { event: '*', schema: 'public', table: 'nte_sync', filter: `sync_key=eq.${syncKey}` }, 
            (payload) => {
                if (payload.new?.state_json) {
                    const cloudCheck = checkAndResetState(payload.new.state_json, { 
                        defaultDailies, defaultWeeklies, defaultBiweeklies, defaultMonthlies, defaultBeyondtheRails 
                    });

                    state = cloudCheck.state;
                    localStorage.setItem(localStorageKey, JSON.stringify(state));
                    renderLists();
                    
                    if (cloudCheck.resetTriggered) {
                        pushStateToCloud();
                    }
                }
            }
        );

        // Subscribe now
        channel.subscribe(async (status) => {
            console.debug("Channel subscription status:", status);
            if (status === 'SUBSCRIBED') {
                activeChannel = channel;

                const statusDiv = document.getElementById('sync-status');
                if (statusDiv) {
                    statusDiv.innerHTML = `
                            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span> 
                            <span class="truncate max-w-[140px] sm:max-w-[200px]" title="Cloud-Synced (${syncKey})">Cloud-Synced (${syncKey})</span>
                        `;
                    statusDiv.className = "text-xs font-mono px-2 py-1 rounded border bg-slate-800 border-slate-700 text-emerald-400 flex items-center gap-1.5 min-w-0";                
                }
                
                const { data, error } = await supabaseClient.from('nte_sync')
                    .select('state_json')
                    .eq('sync_key', syncKey)
                    .maybeSingle();

                if (error) {
                    console.debug("Fetch error:", error);
                }

                if (data?.state_json) {
                    const cloudCheck = checkAndResetState(data.state_json, { 
                        defaultDailies, defaultWeeklies, defaultBiweeklies, defaultMonthlies, defaultBeyondtheRails 
                    });

                    state = cloudCheck.state;
                    localStorage.setItem(localStorageKey, JSON.stringify(state));
                    renderLists();

                    if (cloudCheck.resetTriggered) {
                        pushStateToCloud();
                    }
                } else {
                    console.debug("No data found for sync_key:", syncKey);
                }
            }
        });
    }

    // 5. Finalize state structure and UI
    const result = checkAndResetState(state, { 
        defaultDailies, defaultWeeklies, defaultBiweeklies, defaultMonthlies, defaultBeyondtheRails 
    });
    state = result.state;

    ['dailies', 'weeklies', 'biweeklies', 'monthlies', 'beyond'].forEach(cat => {
        if (!state[cat] || typeof state[cat] !== 'object') state[cat] = {};
    });

    localStorage.setItem(localStorageKey, JSON.stringify(state));
    renderLists();
}

// Create a specialized function for hash changes
export async function handleSyncKeyChange(supabaseClient) {
    const newKey = window.location.hash;
    if (newKey === syncKey) return; // Do nothing if hash hasn't actually changed
    
    // Now call a simplified re-init
    await initApp(supabaseClient);
}

export function updateClock() {
    const clockEl = document.getElementById('et-clock');
    if (clockEl) {
        clockEl.innerText = "✦ " + new Date().toLocaleString("en-US", { 
            timeZone: "America/New_York", month: "short", day: "numeric", 
            year: "numeric", hour: "2-digit", minute: "2-digit", 
            second: "2-digit", hour12: true 
        }) + " ET";
    }
}

export function updateTimers() {
    const timers = getTimerStrings();
    
    // Update the DOM elements
    document.getElementById('daily-timer').innerText = timers.daily;
    document.getElementById('weekly-timer').innerText = timers.weekly;
    document.getElementById('biweekly-timer').innerText = timers.biweekly;
    document.getElementById('monthly-timer').innerText = timers.monthly;
    document.getElementById('beyond-timer').innerText = timers.beyond;
}

export function pollForResets() {
    const check = checkAndResetState(state, { 
        defaultDailies, defaultWeeklies, defaultBiweeklies, defaultMonthlies, defaultBeyondtheRails 
    });
    
    if (check.resetTriggered) {
        state = check.state;
        localStorage.setItem('nte_state_' + syncKey, JSON.stringify(state));
        renderLists();
        pushStateToCloud();
    }
}

export function toggleCategory(category) {
    // Ensure older accounts get the UI property seamlessly
    if (!state.ui) state.ui = { daily: false, weekly: false, biweekly: false, monthly: false, beyond: false };
    
    // Flip the boolean for the specific category
    state.ui[category] = !state.ui[category];
    
    applyUIStates();
    pushStateToCloud(); // Instantly saves your layout preference to your hash
}

export function applyUIStates() {
    const categories = ['daily', 'weekly', 'biweekly', 'monthly', 'beyond'];
    
    categories.forEach(cat => {
        const isCollapsed = state.ui?.[cat];
        const contentEl = document.getElementById(`content-${cat}`);
        const arrowEl = document.getElementById(`arrow-${cat}`);
        
        if (contentEl && arrowEl) {
            if (isCollapsed) {
                // Collapse: Set grid row to 0
                contentEl.classList.remove('grid-rows-[1fr]');
                contentEl.classList.add('grid-rows-[0fr]');
                arrowEl.classList.add('rotate-180');
            } else {
                // Expand: Set grid row to 1 fraction
                contentEl.classList.remove('grid-rows-[0fr]');
                contentEl.classList.add('grid-rows-[1fr]');
                arrowEl.classList.remove('rotate-180');
            }
        }
    });
}