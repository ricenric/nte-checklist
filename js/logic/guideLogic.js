import { CHARACTERS } from '../data/characters.js';

let characterCards = [];

export function renderCharacterCards() {
    const grid = document.getElementById('character-grid');

    if (!grid) return;

    const sortedCharacters = [...CHARACTERS].sort((a, b) =>
        a.name.localeCompare(b.name)
    );

    grid.innerHTML = sortedCharacters.map(character => `
        <a
            href="#"
            class="char-card group flex flex-col items-center gap-2.5 cursor-pointer w-28"
            data-element="${character.element}"
            data-rarity="${character.rarity}"
            id="card-${character.id}"
        >
            <div class="relative transition-all duration-200 group-hover:-translate-y-1">

                <div class="character-portrait w-24 h-24 rounded-3xl border-2 border-slate-600 overflow-hidden bg-slate-900 shadow-lg">
                    <img
                        src="./assets/character_portraits/${character.id}_small.webp"
                        alt="${character.name}"
                        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    >
                </div>

                <div class="absolute -bottom-2 -right-2 bg-slate-800 rounded-full p-1 border-2 border-slate-700 shadow-sm z-10">
                    <img
                        class="element-badge w-7 h-7 object-contain"
                        src=""
                        alt="${character.element}"
                    >
                </div>

            </div>

            <span class="text-sm text-slate-400 group-hover:text-cyan-300 transition-colors font-medium text-center w-full truncate">
                ${character.name}
            </span>
        </a>
    `).join('');

    characterCards = [
        ...document.querySelectorAll(
            '#character-grid .char-card'
        )
    ];
}

// State variable to track the active filter
let activeElementFilter = 'all';

// New function to update the element filter and re-run the layout
export function setElementFilter(element) {
    activeElementFilter = element.toLowerCase();

    const searchInput =
        document.getElementById('character-search')?.value ?? '';

    filterCharacters(searchInput);
}

export function filterCharacters(searchTerm) {
    const grid = document.getElementById('character-grid');
    const searchEl = document.getElementById('character-search');

    if (!grid) return;

    // 1. Reset and re-trigger a high-performance container fade animation
    grid.classList.remove('animate-grid-refresh');
    void grid.offsetWidth; // Forces layout reflow so the browser catches the reset
    grid.classList.add('animate-grid-refresh');

    const searchInput = (
        typeof searchTerm === 'string'
            ? searchTerm
            : searchEl?.value ?? ''
    ).toLowerCase();

    // 2. Perform the instant filtering switch natively
    characterCards.forEach(card => {
        const nameSpan = card.querySelector('span');
        const charElement = card.getAttribute('data-element')?.toLowerCase() || '';

        if (!nameSpan) return;

        const characterName = nameSpan.textContent.toLowerCase();
        const matchesText = characterName.includes(searchInput);
        const matchesElement =
            activeElementFilter === 'all' ||
            charElement === activeElementFilter;

        card.classList.toggle('hidden', !(matchesText && matchesElement));
    });
}

export function generateCharacterLinks() {
    // Define the base URL in one place so it's easy to change later
    const baseUrl = "https://www.prydwen.gg/neverness-to-everness/characters/";

    // Grab every character card
    const characterCards = document.querySelectorAll('#guides-view .char-card');

    characterCards.forEach(card => {
        const nameSpan = card.querySelector('span');

        if (nameSpan) {
            // Get the name, convert to lowercase, and replace any spaces with hyphens
            // (e.g., "Silver Wolf" becomes "silver-wolf")
            const characterName = nameSpan.textContent.trim().toLowerCase().replace(/\s+/g, '-');

            // Build and apply the dynamic URL
            card.href = baseUrl + characterName;

            // Automatically apply the new-tab and security attributes
            card.target = "_blank";
            card.setAttribute("rel", "noopener noreferrer");
        }
    });
}

// Auto-inject the correct element badge image based on the data-element attribute
export function autoFillElementBadges() {
    const characterCards = document.querySelectorAll('#character-grid .char-card');

    characterCards.forEach(card => {
        const rawElement = card.getAttribute('data-element');
        
        if (rawElement) {
            // Capitalize the first letter (e.g., "cosmos" becomes "Cosmos")
            // This ensures it perfectly matches your file names!
            const formattedElement = rawElement.charAt(0).toUpperCase() + rawElement.slice(1);
            
            // Find the badge image specifically
            const badgeImg = card.querySelector('.element-badge');
            
            if (badgeImg) {
                // Build the URL and apply it
                badgeImg.src = `./assets/elements/${formattedElement}.webp`;
                badgeImg.alt = formattedElement; 
            }
        }
    });
}

// Add this to guideLogic.js
const RARITY_COLORS = {
    's': 'border-amber-400 shadow-amber-500/20', // Gold/S-Tier
    'a': 'border-purple-400 shadow-purple-500/20', // Purple/A-Tier
    'b': 'border-blue-400 shadow-blue-500/20'      // Blue/B-Tier
};

export function applyRarityStyles() {
    const cards = document.querySelectorAll('.char-card');
    cards.forEach(card => {
        const rarity = card.getAttribute('data-rarity');
        const borderDiv = card.querySelector('.character-portrait'); // Target the portrait container
        
        if (RARITY_COLORS[rarity] && borderDiv) {
            // Remove generic border classes and add rarity-specific ones
            borderDiv.classList.remove('border-slate-600');
            borderDiv.classList.add(...RARITY_COLORS[rarity].split(' '));
        }
    });
}