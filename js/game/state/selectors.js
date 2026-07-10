export const getCurrentPlayer = state => state.players.find(p=>p.id===state.currentPlayerId);
export const getTileAtPlayer = (state, playerId) => state.board[state.players.find(p=>p.id===playerId).position];
export const getTerritoriesByOwner = (state, ownerId) => Object.values(state.territories).filter(t=>t.ownerId===ownerId);
