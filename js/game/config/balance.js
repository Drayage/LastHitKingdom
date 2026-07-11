export const BALANCE_CONFIG = {
  startingTroops: 60,
  capitalSupply: 15,
  prison: { maxTurns: 3 },
  territoryLevel: {
    1: { passageDamage: 6, adjacentSupport: 2, bossDamageValue: 1, conquestCost: 10, upgradeCost: 0, releaseRefund: 8 },
    2: { passageDamage: 12, adjacentSupport: 4, bossDamageValue: 2, conquestCost: 20, upgradeCost: 10, releaseRefund: 18 },
    3: { passageDamage: 20, adjacentSupport: 6, bossDamageValue: 3, conquestCost: 35, upgradeCost: 20, releaseRefund: 32 },
  },
  lineMultiplier: { 1: 1.0, 2: 1.25, 3: 1.5, 4: 1.8 },
  boss: { maxHp: 120 },
  traitOffer: { sameLevel: { optionCount: 3, rerollCount: 0 }, oneLevelBehind: { optionCount: 3, rerollCount: 1 }, twoOrMoreLevelsBehind: { optionCount: 4, rerollCount: 1 } },
};
export const PLAYER_COUNT_CONFIG = {
  2: { bossHpMultiplier: 0.8, monsterHpMultiplier: 0.9, startingTroopsMultiplier: 1.4, economyMultiplier: 1.35 },
  3: { bossHpMultiplier: 1, monsterHpMultiplier: 1, startingTroopsMultiplier: 1.2, economyMultiplier: 1.15 },
  4: { bossHpMultiplier: 1.2, monsterHpMultiplier: 1.05, startingTroopsMultiplier: 1, economyMultiplier: 1 },
};
export function scaledValue(base, line) { return Math.round(base * BALANCE_CONFIG.lineMultiplier[line]); }
