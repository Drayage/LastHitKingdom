import { applyCapitalPass } from './progression.js';
import { damageBoss } from './boss.js';
export function getNextActivePlayerId(currentPlayerId, turnOrder, activePlayerIds) { const start = turnOrder.indexOf(currentPlayerId); for (let i=1;i<=turnOrder.length;i++) { const id = turnOrder[(start+i)%turnOrder.length]; if (activePlayerIds.includes(id)) return id; } return currentPlayerId; }
export function movePlayer(state, playerId, steps) { const p = state.players.find(x=>x.id===playerId); const len = state.board.length; for (let i=0;i<steps;i++) { p.position = (p.position + 1) % len; const tile = state.board[p.position]; if (tile.type === 'CAPITAL') applyCapitalPass(state, playerId); if (tile.type === 'BOSS') damageBoss(state, playerId); } return state.board[p.position]; }
