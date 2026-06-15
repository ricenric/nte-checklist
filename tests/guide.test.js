/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// guideLogic.js imports `CHARACTERS` from '../data/characters.js' (i.e. js/data/characters.js).
// We mock that module so renderCharacterCards() produces a small, predictable grid
// regardless of the real roster. The input order below is deliberately NOT
// alphabetical so the sorting logic in renderCharacterCards() actually gets exercised.
//
// NOTE: if your project layout differs (tests/ and js/ aren't siblings), adjust
// this path so it resolves to the same file guideLogic.js imports.
vi.mock('../js/data/characters.js', () => ({
    CHARACTERS: [
        { id: 'zero', name: 'Zero', element: 'cosmos', rarity: 's' },
        { id: 'anby', name: 'Anby', element: 'anima', rarity: 'a' },
        { id: 'hotori', name: 'Hotori', element: 'cosmos', rarity: 'b' },
        { id: 'silver-wolf', name: 'Silver Wolf', element: 'cosmos', rarity: 's' },
    ]
}));

import {
    renderCharacterCards,
    filterCharacters,
    generateCharacterLinks,
    setElementFilter,
    autoFillElementBadges,
    applyRarityStyles
} from '../js/logic/guideLogic.js';

describe('📖 Guides Page DOM Logic', () => {

    const isVisible = (element) => !element.classList.contains('hidden');

    beforeEach(() => {
        // 1. Build the minimal page shell that renderCharacterCards() expects
        document.body.innerHTML = `
            <div id="guides-view">
                <input type="text" id="character-search" value="" />
                <div class="flex flex-wrap gap-6" id="character-grid"></div>
            </div>
        `;

        // 2. Render cards from the mocked roster. This also primes the internal
        //    characterCards cache that filterCharacters/setElementFilter rely on.
        renderCharacterCards();

        // 3. Reset filter state between tests (activeElementFilter is module-level)
        setElementFilter('all');
    });

    describe('Card Rendering & Sorting', () => {
        it('should render one card per character', () => {
            const cards = document.querySelectorAll('#character-grid .char-card');
            expect(cards.length).toBe(4);
        });

        it('should sort cards alphabetically by name regardless of source order', () => {
            const grid = document.getElementById('character-grid');
            const sortedCards = grid.querySelectorAll('.char-card');

            expect(sortedCards[0].id).toBe('card-anby');
            expect(sortedCards[1].id).toBe('card-hotori');
            expect(sortedCards[2].id).toBe('card-silver-wolf');
            expect(sortedCards[3].id).toBe('card-zero');
        });

        it('should set data-element and data-rarity from the character data', () => {
            const zeroCard = document.getElementById('card-zero');
            expect(zeroCard.getAttribute('data-element')).toBe('cosmos');
            expect(zeroCard.getAttribute('data-rarity')).toBe('s');
        });

        it('should not throw if #character-grid is missing from the DOM', () => {
            document.body.innerHTML = '<div id="guides-view"></div>';
            expect(() => renderCharacterCards()).not.toThrow();
        });
    });

    describe('Multi-Condition Filtering', () => {
        it('should show every card when the filter is "all" and search is empty', () => {
            document.querySelectorAll('.char-card').forEach(card => {
                expect(isVisible(card)).toBe(true);
            });
        });

        it('should filter by element category', () => {
            setElementFilter('cosmos');

            expect(isVisible(document.getElementById('card-zero'))).toBe(true);
            expect(isVisible(document.getElementById('card-hotori'))).toBe(true);
            expect(isVisible(document.getElementById('card-silver-wolf'))).toBe(true);
            expect(isVisible(document.getElementById('card-anby'))).toBe(false);
        });

        it('should treat element filters case-insensitively', () => {
            setElementFilter('COSMOS');

            expect(isVisible(document.getElementById('card-zero'))).toBe(true);
            expect(isVisible(document.getElementById('card-anby'))).toBe(false);
        });

        it('should filter by search text, case-insensitively', () => {
            filterCharacters('ZERO');

            expect(isVisible(document.getElementById('card-zero'))).toBe(true);
            expect(isVisible(document.getElementById('card-anby'))).toBe(false);
        });

        it('should combine an element filter with a search term', () => {
            setElementFilter('cosmos');
            filterCharacters('zer');

            // Only Zero matches BOTH (cosmos + "zer")
            expect(isVisible(document.getElementById('card-zero'))).toBe(true);
            expect(isVisible(document.getElementById('card-hotori'))).toBe(false); // fails text
            expect(isVisible(document.getElementById('card-anby'))).toBe(false);   // fails element
        });

        it('should keep the active element filter applied after the search term changes', () => {
            setElementFilter('cosmos');
            filterCharacters('zer');
            filterCharacters(''); // clear search; element filter should persist

            expect(isVisible(document.getElementById('card-zero'))).toBe(true);
            expect(isVisible(document.getElementById('card-hotori'))).toBe(true);
            expect(isVisible(document.getElementById('card-silver-wolf'))).toBe(true);
            expect(isVisible(document.getElementById('card-anby'))).toBe(false); // still wrong element
        });

        it('should hide every card when nothing matches', () => {
            filterCharacters('zzzz');

            document.querySelectorAll('.char-card').forEach(card => {
                expect(isVisible(card)).toBe(false);
            });
        });

        it('should fall back to the live #character-search value when no argument is passed', () => {
            const input = document.getElementById('character-search');
            input.value = 'anby';

            filterCharacters();

            expect(isVisible(document.getElementById('card-anby'))).toBe(true);
            expect(isVisible(document.getElementById('card-zero'))).toBe(false);
        });
    });

    describe('Dynamic Prydwen Link Generation', () => {
        it('should correctly format standard character names into URLs', () => {
            generateCharacterLinks();

            const zeroCard = document.getElementById('card-zero');
            expect(zeroCard.href).toBe('https://www.prydwen.gg/neverness-to-everness/characters/zero');
        });

        it('should replace spaces with hyphens for multi-word characters', () => {
            generateCharacterLinks();

            const swCard = document.getElementById('card-silver-wolf');
            expect(swCard.href).toBe('https://www.prydwen.gg/neverness-to-everness/characters/silver-wolf');
        });

        it('should automatically inject strict security target attributes', () => {
            generateCharacterLinks();

            const anbyCard = document.getElementById('card-anby');
            expect(anbyCard.getAttribute('target')).toBe('_blank');
            expect(anbyCard.getAttribute('rel')).toBe('noopener noreferrer');
        });
    });

    describe('Element Badges', () => {
        it('should fill in the badge image src and alt based on data-element', () => {
            autoFillElementBadges();

            const zeroBadge = document.querySelector('#card-zero .element-badge');
            expect(zeroBadge.getAttribute('src')).toBe('./assets/elements/Cosmos.webp');
            expect(zeroBadge.getAttribute('alt')).toBe('Cosmos');

            const anbyBadge = document.querySelector('#card-anby .element-badge');
            expect(anbyBadge.getAttribute('src')).toBe('./assets/elements/Anima.webp');
        });

        it('should not throw if a card has no .element-badge element', () => {
            const card = document.getElementById('card-zero');
            card.querySelector('.element-badge')?.remove();

            expect(() => autoFillElementBadges()).not.toThrow();
        });
    });

    describe('Rarity Styling', () => {
        it('should replace the default border with a rarity-specific border', () => {
            applyRarityStyles();

            const zeroPortrait = document.querySelector('#card-zero .character-portrait'); // rarity: s
            expect(zeroPortrait.classList.contains('border-slate-600')).toBe(false);
            expect(zeroPortrait.classList.contains('border-amber-400')).toBe(true);
            expect(zeroPortrait.classList.contains('shadow-amber-500/20')).toBe(true);

            const anbyPortrait = document.querySelector('#card-anby .character-portrait'); // rarity: a
            expect(anbyPortrait.classList.contains('border-purple-400')).toBe(true);

            const hotoriPortrait = document.querySelector('#card-hotori .character-portrait'); // rarity: b
            expect(hotoriPortrait.classList.contains('border-blue-400')).toBe(true);
        });

        it('should leave the default border alone for an unrecognized rarity', () => {
            const card = document.getElementById('card-zero');
            card.setAttribute('data-rarity', 'c'); // not in RARITY_COLORS

            applyRarityStyles();

            const portrait = card.querySelector('.character-portrait');
            expect(portrait.classList.contains('border-slate-600')).toBe(true);
        });
    });
});