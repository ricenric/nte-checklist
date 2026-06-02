// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTargetResets, initApp, checkAndResetState } from './app.js';

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
    // Pre-seed mock DOM fragments to catch any lingering UI function updates gracefully
    document.body.innerHTML = `
      <div id="daily-timer"></div>
      <div id="weekly-timer"></div>
      <div id="biweekly-timer"></div>
      <div id="monthly-timer"></div>
      <div id="et-clock"></div>
    `;
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('should maintain state when checking 1 minute BEFORE the 5:00 AM ET server reset', () => {
    // Set mock time to 4:59 AM ET (8:59 AM UTC)
    const preResetTime = new Date(Date.UTC(2026, 5, 2, 8, 59, 0));
    vi.setSystemTime(preResetTime);

    const mockState = { 
      lastCheckedDaily: preResetTime.getTime(), 
      dailies: { "Manage Cafe & Collect Fons": true },
      weeklies: {}, biweeklies: {}, monthlies: {}
    };

    const result = checkAndResetState('#user-test', mockState);

    expect(result.resetTriggered).toBe(false);
    expect(result.tasks["Manage Cafe & Collect Fons"]).toBe(true);
  });

  it('should automatically wipe daily tasks exactly 1 minute AFTER the 5:00 AM ET reset boundary', () => {
    // Set initial mock time to 4:59 AM ET (8:59 AM UTC)
    const initialTime = new Date(Date.UTC(2026, 5, 2, 8, 59, 0));
    vi.setSystemTime(initialTime);

    const originalState = { 
      lastCheckedDaily: initialTime.getTime(), 
      dailies: { "Manage Cafe & Collect Fons": true },
      weeklies: {}, biweeklies: {}, monthlies: {}
    };

    // Move forward past the 5:00 AM threshold boundary
    vi.advanceTimersByTime(2 * 60 * 1000); 

    const updatedResult = checkAndResetState('#user-test', originalState);

    expect(updatedResult.resetTriggered).toBe(true);
    expect(updatedResult.tasks["Manage Cafe & Collect Fons"]).toBe(false);
  });
});