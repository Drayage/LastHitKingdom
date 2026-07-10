export const BOARD_CONFIG = { line1: { territoryCount: 6, specialTileCount: 1 }, line2: { territoryCount: 5, specialTileCount: 2 }, line3: { territoryCount: 4, specialTileCount: 3, includesBoss: true }, line4: { territoryCount: 3, specialTileCount: 3 } };
const LINE_NAMES = { 1: ['Oak Field','Wolf Road','Moss Fort','Goblin Ford','Silver Copse','Hill Watch'], 2: ['Rune Mill','Ember Bridge','Briar Keep','Moon Farm','Crystal Yard'], 3: ['Ash Gate','Wyvern Nest','Crown Mine','Storm Tower'], 4: ['Frost Port','Dragon Wall','Star Citadel'] };
const MONSTER_HP = { 1: 18, 2: 26, 3: 36, 4: 48 };
export function createBoardDefinition() {
  const tiles = [{ id: 'capital', type: 'CAPITAL', name: 'Royal Capital', line: 0 }];
  const territories = [];
  let territoryOrdinal = 0;
  const addTerritory = (line, name) => { const id = `t-${++territoryOrdinal}`; tiles.push({ id, type: 'TERRITORY', name, line, territoryId: id }); territories.push({ id, name, line, boardIndex: tiles.length - 1, monsterMaxHp: MONSTER_HP[line] }); };
  LINE_NAMES[1].forEach(n => addTerritory(1, n)); tiles.push({ id: 'war-council-1', type: 'WAR_COUNCIL', name: 'War Council', line: 1 });
  LINE_NAMES[2].slice(0,2).forEach(n => addTerritory(2, n)); tiles.push({ id: 'gate-a', type: 'GATE', name: 'North Gate', line: 2 }); LINE_NAMES[2].slice(2).forEach(n => addTerritory(2, n)); tiles.push({ id: 'prison', type: 'PRISON', name: 'Shadow Prison', line: 2 });
  LINE_NAMES[3].slice(0,2).forEach(n => addTerritory(3, n)); tiles.push({ id: 'main-boss', type: 'BOSS', name: 'Ancient Dragon', line: 3 }); LINE_NAMES[3].slice(2).forEach(n => addTerritory(3, n)); tiles.push({ id: 'gate-b', type: 'GATE', name: 'South Gate', line: 3 }); tiles.push({ id: 'war-council-2', type: 'WAR_COUNCIL', name: 'War Council', line: 3 });
  LINE_NAMES[4].forEach(n => addTerritory(4, n)); tiles.push({ id: 'gate-c', type: 'GATE', name: 'Star Gate', line: 4 }); tiles.push({ id: 'event-1', type: 'EVENT', name: 'Fate Scroll', line: 4 }); tiles.push({ id: 'event-2', type: 'EVENT', name: 'Kingdom Event', line: 4 });
  const boardTerritories = territories.map(t => ({ ...t, adjacentTerritoryIds: findAdjacentTerritoryIds(tiles, t.boardIndex) }));
  return { tiles, territories: boardTerritories };
}
function findAdjacentTerritoryIds(tiles, boardIndex) { return [-1,1].map(d => tiles[(boardIndex + d + tiles.length) % tiles.length]).filter(t => t.type === 'TERRITORY').map(t => t.territoryId); }
