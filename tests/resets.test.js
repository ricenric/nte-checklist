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
import { checkAndResetState, calculateBoundedChallenges } from '../js/logic/checklistLogic.js';

const createMockState = (overrides = {}) => ({
  // Defaults for all timestamps
  lastCheckedDaily: Date.now(),

  // Defaults for all data buckets (required to prevent TypeError)
  dailies: {},
  weeklies: {},
  biweeklies: {},
  monthlies: {},
  beyond: { currentFloor: 1, challenges: 0 },

  // Merge any specific overrides
  ...overrides
});

describe('⏱️ Server Reset Engine (Timezone-Locked)', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

  const config = { defaultDailies, defaultWeeklies, defaultBiweeklies, defaultMonthlies, defaultBeyondtheRails };

  it('should maintain state when checking 1 minute BEFORE the 5:00 AM ET server reset', () => {
    const preResetTime = new Date(Date.UTC(2026, 5, 2, 8, 59, 0));
    vi.setSystemTime(preResetTime);
    // Use the factory: pass ONLY what you want to change
    const mockState = createMockState({
        lastCheckedDaily: preResetTime.getTime(),
        dailies: { "Manage Cafe & Collect Fons": true }
    });

    const result = checkAndResetState(mockState, config);

    expect(result.resetTriggered).toBe(false);
    expect(result.state.dailies["Manage Cafe & Collect Fons"]).toBe(true);
  });

  it('should automatically wipe daily tasks exactly 1 minute AFTER the 5:00 AM ET reset boundary', () => {
    const initialTime = new Date(Date.UTC(2026, 5, 2, 8, 59, 0));
    vi.setSystemTime(initialTime);

    // Use the factory so weeklies/biweeklies/monthlies/beyond exist too
    const mockState = createMockState({
        lastCheckedDaily: initialTime.getTime(),
        dailies: { "Manage Cafe & Collect Fons": true }
    });

    vi.advanceTimersByTime(2 * 60 * 1000);

    const updatedResult = checkAndResetState(mockState, config);

    expect(updatedResult.resetTriggered).toBe(true);
    expect(updatedResult.state.dailies["Manage Cafe & Collect Fons"]).toBe(false);
  });

  it('should reset Beyond the Rails stats when the time has passed the target', () => {
    // 1. Set time to AFTER the target
    const afterResetTime = new Date(Date.UTC(2026, 5, 18, 0, 0, 0));
    vi.setSystemTime(afterResetTime);

    // 2. Set an OLD timestamp
    const oldTime = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));

    // Use the factory so dailies/weeklies/biweeklies/monthlies exist too
    const mockState = createMockState({
        lastCheckedDaily: afterResetTime.getTime(), 
        lastCheckedBeyond: oldTime.getTime(),
        // UPDATE HERE: Floor 5 maxes at 15. Make it consistent with your new logic.
        beyond: { currentFloor: 5, challenges: 15 } 
    });

    const result = checkAndResetState(mockState, config);

    // 3. Verify it reset and updated the timestamp
    expect(result.resetTriggered).toBe(true);
    expect(result.state.beyond.currentFloor).toBe(1);
    expect(result.state.beyond.challenges).toBe(0);
  });

});

describe('Beyond the Rails Math Boundaries', () => {
  it('should accurately cap maximum challenges to floor * 3', () => {
    // Floor 5 should never allow more than 15 stars
    const result = calculateBoundedChallenges(5, 14, 3);
    expect(result).toBe(15);
  });

  it('should enforce floor minimum rules safely', () => {
    // Floor 9 should never let challenges drop below 8 stars
    const result = calculateBoundedChallenges(9, 8, -1);
    expect(result).toBe(8);
  });
});