import { movePlayer, getNextActivePlayerId } from '../rules/movement.js';
import { attackMonster } from '../rules/monster.js';
import { upgradeTerritory } from '../rules/upgrade.js';
import { conquerTerritory } from '../rules/conquest.js';
import { resolveVictory } from '../rules/victory.js';
export function dispatchGameAction(state, action) { if (state.phase === 'GAME_OVER') return state; if (action.type === 'ROLL_MOVE') movePlayer(state, action.playerId, action.steps); if (action.type === 'ATTACK_MONSTER') attackMonster(state, action.playerId, action.territoryId, action.directTroops); if (action.type === 'UPGRADE') upgradeTerritory(state, action.playerId, action.territoryId); if (action.type === 'CONQUEST') conquerTerritory(state, action.playerId, action.territoryId, action.directTroops); resolveVictory(state); state.seq += 1; if (action.endTurn !== false && state.phase !== 'GAME_OVER') { state.activePlayerIds = state.players.filter(p=>!p.isEliminated).map(p=>p.id); state.currentPlayerId = getNextActivePlayerId(state.currentPlayerId, state.turnOrder, state.activePlayerIds); state.turnNumber += 1; } return state; }
