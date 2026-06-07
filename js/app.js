import { runBondCalc } from './features/calculator.js';
import { initApp, confirmReset, updateClock, updateTimers, handleSyncKeyChange, pollForResets } from './features/checklist.js';
import { supabase } from './supabaseClient.js';

window.switchTab = function(tab) {
    const checklistView = document.getElementById('checklist-view');
    const calcView = document.getElementById('calculator-view');
    const btnChecklist = document.getElementById('btn-checklist');
    const btnCalculator = document.getElementById('btn-calculator');

    if (tab === 'checklist') {
        checklistView.classList.remove('hidden');
        calcView.classList.add('hidden');
        
        // Update button styles
        btnChecklist.classList.add('bg-cyan-600', 'text-white');
        btnChecklist.classList.remove('bg-slate-700', 'text-slate-300');
        btnCalculator.classList.add('bg-slate-700', 'text-slate-300');
        btnCalculator.classList.remove('bg-cyan-600', 'text-white');
    } else {
        checklistView.classList.add('hidden');
        calcView.classList.remove('hidden');
        
        // Update button styles
        btnCalculator.classList.add('bg-cyan-600', 'text-white');
        btnCalculator.classList.remove('bg-slate-700', 'text-slate-300');
        btnChecklist.classList.add('bg-slate-700', 'text-slate-300');
        btnChecklist.classList.remove('bg-cyan-600', 'text-white');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initApp(supabase);
    updateClock();
    updateTimers();

    setInterval(() => {
        updateClock();
        updateTimers();
        pollForResets(); // Actively checks for resets while the tab is open
    }, 1000);

    const calcBtn = document.getElementById('calc-button');
    if (calcBtn) {
        calcBtn.addEventListener('click', runBondCalc);
    }

    const resetBtn = document.getElementById('reset-button');
    if (resetBtn) {
        resetBtn.addEventListener('click', confirmReset);
    }
});

// 1. Centralized Hash Change Handler (The ONLY one)
window.addEventListener('hashchange', async () => {
    // This is the correct way to re-init when the user clicks a new link
    handleSyncKeyChange(supabase);
});
