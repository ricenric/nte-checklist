import { describe, it, expect } from 'vitest';
import { getCountdownDisplay } from '../js/logic/checklistLogic.js';

describe('Countdown warnings', () => {
    it('flags countdowns as urgent when they are within three days of reset', () => {
        const warning = getCountdownDisplay(2 * 24 * 60 * 60 * 1000);

        expect(warning.isWarning).toBe(true);
        expect(warning.text).toContain('⚠');
    });

    it('does not warn for longer countdowns', () => {
        const warning = getCountdownDisplay(4 * 24 * 60 * 60 * 1000);

        expect(warning.isWarning).toBe(false);
        expect(warning.text).not.toContain('⚠');
    });
});
