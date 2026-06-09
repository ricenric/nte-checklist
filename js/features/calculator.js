import { calculateBondXP } from "../logic/bondLogic.js";

export function runBondCalc() {
    const inputs = {
        currentLevel: parseInt(document.getElementById('calc-level').value),
        targetLevel: parseInt(document.getElementById('calc-target').value),
        currentXp: parseInt(document.getElementById('calc-xp').value) || 0,
        giftsPerDay: parseInt(document.getElementById('calc-gifts').value) || 0,
        xpPerGift: parseInt(document.getElementById('calc-gift-xp').value) || 0,
        bonusXp: parseInt(document.getElementById('calc-bonus-xp').value) || 0,
        hasDailyDate: document.getElementById('calc-daily-date').checked 
    };

    const res = calculateBondXP(
        inputs.currentLevel, inputs.targetLevel, inputs.currentXp, 
        inputs.bonusXp, inputs.giftsPerDay, inputs.xpPerGift, inputs.hasDailyDate
    );
    
    const resultDiv = document.getElementById('calc-result');
    resultDiv.classList.remove('hidden');
    
    let resultText = `To go from level <strong>${inputs.currentLevel}</strong> to level <strong>${inputs.targetLevel}</strong>, you need <strong>${res.totalXpNeeded.toLocaleString()}</strong> more XP. <br>At <strong>${res.dailyXp.toLocaleString()}</strong> XP/day, it will take approximately <strong>${res.daysNeededBase} days</strong>.`;
    
    if (inputs.bonusXp > 0) {
        resultText += `<br><br>If you use <strong>${inputs.bonusXp.toLocaleString()} XP</strong> worth of unlimited affinity items, your remaining XP is <strong>${res.remainingXpAfterBonus.toLocaleString()}</strong> and days remaining would be <strong>${res.daysNeededWithBonus} days</strong>.`;
    }
    
    document.getElementById('calc-output').innerHTML = resultText;
}