import { scaledValue } from '../config/balance.js';
import { calculateFriendlySupport, levelConfig } from './support.js';
export function calculatePassageDamage(state, territoryId) { const t = state.territories[territoryId]; if (!t.ownerId || t.level === 0) return 0; return scaledValue(levelConfig(t).passageDamage, t.line) + calculateFriendlySupport(state, territoryId, t.ownerId); }
