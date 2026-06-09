import { describe, it, expect } from 'vitest';
import { calculateBondXP, LEVEL_COSTS } from "../js/logic/bondLogic.js";

describe('Bond Math Logic Validation (Hard-coded Regression)', () => {
  it('should strictly maintain the defined game balance table', () => {
    expect(LEVEL_COSTS[1]).toBe(500);
    expect(LEVEL_COSTS[4]).toBe(3500);
    expect(LEVEL_COSTS[9]).toBe(16000);
  });

  it('should calculate Level 1 to 2 correctly (Base: 500 XP)', () => {
    const res = calculateBondXP(1, 2, 0, 0, 3, 100);
    expect(res.totalXpNeeded).toBe(500);
    expect(res.daysNeededBase).toBe(2);
  });

  it('should calculate Level 1 to 4 correctly (Cumulative: 3500 XP)', () => {
    const res = calculateBondXP(1, 4, 0, 0, 1, 3500);
    expect(res.totalXpNeeded).toBe(3500);
    expect(res.daysNeededBase).toBe(1);
  });

  it('should calculate progression starting from Level 5 to Level 7', () => {
    const res = calculateBondXP(5, 7, 0, 0, 1, 12000);
    expect(res.totalXpNeeded).toBe(12000);
    expect(res.daysNeededBase).toBe(1);
  });

  it('should calculate full progression from Level 1 to Level 10', () => {
    const res = calculateBondXP(1, 10, 0, 0, 1, 56000);
    expect(res.totalXpNeeded).toBe(56000);
    expect(res.daysNeededBase).toBe(1);
  });

  it('should correctly apply one-time affinity bonus (L1 to 2)', () => {
    const res = calculateBondXP(1, 2, 0, 500, 3, 100);
    expect(res.remainingXpAfterBonus).toBe(0);
    expect(res.daysNeededWithBonus).toBe(0);
  });

  it('should handle boundary where currentXp exceeds level requirements', () => {
    const res = calculateBondXP(1, 2, 600, 0, 3, 100);
    expect(res.totalXpNeeded).toBe(0);
    expect(res.daysNeededBase).toBe(0);
  });

  it('should handle targetLevel being lower than currentLevel gracefully', () => {
    const res = calculateBondXP(5, 1, 0, 0, 3, 100);
    expect(res.totalXpNeeded).toBe(0);
    expect(res.daysNeededBase).toBe(0);
  });

  it('should handle zero daily gift input to avoid division by zero', () => {
    const res = calculateBondXP(1, 2, 0, 0, 0, 100);
    expect(res.daysNeededBase).toBe("N/A");
  });

  it('should correctly apply the Daily Date +200 XP bonus', () => {
    // Level 1 to 2 requires 500 XP.
    // 3 gifts * 100 XP = 300 XP.
    // Daily Date (true) = +200 XP.
    // Total Daily XP = 500. It should take exactly 1 day instead of 2.
    const res = calculateBondXP(1, 2, 0, 0, 3, 100, true);
    
    expect(res.totalXpNeeded).toBe(500);
    expect(res.dailyXp).toBe(500);
    expect(res.daysNeededBase).toBe(1);
  });
});