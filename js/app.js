import { runBondCalc } from './features/calculator.js';
import { initApp, confirmReset, updateClock, updateTimers, handleSyncKeyChange, pollForResets, toggleCategory, updateBeyondChallenges, updateBeyondFloor, maxOutBeyondChallenges } from './features/checklist.js';
import { renderCharacterCards, filterCharacters, generateCharacterLinks, setElementFilter, autoFillElementBadges, applyRarityStyles } from './logic/guideLogic.js'
import { supabase } from './supabaseClient.js';

/*
 ==========================================
   SWITCHING TABS LOGIC
 ==========================================
*/
window.switchTab = function(activeTabId) {
    // 1. Define all our views and buttons in one place
    const tabs = ['checklist', 'guides', 'calculator'];
    
    tabs.forEach(tab => {
        const viewEl = document.getElementById(`${tab}-view`);
        const btnEl = document.getElementById(`btn-${tab}`);
        
        if (!viewEl || !btnEl) return; // Safety check

        if (tab === activeTabId) {
            // Activate this tab
            viewEl.classList.remove('hidden');
            btnEl.classList.add('bg-cyan-600', 'text-white');
            btnEl.classList.remove('bg-slate-700', 'text-slate-300');
        } else {
            // Deactivate other tabs
            viewEl.classList.add('hidden');
            btnEl.classList.add('bg-slate-700', 'text-slate-300');
            btnEl.classList.remove('bg-cyan-600', 'text-white');
        }
    });
}

/*
 ==========================================
   ON PAGE LOAD SECTION
 ==========================================
*/

document.addEventListener('DOMContentLoaded', () => {
    // Initiate App and connect to db
    initApp(supabase);
    // Daily Checklist
    updateClock();
    updateTimers();
    // Character Guides
    renderCharacterCards();
    generateCharacterLinks();
    autoFillElementBadges();
    applyRarityStyles();
    
    // Character Guides Functions
    // 1. Handle element filter buttons
    const filterContainer = document.getElementById('element-filters');
    if (filterContainer) {
        filterContainer.addEventListener('click', (event) => {
            const btn = event.target.closest('.filter-btn');
            if (!btn) return;

            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove(
                    'active',
                    'bg-cyan-600',
                    'ring-2',
                    'ring-cyan-400'
                );

                b.classList.add('bg-slate-700');
            });

            btn.classList.remove('bg-slate-700');

            btn.classList.add(
                'active',
                'bg-cyan-600',
                'ring-2',
                'ring-cyan-400'
            );

            setElementFilter(btn.dataset.target);
        });
    }

    // Wire up the live search bar
    const searchInput =
        document.getElementById('character-search');

    const clearBtn =
        document.getElementById('clear-search');

    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const value = e.target.value;

            filterCharacters(value);

            clearBtn?.classList.toggle(
                'hidden',
                value.length === 0
            );
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';

            filterCharacters('');

            clearBtn.classList.add('hidden');

            searchInput.focus();
        });
    }

    // Checklist Functions
    setInterval(() => {
        updateClock();
        updateTimers();
        pollForResets(); // Actively checks for resets while the tab is open
    }, 1000);

    const resetBtn = document.getElementById('reset-button');
    if (resetBtn) {
        resetBtn.addEventListener('click', confirmReset);
    }

    // Bond XP Calculator functions
    const calcBtn = document.getElementById('calc-button');
    if (calcBtn) {
        calcBtn.addEventListener('click', runBondCalc);
    }

    // Beyond the Rails Isolated View Control Bindings
    const floorSelect = document.getElementById('rails-floor-select');
    const btnMinus = document.getElementById('btn-rails-minus');
    const btnPlus = document.getElementById('btn-rails-plus');
    const btnPlus3 = document.getElementById('btn-rails-plus3');
    const btnMax = document.getElementById('btn-rails-max');

    if (floorSelect) {
        floorSelect.addEventListener('input', (e) => updateBeyondFloor(e.target.value));
    }
    if (btnMinus) {
        btnMinus.addEventListener('click', () => updateBeyondChallenges(-1));
    }
    if (btnPlus) {
        btnPlus.addEventListener('click', () => updateBeyondChallenges(1));
    }
    if (btnMax) {
        btnMax.addEventListener('click', maxOutBeyondChallenges);
    }
});

// 1. Centralized Hash Change Handler (The ONLY one)
window.addEventListener('hashchange', async () => {
    // This is the correct way to re-init when the user clicks a new link
    handleSyncKeyChange(supabase);
});

// Expose to window for inline HTML onclick attributes
window.toggleCategory = toggleCategory;