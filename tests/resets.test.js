// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// MOCK BEFORE IMPORTS
vi.mock('../js/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    upsert: vi.fn(),
  }
}));

import { defaultDailies, defaultWeeklies, defaultBiweeklies, defaultMonthlies, defaultBeyondtheRails } from '../js/features/checklist.js';
import { checkAndResetState } from '../js/logic/checklistLogic.js';

describe('⏱️ Server Reset Engine (Timezone-Locked)', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

  const config = { defaultDailies, defaultWeeklies, defaultBiweeklies, defaultMonthlies, defaultBeyondtheRails };

  it('should maintain state when checking 1 minute BEFORE the 5:00 AM ET server reset', () => {
    const preResetTime = new Date(Date.UTC(2026, 5, 2, 8, 59, 0));
    vi.setSystemTime(preResetTime);
    const mockState = { 
      lastCheckedDaily: preResetTime.getTime(), 
      dailies: { "Manage Cafe & Collect Fons": true },
      weeklies: {}, biweeklies: {}, monthlies: {}, beyond: {}
    };

    const result = checkAndResetState(mockState, config);

    expect(result.resetTriggered).toBe(false);
    expect(result.state.dailies["Manage Cafe & Collect Fons"]).toBe(true);
  });

  it('should automatically wipe daily tasks exactly 1 minute AFTER the 5:00 AM ET reset boundary', () => {
    const initialTime = new Date(Date.UTC(2026, 5, 2, 8, 59, 0));
    vi.setSystemTime(initialTime);
    const originalState = { 
      lastCheckedDaily: initialTime.getTime(), 
      dailies: { "Manage Cafe & Collect Fons": true },
      weeklies: {}, biweeklies: {}, monthlies: {}, beyond: {}
    };

    vi.advanceTimersByTime(2 * 60 * 1000); 

    const updatedResult = checkAndResetState(originalState, config);

    expect(updatedResult.resetTriggered).toBe(true);
    expect(updatedResult.state.dailies["Manage Cafe & Collect Fons"]).toBe(false);
  });
});