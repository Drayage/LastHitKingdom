import { BALANCE_CONFIG, scaledValue } from './game/config/balance.js';
import { TRAITS } from './game/config/traits.js';
import { calculatePassageDamage } from './game/rules/passage.js';
import { calculateFriendlySupport } from './game/rules/support.js';
import { calculateConquestRequirement } from './game/rules/conquest.js';
import { calculateBossDamage } from './game/rules/boss.js';

export const PLAYER_COLORS = ['#38bdf8','#fb7185','#a3e635','#c084fc'];
const TILE_ICONS = { CAPITAL:'🏰', WAR_COUNCIL:'⚔️', GATE:'🌀', PRISON:'⛓️', BOSS:'🐉', EVENT:'📜', TERRITORY:'👹' };
const JOBS = { knight:'기사', general:'장군', ranger:'레인저', lord:'영주' };
const TRAIT_ICONS = { 'sure-step':'🥾','gate-sage':'🔮','siege-ledger':'📕','monster-scouts':'🦅','safe-roads':'🛡️',salvager:'⚒️','boss-hunter':'🐲',builder:'🏗️' };
const CONTROL_ICONS = { LOCAL:'👤', AI:'🤖', ONLINE:'🌐' };

function player(state,id){ return state.players.find(p=>p.id===id); }
function territoryAt(state,p){ const tile=state.board[p.position]; return tile.territoryId ? state.territories[tile.territoryId] : null; }
function lineLabel(line){ return line ? `${line}라인` : '왕도'; }
function building(level){ return level===3?'🏰':level===2?'🏯':level===1?'🏕️':'👹'; }
function tokenMarkup(state,index){
  return state.players.filter(p=>p.position===index&&!p.isEliminated).map(p=>{
    const n=state.players.indexOf(p); return `<span class="token token-${n+1} ${p.id===state.currentPlayerId?'active':''}" title="${p.name}" style="--token:${PLAYER_COLORS[n]}">${JOBS[p.jobId]?.[0]??'♟'}</span>`;
  }).join('');
}
function boardPosition(i,total){
  const base=Math.floor(total/4), extra=total%4;
  const counts=[0,1,2,3].map(n=>base+(n<extra?1:0));
  let segment=0,start=0;
  while(segment<3&&i>=start+counts[segment]){start+=counts[segment];segment++;}
  const offset=i-start, ratio=offset/counts[segment];
  const horizontal=`calc(52px + ${ratio*100}% - ${104*ratio}px)`;
  const vertical=`calc(41px + ${ratio*100}% - ${82*ratio}px)`;
  if(segment===0) return `--edge:top;left:${horizontal}`;
  if(segment===1) return `--edge:right;top:${vertical}`;
  if(segment===2) return `--edge:bottom;right:${horizontal}`;
  return `--edge:left;bottom:${vertical}`;
}
function isCornerTile(index,total){ const base=Math.floor(total/4),extra=total%4,counts=[0,1,2,3].map(n=>base+(n<extra?1:0));return [0,counts[0],counts[0]+counts[1],counts[0]+counts[1]+counts[2]].includes(index); }
function tileMarkup(state,tile,index){
  const t=tile.territoryId?state.territories[tile.territoryId]:null;
  const owner=t?.ownerId?player(state,t.ownerId):null;
  const ownerIndex=owner?state.players.indexOf(owner):-1;
  const detail=t ? (owner
    ? `<span class="tile-state building">${building(t.level)} <b>Lv.${t.level}</b></span><span class="tile-stat">⚔ 통행 ${calculatePassageDamage(state,t.id)}</span>`
    : `<span class="tile-state monster">👹 <b>${t.monsterCurrentHp}/${t.monsterMaxHp}</b></span>`) : `<span class="tile-state special-icon">${TILE_ICONS[tile.type]??'✦'}</span>`;
  return `<article class="tile line-${tile.line} ${tile.type} ${owner?'owned':''} ${isCornerTile(index,state.board.length)?'corner-tile':''}" data-index="${index}" style="${boardPosition(index,state.board.length)};--owner:${ownerIndex>=0?PLAYER_COLORS[ownerIndex]:'transparent'}">
    <span class="line-badge">${lineLabel(tile.line)}</span><strong>${tile.name}</strong>${detail}
    ${owner?`<span class="owner-label" title="${owner.name} 소유"><i></i>${owner.name}</span>`:''}<div class="tokens">${tokenMarkup(state,index)}</div>
  </article>`;
}
function renderPlayers(state){
  document.getElementById('player-cards').innerHTML=state.players.map((p,i)=>`<article class="player-card ${p.id===state.currentPlayerId?'current':''} ${p.isEliminated?'eliminated':''}" style="--player:${PLAYER_COLORS[i]}">
    <div class="player-title"><span class="portrait">${JOBS[p.jobId]?.[0]??'♟'}</span><div><strong>${p.name} <em class="control-badge">${CONTROL_ICONS[p.controlType]??'👤'}</em></strong><small>${p.jobId?JOBS[p.jobId]:'모험가'} · ${lineLabel(state.board[p.position].line)}</small></div><span class="turn-crown">♛</span></div>
    <div class="player-stats"><span>⚔ ${p.troops}</span><span>★ Lv.${p.level}</span><span>⚑ ${p.ownedTerritoryIds.length}</span><span>↻ ${p.lapCount}</span></div>
    <div class="traits">${p.acquiredTraitIds.map(id=>`<span title="${TRAITS.find(t=>t.id===id)?.name}">${TRAIT_ICONS[id]??'✦'}</span>`).join('')||'<small>특성 없음</small>'}${p.pendingWarCouncil?'<span title="전쟁회의 효과">🎲🎲</span>':''}</div>
  </article>`).join('');
}
function renderBoss(state){
  const current=player(state,state.currentPlayerId), hp=Math.round(state.boss.currentHp/state.boss.maxHp*100);
  const lines=[1,2,3,4].map(line=>{const ts=Object.values(state.territories).filter(t=>t.line===line),owned=ts.filter(t=>t.ownerId===current?.id).length;return `<span>${line}라인 ${owned}/${ts.length}</span>`}).join('');
  document.getElementById('boss-center').innerHTML=`<div class="boss-statue"><span class="dragon">🐉</span><i></i></div><div class="boss-copy"><span class="eyebrow">왕국 중앙 광장</span><h2>고대의 용</h2><div class="hp-label"><span>보스 HP</span><b>${state.boss.currentHp}/${state.boss.maxHp}</b></div><div class="hp"><i style="width:${hp}%"></i></div><p>통과 예상 피해 <b>${current?calculateBossDamage(state,current.id):0}</b></p><div class="turn-info">턴 ${state.turnNumber} · <b>${current?.name??'-'}</b></div><div class="victory-progress">${lines}<span>🐉 ${100-hp}%</span></div></div>`;
}
export function naturalLog(state,e){
  const p=player(state,e.playerId??e.attackerId)?.name??'플레이어', t=state.territories[e.territoryId]?.name;
  const receiver=player(state,e.ownerId)?.name;
  const text={ ROLL_MOVE:`${p}님이 주사위 ${e.dice?.join(' + ')??e.steps}을 굴려 ${e.steps}칸 이동합니다.`, MONSTER_ATTACK:`${p}님이 ${t}의 몬스터에게 병력 ${e.directTroops}을 투입해 ${e.damage} 피해를 입혔습니다.${e.conquered?' 영토를 정복했습니다!':''}`, UPGRADE:`${p}님이 ${t}을 ${e.level}단계로 발전시켰습니다.`, CONQUEST:`${p}님이 ${t} 침공에 ${e.success?'성공':'실패'}했습니다.`, RELEASE:`${p}님이 ${t}을 해제하고 병력 ${e.refund}을 회수했습니다.`, CAPITAL_PASS:`${p}님이 왕도를 통과해 병력을 보급받았습니다.`, BOSS_DAMAGE:`${p}님이 고대의 용에게 ${e.damage} 피해를 입혔습니다.`, PASSAGE_DAMAGE:`${p}님이 ${receiver??'소유자'}님에게 통행 병력 ${e.damage}을 지불했습니다.`, GATE_TRAVEL:`${p}님이 관문을 통해 이동했습니다.`, TRAIT:`${p}님이 새로운 특성을 얻었습니다.`};
  return text[e.type]??`${p}님의 행동이 처리되었습니다.`;
}
function renderLog(state){ document.getElementById('log').innerHTML=state.actionLog.slice(-5).reverse().map(e=>`<li>${naturalLog(state,e)}</li>`).join('')||'<li>아직 기록이 없습니다.</li>'; }
export function render(state,ui={phase:'ROLL'}){
  renderPlayers(state); renderBoss(state); renderLog(state);
  document.querySelectorAll('#board > .tile').forEach(e=>e.remove());
  document.getElementById('board').insertAdjacentHTML('beforeend',state.board.map((t,i)=>tileMarkup(state,t,i)).join(''));
  renderActionPanel(state,ui);
}
export function renderActionPanel(state,ui){
  const root=document.getElementById('action-panel'), p=player(state,state.currentPlayerId);
  if(state.phase==='GAME_OVER'){ const winner=player(state,state.winnerId); root.innerHTML=`<div class="victory"><span>👑</span><div><h2>${winner?.name} 승리!</h2><p>${state.victoryType==='BOSS_KILL'?'고대의 용을 쓰러뜨렸습니다.':state.victoryType==='LINE_CONQUEST'?'한 라인을 완전히 정복했습니다.':'최후의 생존자가 되었습니다.'}</p></div></div>`;return; }
  if(p.controlType==='AI'&&ui.phase!=='MOVING'){root.innerHTML=`<div class="ai-thinking"><span>🤖</span><div><b>${p.name}의 AI 턴</b><small>행동을 계산하고 있습니다. 사람 입력은 잠겨 있습니다.</small></div></div>`;return;}
  if(ui.phase==='MOVING'){root.innerHTML=`<div class="moving-message"><span class="spinner">🎲</span><div><b>${p.name} 이동 중…</b><small>${ui.remaining}칸 남았습니다.</small></div></div>`;return;}
  if(ui.phase==='ARRIVAL'){root.innerHTML=`<div><span class="eyebrow">도착 행동</span><h2>${state.board[p.position].name}</h2><p>가능한 행동을 선택하세요.</p></div><div class="actions">${ui.actions}</div>`;return;}
  root.innerHTML=`<div><span class="eyebrow">${p.name}님의 차례</span><h2>주사위를 굴려 모험을 시작하세요</h2><p>왕도를 지나면 병력 보급, 보스를 지나면 영토 단계만큼 피해를 줍니다.</p></div><div class="dice-zone"><div class="dice ${ui.rolling?'rolling':''}"><span>${ui.dice?.[0]??'⚄'}</span><span>${ui.dice?.[1]??'⚂'}</span></div><button id="roll-dice" class="primary" ${ui.rolling?'disabled':''}>🎲 주사위 굴리기</button></div>`;
}
export function territoryPreview(state,territoryId,kind){
  const t=state.territories[territoryId], p=player(state,state.currentPlayerId), support=calculateFriendlySupport(state,t.id,p.id);
  if(kind==='monster') return { title:`${t.name} 몬스터 공격`, max:p.troops, min:0, suggested:Math.min(p.troops,Math.max(0,t.monsterCurrentHp-support)), rows:[['현재 병력',p.troops],['몬스터 HP',`${t.monsterCurrentHp}/${t.monsterMaxHp}`],['인접 지원',support]] };
  if(kind==='conquest'){const req=calculateConquestRequirement(state,t.id),enemy=calculateFriendlySupport(state,t.id,t.ownerId),passage=p.lastPassagePayment?.territoryId===t.id?p.lastPassagePayment.amount:0;return {title:`${t.name} 침공`,max:p.troops,min:0,suggested:Math.min(p.troops,Math.max(0,req-support)),rows:[['방금 지불한 통행 병력',`-${passage}`],['현재 남은 병력',p.troops],['내 인접 지원',support],['적 인접 지원',enemy],['점령 필요 전투력',req]]};}
  const next=Math.min(3,t.level+1),cfg=BALANCE_CONFIG.territoryLevel[next],cost=scaledValue(cfg.upgradeCost,t.line);return {title:`${t.name} 발전`,cost,canAfford:p.troops>=cost,rows:[['보유 병력',p.troops],['업그레이드 비용',`-${cost}`],['업그레이드 후 병력',p.troops-cost],['단계',`${t.level} → ${next}`],['통행 병력',scaledValue(cfg.passageDamage,t.line)],['인접 지원',scaledValue(cfg.adjacentSupport,t.line)],['보스 피해',cfg.bossDamageValue],['정복 방어력',scaledValue(cfg.conquestCost,t.line)]]};
}
export function modalMarkup(data,kind){
  const rows=data.rows.map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('');
  if(kind==='upgrade') return `<div class="modal-card"><button class="modal-close" data-choice="skip">×</button><span class="eyebrow">영토 관리</span><h2>${data.title}</h2><div class="cost-summary"><span>필요 병력</span><b>${data.cost}</b><small>${data.canAfford?'업그레이드 가능':'병력이 부족합니다'}</small></div><div class="detail-grid">${rows}</div><div class="modal-actions"><button data-choice="skip" class="secondary">그냥 지나가기</button><button data-choice="confirm" class="primary" ${data.canAfford?'':'disabled'}>⚒ 병력 ${data.cost}으로 업그레이드</button></div></div>`;
  return `<div class="modal-card"><button class="modal-close" data-choice="skip">×</button><span class="eyebrow">병력 배치</span><h2>${data.title}</h2><div class="detail-grid">${rows}</div><label class="troop-picker"><span>직접 투입 병력</span><output id="troop-output">${data.suggested}</output><input id="troop-range" type="range" min="${data.min}" max="${data.max}" value="${data.suggested}"></label><div id="combat-preview" class="combat-preview"></div><div class="modal-actions"><button data-choice="skip" class="secondary">행동하지 않기</button><button data-choice="confirm" class="primary">⚔ 실행</button></div></div>`;
}
export function tileAtPlayer(state){ return state.board[player(state,state.currentPlayerId).position]; }
export function currentTerritory(state){ return territoryAt(state,player(state,state.currentPlayerId)); }
