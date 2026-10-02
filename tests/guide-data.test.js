import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../js/data/characters.js'; // real data, unmocked

describe('Character roster data integrity', () => {
    it('every id matches the slugified version of its name', () => {
        CHARACTERS.forEach(character => {
            const expectedId = character.name.trim().toLowerCase().replace(/\s+/g, '-');
            expect(character.id).toBe(expectedId);
        });
    });

    it('includes the newly added S-tier characters', () => {
        expect(CHARACTERS).toEqual(expect.arrayContaining([
            expect.objectContaining({ id: 'linko', name: 'Linko', element: 'anima', rarity: 's' }),
            expect.objectContaining({ id: 'blackbird', name: 'Blackbird', element: 'psyche', rarity: 's' })
        ]));
    });

    it('every element is one of the known categories', () => {
        const validElements = ['cosmos', 'anima', 'incantation', 'chaos', 'psyche', 'lakshana'];
        CHARACTERS.forEach(character => {
            expect(validElements).toContain(character.element);
        });
    });
});