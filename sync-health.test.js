// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTargetResets, initApp, checkAndResetState, calculateBondXP, LEVEL_COSTS } from './app.js';

const SUPABASE_URL = "https://zpdvqtmxvkzkycvoqvyp.supabase.co";
// Using your verified client token string
const SUPABASE_ANON_KEY = "sb_publishable_9jyt1HHwYZcvW-nOXl2iMw_LAUSe50Q"; 

describe('Supabase Sync Gateway Infrastructure Validation', () => {

    it('should successfully handshake with the nte_sync rest engine without 401 modifications', async () => {
        const testPayload = {
            sync_key: "#user-test-environment-ci",
            state_json: { dailies: { "Test Task Connection": true } },
            updated_at: new Date().toISOString()
        };

        // Constructing the exact REST request parameters your app sends behind the scenes
        const response = await fetch(`${SUPABASE_URL}/rest/v1/nte_sync?on_conflict=sync_key`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates, return=minimal'
            },
            body: JSON.stringify(testPayload)
        });

        // Log the status code clearly if it fails to give you immediate context
        if (response.status !== 200 && response.status !== 201) {
            const errText = await response.text();
            console.error(`Gateway Failure Details [Status ${response.status}]:`, errText);
        }

        // The assertion ensures no 401 (Unauthorized) or 400 (Bad Schema) blocks occur
        expect([200, 201, 204]).toContain(response.status);
    });
});

describe('⏱️ Server Reset Engine (Timezone-Locked)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('should maintain state when checking 1 minute BEFORE the 5:00 AM ET server reset', () => {
    // 5:00 AM ET is 9:00 AM UTC. 1 minute before is 8:59 AM UTC.
    const preResetTime = new Date(Date.UTC(2026, 5, 2, 8, 59, 0)); // June 2, 2026, 08:59:00 UTC
    vi.setSystemTime(preResetTime);

    const mockState = { 
      lastCheckedDaily: preResetTime.getTime(), 
      dailies: { "Manage Cafe & Collect Fons": true },
      weeklies: {}, biweeklies: {}, monthlies: {}, beyond: {}
    };

    const result = checkAndResetState('#user-test', mockState);

    expect(result.resetTriggered).toBe(false);
    expect(result.tasks["Manage Cafe & Collect Fons"]).toBe(true);
  });

  it('should automatically wipe daily tasks exactly 1 minute AFTER the 5:00 AM ET reset boundary', () => {
    // Start at 1 minute before the reset threshold (8:59 AM UTC)
    const initialTime = new Date(Date.UTC(2026, 5, 2, 8, 59, 0));
    vi.setSystemTime(initialTime);

    const originalState = { 
      lastCheckedDaily: initialTime.getTime(), 
      dailies: { "Manage Cafe & Collect Fons": true },
      weeklies: {}, biweeklies: {}, monthlies: {}, beyond: {}
    };

    // Fast-forward time by 2 minutes, passing 9:00 AM UTC (5:00 AM ET) to hit 9:01 AM UTC
    vi.advanceTimersByTime(2 * 60 * 1000); 

    const updatedResult = checkAndResetState('#user-test', originalState);

    expect(updatedResult.resetTriggered).toBe(true);
    expect(updatedResult.tasks["Manage Cafe & Collect Fons"]).toBe(false);
  });

describe('Bond Math Logic Validation (Hard-coded Regression)', () => {
    it('should strictly maintain the defined game balance table', () => {
        expect(LEVEL_COSTS[1]).toBe(500);
        expect(LEVEL_COSTS[4]).toBe(3500);
        expect(LEVEL_COSTS[9]).toBe(16000);
    });

    it('should calculate Level 1 to 2 correctly (Base: 500 XP)', () => {
        // 500 XP needed, 3 gifts @ 100 = 300/day -> 2 days (300+200)
        const res = calculateBondXP(1, 2, 0, 0, 3, 100);
        expect(res.totalXpNeeded).toBe(500);
        expect(res.daysNeededBase).toBe(2); // Updated to match app.js export
    });

    it('should calculate Level 1 to 4 correctly (Cumulative: 3500 XP)', () => {
        // 500 + 1000 + 2000 = 3500 XP. 1 gift @ 3500 = 1 day.
        const res = calculateBondXP(1, 4, 0, 0, 1, 3500);
        expect(res.totalXpNeeded).toBe(3500);
        expect(res.daysNeededBase).toBe(1); // Updated to match app.js export
    });

    it('should calculate progression starting from Level 5 to Level 7', () => {
        // L5->6 (5000) + L6->7 (7000) = 12000 total needed.
        // 1 gift/day @ 12000 XP = 1 day.
        const res = calculateBondXP(5, 7, 0, 0, 1, 12000);
        expect(res.totalXpNeeded).toBe(12000);
        expect(res.daysNeededBase).toBe(1);
    });

    it('should calculate full progression from Level 1 to Level 10', () => {
        // Sum: 500+1000+2000+3500+5000+7000+9000+12000+16000 = 56,000
        const res = calculateBondXP(1, 10, 0, 0, 1, 56000);
        expect(res.totalXpNeeded).toBe(56000);
        expect(res.daysNeededBase).toBe(1);
    });

    it('should correctly apply one-time affinity bonus (L1 to 2)', () => {
        // 500 needed, 500 bonus = 0 remaining
        const res = calculateBondXP(1, 2, 0, 500, 3, 100);
        expect(res.remainingXpAfterBonus).toBe(0); // Updated to match app.js export
        expect(res.daysNeededWithBonus).toBe(0); // Updated to match app.js export
    });

    it('should handle boundary where currentXp exceeds level requirements', () => {
        // Current Level 1 (500 needed), input says 600 current XP.
        // Formula should clamp to 500, resulting in 0 XP needed.
        const res = calculateBondXP(1, 2, 600, 0, 3, 100);
        expect(res.totalXpNeeded).toBe(0);
        expect(res.daysNeededBase).toBe(0);
    });

    it('should handle targetLevel being lower than currentLevel gracefully', () => {
        // If target is 1 and current is 5, no XP should be needed.
        const res = calculateBondXP(5, 1, 0, 0, 3, 100);
        expect(res.totalXpNeeded).toBe(0);
        expect(res.daysNeededBase).toBe(0);
    });

    it('should handle zero daily gift input to avoid division by zero', () => {
        // If giftsPerDay is 0, daysNeeded should return "N/A" or 0
        const res = calculateBondXP(1, 2, 0, 0, 0, 100);
        expect(res.daysNeededBase).toBe("N/A");
    });
  });
});