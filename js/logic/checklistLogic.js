import { PATCH_RESET_ANCHOR } from '../data/checklistData.js';

export const BIWEEKLY_ANCHOR = new Date("2026-06-08T05:00:00-04:00").getTime();
// Update anchor: June 17, 2026, 6:00 PM ET is 22:00:00 UTC
export const BEYOND_ANCHOR = Date.UTC(2026, 5, 17, 22, 0, 0);

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

    // 4. Bi-Weekly Reset Math
    const msPerTwoWeeks = 14 * 24 * 60 * 60 * 1000;
    const biweeklyTarget = (currentMs >= BIWEEKLY_ANCHOR) 
        ? BIWEEKLY_ANCHOR + (Math.floor((currentMs - BIWEEKLY_ANCHOR) / msPerTwoWeeks) * msPerTwoWeeks)
        : BIWEEKLY_ANCHOR - msPerTwoWeeks;

    // 5. Monthly Reset Math (1st of the month at 5:00 AM ET / 9:00 AM UTC)
    const monthlyTarget = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 9, 0, 0, 0);
    let finalizedMonthly = monthlyTarget;
    if (currentMs < monthlyTarget) {
        // If we haven't hit the 1st of this month yet, target the 1st of the previous month
        finalizedMonthly = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 9, 0, 0, 0);
    }

    // New Beyond The Rails Logic (14 day cycle)
    const beyondTarget = BEYOND_ANCHOR + (Math.floor((currentMs - BEYOND_ANCHOR) / msPerTwoWeeks) * msPerTwoWeeks);

    return { 
        dailyTarget, 
        weeklyTarget, 
        biweeklyTarget, 
        monthlyTarget: finalizedMonthly, 
        beyondTarget,
        patchTarget: PATCH_RESET_ANCHOR,
        nowET: now // Renamed logically internally, but preserves structure compatibility
    };
}

// 💡 REFACTOR/EXPORT INDEPENDENT LOGIC FOR EASIER TESTING
export function checkAndResetState(activeState, config) {
    const { defaultDailies, defaultWeeklies, defaultBiweeklies, defaultMonthlies, defaultBeyondtheRails, defaultPatch } = config;
    const { dailyTarget, weeklyTarget, biweeklyTarget, monthlyTarget, beyondTarget, patchTarget } = getTargetResets();
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
    if (!activeState.lastCheckedBeyond || activeState.lastCheckedBeyond < beyondTarget) { 
        const isFirstTime = !activeState.lastCheckedBeyond; // Track if this is brand new
        
        activeState.beyond = { ...defaultBeyondtheRails }; 
        activeState.lastCheckedBeyond = beyondTarget; 
        
        // Only trigger a UI refresh (resetTriggered) if this wasn't just an initial load
        if (!isFirstTime) {
            resetTriggered = true; 
        }
    }
    // Evaluate Global Patch Expiration against user profile tracking timestamp
    if (!activeState.lastCheckedPatch || activeState.lastCheckedPatch < patchTarget) {
        if (new Date().getTime() >= patchTarget) {
            defaultPatch.forEach(t => {
                if (!activeState.patch) activeState.patch = {};
                activeState.patch[t.name] = false;
            });
            activeState.lastCheckedPatch = patchTarget;
            resetTriggered = true;
        }
    }
    return { resetTriggered, state: activeState };
}

export function getCountdownDisplay(ms) {
    if (ms < 0) {
        return {
            text: 'Resetting...',
            isWarning: true,
            isResetting: true
        };
    }

    const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
    const baseText = d > 0 ? `${d}d ${h % 24}h left` : `${h % 24}h ${m % 60}m ${s % 60}s left`;
    const isWarning = ms <= 3 * 24 * 60 * 60 * 1000;

    return {
        text: isWarning ? `⚠ ${baseText}` : baseText,
        isWarning,
        isResetting: false
    };
}

function formatCountdown(ms) {
    return getCountdownDisplay(ms).text;
}

export function getTimerStrings() {
    const { dailyTarget, weeklyTarget, biweeklyTarget, monthlyTarget, beyondTarget, patchTarget, nowET } = getTargetResets();
    const currentMs = nowET.getTime();
    
    // We calculate the strings here
    return {
        daily: formatCountdown((dailyTarget + 86400000) - currentMs),
        weekly: formatCountdown((weeklyTarget + 604800000) - currentMs),
        biweekly: formatCountdown((biweeklyTarget + 1209600000) - currentMs),
        monthly: formatCountdown(new Date(monthlyTarget).setMonth(new Date(monthlyTarget).getMonth() + 1) - currentMs),
        beyond: formatCountdown((beyondTarget + 1209600000) - currentMs),
        patch: formatCountdown(patchTarget - currentMs)
    };
}

/**
 * Calculates and clamps challenge bounds based on the current floor level
 */
export function calculateBoundedChallenges(currentFloor, currentChallenges, changeAmount) {
    const minAllowed = Math.max(0, currentFloor - 1); 
    const maxAllowed = currentFloor * 3;
    
    let newChallenges = currentChallenges + changeAmount;
    
    if (newChallenges < minAllowed) return minAllowed;
    if (newChallenges > maxAllowed) return maxAllowed;
    return newChallenges;
}