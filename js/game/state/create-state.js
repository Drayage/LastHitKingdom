import { BALANCE_CONFIG, PLAYER_COUNT_CONFIG } from '../config/balance.js?v=0.2.1';
import { createBoardDefinition } from '../config/board.js';
import { TRAITS } from '../config/traits.js';
export function createInitialGameState({ playerNames = ['Player 1','Player 2'], playerConfigs = null, seed = 1 } = {}) {
  const configs = playerConfigs ?? playerNames.map(name=>({name,controlType:'LOCAL'}));
  const count = Math.min(4, Math.max(2, configs.length));
  const boardDef = createBoardDefinition();
  const mult = PLAYER_COUNT_CONFIG[count];
  const startingTroops = Math.round(BALANCE_CONFIG.startingTroops * mult.startingTroopsMultiplier);
  const players = configs.slice(0, count).map((config, i) => ({ id: `player-${i+1}`, name:config.name, controlType:config.controlType??'LOCAL', position: 0, troops: startingTroops, lapCount: 0, level: 1, jobId: null, ownedTerritoryIds: [], acquiredTraitIds: [], isInPrison: false, prisonTurnCount: 0, isEliminated: false, pendingWarCouncil: false, pendingTraitChoice: false }));
  const territories = Object.fromEntries(boardDef.territories.map(t => [t.id, { id: t.id, name: t.name, line: t.line, boardIndex: t.boardIndex, ownerId: null, level: 0, monsterMaxHp: Math.round(t.monsterMaxHp * mult.monsterHpMultiplier), monsterCurrentHp: Math.round(t.monsterMaxHp * mult.monsterHpMultiplier), adjacentTerritoryIds: t.adjacentTerritoryIds }]));
  return { id: `local-${seed}`, phase: 'PLAYING', playerCount:count, economyMultiplier:mult.economyMultiplier, players, turnOrder: players.map(p=>p.id), activePlayerIds: players.map(p=>p.id), currentPlayerId: players[0].id, turnNumber: 1, board: boardDef.tiles, territories, sharedTraitPool: TRAITS.map(t=>t.id), acquiredTraitOwnerMap: {}, boss: { id: 'main-boss', maxHp: Math.round(BALANCE_CONFIG.boss.maxHp * mult.bossHpMultiplier), currentHp: Math.round(BALANCE_CONFIG.boss.maxHp * mult.bossHpMultiplier), lastDamagedByPlayerId: null }, seq: 0, winnerId: null, victoryType: null, pendingAction: null, actionLog: [] };
}
