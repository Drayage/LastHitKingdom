export function evaluatePlayer(state, playerId) { const p = state.players.find(x=>x.id===playerId); return p.troops + p.ownedTerritoryIds.length * 12 + p.level * 5; }
