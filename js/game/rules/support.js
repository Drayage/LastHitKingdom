import { BALANCE_CONFIG, scaledValue } from '../config/balance.js';
export function getAdjacentTerritories(state, territoryId) { return state.territories[territoryId].adjacentTerritoryIds.map(id => state.territories[id]).filter(Boolean); }
export function levelConfig(territory) { return BALANCE_CONFIG.territoryLevel[territory.level] ?? BALANCE_CONFIG.territoryLevel[1]; }
export function calculateFriendlySupport(state, territoryId, playerId) { return getAdjacentTerritories(state, territoryId).filter(t => t.ownerId === playerId && t.level > 0).reduce((sum, t) => sum + scaledValue(levelConfig(t).adjacentSupport, t.line), 0); }
