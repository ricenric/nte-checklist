// 1. The Source of Truth (Data)
export const LEVEL_COSTS = {
    1: 500, 2: 1000, 3: 2000, 4: 3500, 5: 5000, 
    6: 7000, 7: 9000, 8: 12000, 9: 16000
};

// 2. The Pure Math Engine (Logic)
export function calculateBondXP(currentLevel, targetLevel, currentXp, bonusXp, giftsPerDay, xpPerGift) {
    let totalXpNeeded = 0;
    if (targetLevel > currentLevel) {
        const validCurrentXp = Math.min(currentXp, LEVEL_COSTS[currentLevel] || 0);
        totalXpNeeded += (LEVEL_COSTS[currentLevel] - validCurrentXp);
        for (let i = currentLevel + 1; i < targetLevel; i++) {
            totalXpNeeded += LEVEL_COSTS[i];
        }
    }

    const remainingXpAfterBonus = Math.max(0, totalXpNeeded - bonusXp);
    const dailyXp = giftsPerDay * xpPerGift;
    const daysNeededBase = dailyXp > 0 ? Math.ceil(totalXpNeeded / dailyXp) : (totalXpNeeded === 0 ? 0 : "N/A");
    const daysNeededWithBonus = dailyXp > 0 ? Math.ceil(remainingXpAfterBonus / dailyXp) : (remainingXpAfterBonus === 0 ? 0 : "N/A");

    return { totalXpNeeded, remainingXpAfterBonus, dailyXp, daysNeededBase, daysNeededWithBonus };
}

export function formatCountdown(ms) {
    if (ms < 0) return "Resetting...";
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
    return d > 0 ? `${d}d ${h % 24}h left` : `${h % 24}h ${m % 60}m ${s % 60}s left`;
}