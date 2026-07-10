import { createInitialGameState } from '../js/game/state/create-state.js';
import { dispatchGameAction } from '../js/game/state/reducer.js';
import { chooseAutoAction } from '../js/game/ai/policy.js';
function arg(name, fallback){ const raw=process.argv.find(a=>a.startsWith(`--${name}=`)); return raw?raw.split('=')[1]:fallback; }
function rng(seed){ let s=Number(seed)||1; return ()=>((s=(s*1664525+1013904223)>>>0)/4294967296); }
const players=Number(arg('players',4)); const games=Number(arg('games',20)); const seed=Number(arg('seed',1234)); const maxTurns=Number(arg('maxTurns',300));
const stats={ games, turns:0, deadlocks:0, errors:0, victory:{ ELIMINATION:0, LINE_CONQUEST:0, BOSS_KILL:0 }};
for(let g=0; g<games; g++) { const r=rng(seed+g); const state=createInitialGameState({ playerNames:Array.from({length:players},(_,i)=>`AI ${i+1}`), seed:seed+g }); try { while(state.phase!=='GAME_OVER' && state.turnNumber<=maxTurns) { const p=state.players.find(x=>x.id===state.currentPlayerId); if (!p || p.isEliminated) break; const roll={ type:'ROLL_MOVE', playerId:p.id, steps:2+Math.floor(r()*11), endTurn:false }; dispatchGameAction(state, roll); if(state.phase==='GAME_OVER') break; const act=chooseAutoAction(state,p.id,r); dispatchGameAction(state, act); } if(state.phase!=='GAME_OVER') stats.deadlocks++; else stats.victory[state.victoryType]++; stats.turns += state.turnNumber; } catch(e) { stats.errors++; } }
console.log(`Games: ${games}`); console.log(`Average turns: ${(stats.turns/games).toFixed(1)}`); console.log(''); console.log('Victory:'); for (const [k,v] of Object.entries(stats.victory)) console.log(`- ${k}: ${((v/games)*100).toFixed(1)}%`); console.log(`Deadlocks: ${stats.deadlocks}`); console.log(`Errors: ${stats.errors}`);
