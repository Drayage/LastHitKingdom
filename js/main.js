import { createInitialGameState } from './game/state/create-state.js';
import { dispatchGameAction } from './game/state/reducer.js';
import { calculatePassageDamage } from './game/rules/passage.js';
import { releaseTerritory } from './game/rules/release.js';
import { generateTraitOffer, acquireTrait, rerollTraitOffer } from './game/rules/traits.js';
import { TRAITS } from './game/config/traits.js';
import { render, renderActionPanel, territoryPreview, modalMarkup, tileAtPlayer, currentTerritory } from './ui.js';
import './devtools.js';

let state=createInitialGameState({playerNames:['기사','장군','레인저','영주']});
let ui={phase:'ROLL',dice:null,rolling:false};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const current=()=>state.players.find(p=>p.id===state.currentPlayerId);

function newGame(){ state=createInitialGameState({playerNames:['기사','장군','레인저','영주'],seed:Date.now()}); ui={phase:'ROLL'}; render(state,ui); }
function endTurn(){
  dispatchGameAction(state,{type:'END_TURN'}); ui={phase:'ROLL',dice:null}; render(state,ui);
}
async function rollDice(){
  if(ui.phase!=='ROLL'||state.phase==='GAME_OVER') return;
  ui.rolling=true; renderActionPanel(state,ui);
  for(let i=0;i<8;i++){ui.dice=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)];renderActionPanel(state,ui);await wait(70+i*12);}
  ui.rolling=false; const steps=ui.dice[0]+ui.dice[1];
  state.actionLog.push({type:'ROLL_MOVE',playerId:current().id,dice:[...ui.dice],steps});
  await animateMove(steps);
}
async function animateMove(steps){
  ui={phase:'MOVING',remaining:steps}; render(state,ui);
  for(let i=0;i<steps;i++){
    dispatchGameAction(state,{type:'ROLL_MOVE',playerId:current().id,steps:1,endTurn:false});
    ui.remaining=steps-i-1; render(state,ui); await wait(230);
    if(state.phase==='GAME_OVER') return render(state,ui);
  }
  resolveArrival();
}
function resolveArrival(){
  const p=current(), tile=tileAtPlayer(state), t=currentTerritory(state);
  if(tile.type==='TERRITORY'&&t?.ownerId&&t.ownerId!==p.id){
    const damage=Math.min(p.troops,calculatePassageDamage(state,t.id)); p.troops-=damage; state.actionLog.push({type:'PASSAGE_DAMAGE',playerId:p.id,territoryId:t.id,damage});
  }
  let actions='';
  if(tile.type==='TERRITORY'&&!t.ownerId) actions='<button data-action="monster" class="primary">👹 몬스터 공격</button><button data-action="skip" class="secondary">지나가기</button>';
  else if(tile.type==='TERRITORY'&&t.ownerId===p.id&&t.level<3) actions='<button data-action="upgrade" class="primary">🏰 영토 발전</button><button data-action="skip" class="secondary">지나가기</button>';
  else if(tile.type==='TERRITORY'&&t.ownerId!==p.id) actions='<button data-action="conquest" class="primary">⚔ 영토 침공</button><button data-action="skip" class="secondary">통행만 하기</button>';
  else if(tile.type==='GATE') actions='<button data-action="gate" class="primary">🌀 관문 선택</button><button data-action="skip" class="secondary">머무르기</button>';
  else if(tile.type==='PRISON') actions='<button data-action="prison" class="primary">🎲 탈출 시도</button>';
  else if(tile.type==='WAR_COUNCIL') actions='<button data-action="council" class="primary">⚔ 전쟁회의 참가</button>';
  else actions='<button data-action="skip" class="primary">턴 마치기</button>';
  ui={phase:'ARRIVAL',actions}; render(state,ui);
}
function openDecision(kind){
  const t=currentTerritory(state), data=territoryPreview(state,t.id,kind), root=document.getElementById('modal-root');
  root.innerHTML=`<div class="modal-backdrop">${modalMarkup(data,kind)}</div>`;
  const range=root.querySelector('#troop-range');
  range?.addEventListener('input',()=>{root.querySelector('#troop-output').textContent=range.value;root.querySelector('#combat-preview').textContent=`직접 병력 ${range.value}을 투입합니다.`;});
  root.onclick=e=>{
    const button=e.target.closest('[data-choice]'); if(!button)return;
    if(button.dataset.choice==='skip'){root.innerHTML='';root.onclick=null;endTurn();return;}
    try{
      const troops=range?Math.max(0,Math.min(current().troops,Number(range.value)||0)):0;
      if(kind==='monster')dispatchGameAction(state,{type:'ATTACK_MONSTER',playerId:current().id,territoryId:t.id,directTroops:troops,endTurn:false});
      if(kind==='conquest')dispatchGameAction(state,{type:'CONQUEST',playerId:current().id,territoryId:t.id,directTroops:troops,endTurn:false});
      if(kind==='upgrade')dispatchGameAction(state,{type:'UPGRADE',playerId:current().id,territoryId:t.id,endTurn:false});
      root.innerHTML='';root.onclick=null;checkDeficitOrProgress();
    }catch(error){
      const preview=root.querySelector('.combat-preview');
      if(preview)preview.textContent='행동을 처리할 수 없습니다. 병력 수를 다시 확인해주세요.';
      console.error(error);
    }
  };
}
function checkDeficitOrProgress(){ if(current().troops<0&&current().ownedTerritoryIds.length)return openRelease(); maybeOfferTrait(); }
function openRelease(){
  const p=current(),root=document.getElementById('modal-root');root.innerHTML=`<div class="modal-backdrop"><div class="modal-card"><span class="eyebrow">병력 부족</span><h2>해제할 영토를 선택하세요</h2><p>부족 병력: <b>${Math.abs(p.troops)}</b></p><div class="release-list">${p.ownedTerritoryIds.map(id=>{const t=state.territories[id];return `<button data-release="${id}"><span>${t.name} · Lv.${t.level}</span><b>해제</b></button>`}).join('')}</div></div></div>`;
  root.onclick=e=>{const id=e.target.closest('[data-release]')?.dataset.release;if(!id)return;releaseTerritory(state,p.id,id);if(p.troops<0&&p.ownedTerritoryIds.length)return openRelease();root.innerHTML='';if(p.troops<0)p.isEliminated=true;maybeOfferTrait();};
}
function maybeOfferTrait(){
  const p=current(); if(p.level>p.acquiredTraitIds.length+1) return openTraits(); endTurn();
}
function openTraits(previous=[]){
  const p=current(),offer=generateTraitOffer(state,p.id), ids=previous.length?rerollTraitOffer(state,previous,offer.options.length):offer.options.map(t=>t.id), options=ids.map(id=>state.sharedTraitPool.includes(id)?id:null).filter(Boolean),root=document.getElementById('modal-root');
  root.innerHTML=`<div class="modal-backdrop"><div class="modal-card trait-modal"><span class="eyebrow">레벨업 보상</span><h2>새로운 특성을 선택하세요</h2><p>선택한 특성은 공유 목록에서 사라져 다른 플레이어가 선택할 수 없습니다.</p><div class="trait-grid">${options.map(id=>{const def=TRAITS.find(t=>t.id===id);return `<button data-trait="${id}"><b>${def?.name??id}</b><small>${def?.text??'왕국에 단 하나뿐인 특성'}</small></button>`}).join('')}</div>${offer.rerollCount&&!previous.length?'<button data-reroll class="secondary">↻ 한 번 다시 뽑기</button>':''}</div></div>`;
  root.onclick=e=>{if(e.target.closest('[data-reroll]'))return openTraits(options);const id=e.target.closest('[data-trait]')?.dataset.trait;if(!id)return;acquireTrait(state,p.id,id);state.actionLog.push({type:'TRAIT',playerId:p.id,traitId:id});root.innerHTML='';endTurn();};
}
function gateChoice(){
  const gates=state.board.map((t,i)=>({...t,index:i})).filter(t=>t.type==='GATE'&&t.index!==current().position),root=document.getElementById('modal-root');root.innerHTML=`<div class="modal-backdrop"><div class="modal-card"><span class="eyebrow">빛나는 관문</span><h2>목적지를 선택하세요</h2><div class="gate-list">${gates.map(g=>`<button data-gate="${g.index}">🌀 ${g.name}<small>${g.line}라인</small></button>`).join('')}</div></div></div>`;root.onclick=e=>{const idx=e.target.closest('[data-gate]')?.dataset.gate;if(idx==null)return;current().position=+idx;state.actionLog.push({type:'GATE_TRAVEL',playerId:current().id});root.innerHTML='';endTurn();};
}
document.addEventListener('click',e=>{
  if(e.target.closest('#roll-dice'))rollDice();
  const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
  if(['monster','upgrade','conquest'].includes(action))openDecision(action);else if(action==='gate')gateChoice();else if(action==='council'){current().pendingWarCouncil=true;endTurn();}else if(action==='prison'){const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);current().isInPrison=a!==b;endTurn();}else endTurn();
});
document.getElementById('new-game').addEventListener('click',newGame);
document.getElementById('log-toggle').addEventListener('click',()=>document.getElementById('log-panel').classList.toggle('open'));
render(state,ui);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');
