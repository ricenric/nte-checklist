// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// MOCK BEFORE IMPORTS
vi.mock('../js/supabaseClient.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    upsert: vi.fn(),
  }
}));

import { 
    defaultDailies, 
    defaultWeeklies, 
    defaultBiweeklies, 
    defaultMonthlies, 
    defaultPatch, 
    defaultBeyondtheRails,
    PATCH_RESET_ANCHOR
} from '../js/data/checklistData.js';
import { checkAndResetState, calculateBoundedChallenges } from '../js/logic/checklistLogic.js';

const createMockState = (overrides = {}) => ({
  // Defaults for all timestamps
  lastCheckedDaily: Date.now(),
  lastCheckedPatch: Date.now(),

  // Defaults for all data buckets (required to prevent TypeError)
  dailies: {},
  weeklies: {},
  biweeklies: {},
  monthlies: {},
  beyond: { currentFloor: 1, challenges: 0 },
  patch: {},

  // Merge any specific overrides
  ...overrides
});

describe('⏱️ Server Reset Engine (Timezone-Locked)', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

  const config = { defaultDailies, defaultWeeklies, defaultBiweeklies, defaultMonthlies, defaultBeyondtheRails, defaultPatch, PATCH_RESET_ANCHOR};

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

  describe('📦 Game-wide Patch Milestone Expirations', () => {
    it('should maintain patch progression before reaching the patch reset anchor target', () => {
      // August 19, 2026 at 5:00 AM ET is Date.UTC(2026, 7, 19, 9, 0, 0);
      const prePatchTime = new Date(Date.UTC(2026, 7, 19, 8, 59, 0)); // 1 minute before patch deadline
      vi.setSystemTime(prePatchTime);

      const mockState = createMockState({
        lastCheckedPatch: prePatchTime.getTime(),
        patch: { "Hunter Exchange": true }
      });

      const result = checkAndResetState(mockState, config);

      expect(result.resetTriggered).toBe(false);
      expect(result.state.patch["Hunter Exchange"]).toBe(true);
    });

    it('should flush completed patch milestones once time oversteps the patch anchor target', () => {
      const initialPatchTime = new Date(Date.UTC(2026, 7, 19, 8, 59, 0));
      vi.setSystemTime(initialPatchTime);

      const mockState = createMockState({
        lastCheckedPatch: initialPatchTime.getTime(),
        patch: { "Hunter Exchange": true }
      });

      // Jump past the August 19 deadline boundary
      vi.advanceTimersByTime(2 * 60 * 1000); 

      const updatedResult = checkAndResetState(mockState, config);

      expect(updatedResult.resetTriggered).toBe(true);
      expect(updatedResult.state.patch["Hunter Exchange"]).toBe(false);
    });
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