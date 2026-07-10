import { BALANCE_CONFIG, PLAYER_COUNT_CONFIG } from '../config/balance.js';
import { createBoardDefinition } from '../config/board.js';
import { TRAITS } from '../config/traits.js';
export function createInitialGameState({ playerNames = ['Player 1','Player 2'], seed = 1 } = {}) {
  const count = Math.min(4, Math.max(2, playerNames.length));
  const boardDef = createBoardDefinition();
  const mult = PLAYER_COUNT_CONFIG[count];
  const players = playerNames.slice(0, count).map((name, i) => ({ id: `player-${i+1}`, name, position: 0, troops: BALANCE_CONFIG.startingTroops, lapCount: 0, level: 1, jobId: null, ownedTerritoryIds: [], acquiredTraitIds: [], isInPrison: false, prisonTurnCount: 0, isEliminated: false, pendingWarCouncil: false }));
  const territories = Object.fromEntries(boardDef.territories.map(t => [t.id, { id: t.id, name: t.name, line: t.line, boardIndex: t.boardIndex, ownerId: null, level: 0, monsterMaxHp: Math.round(t.monsterMaxHp * mult.monsterHpMultiplier), monsterCurrentHp: Math.round(t.monsterMaxHp * mult.monsterHpMultiplier), adjacentTerritoryIds: t.adjacentTerritoryIds }]));
  return { id: `local-${seed}`, phase: 'PLAYING', players, turnOrder: players.map(p=>p.id), activePlayerIds: players.map(p=>p.id), currentPlayerId: players[0].id, turnNumber: 1, board: boardDef.tiles, territories, sharedTraitPool: TRAITS.map(t=>t.id), acquiredTraitOwnerMap: {}, boss: { id: 'main-boss', maxHp: Math.round(BALANCE_CONFIG.boss.maxHp * mult.bossHpMultiplier), currentHp: Math.round(BALANCE_CONFIG.boss.maxHp * mult.bossHpMultiplier), lastDamagedByPlayerId: null }, seq: 0, winnerId: null, victoryType: null, pendingAction: null, actionLog: [] };
}
