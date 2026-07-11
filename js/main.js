import { createInitialGameState } from './game/state/create-state.js';
import { dispatchGameAction } from './game/state/reducer.js';
import { payPassageDamage } from './game/rules/passage.js?v=0.2.1';
import { releaseTerritory } from './game/rules/release.js';
import { generateTraitOffer, acquireTrait, rerollTraitOffer } from './game/rules/traits.js';
import { TRAITS } from './game/config/traits.js';
import { chooseAutoAction } from './game/ai/policy.js';
import { render, renderActionPanel, territoryPreview, modalMarkup, tileAtPlayer, currentTerritory } from './ui.js?v=0.3.0';
import './devtools.js';

let state=createInitialGameState({playerNames:['기사','장군','레인저','영주']});
let ui={phase:'ROLL',dice:null,rolling:false};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const current=()=>state.players.find(p=>p.id===state.currentPlayerId);

function newGame(configs){ state=createInitialGameState({playerConfigs:configs,seed:Date.now()}); ui={phase:'ROLL'}; render(state,ui); scheduleAiTurn(); }
function endTurn(){
  if(current()?.pendingTraitChoice&&current()?.controlType!=='AI'&&state.sharedTraitPool.length)return openTraits();
  if(current()?.pendingTraitChoice&&!state.sharedTraitPool.length)current().pendingTraitChoice=false;
  dispatchGameAction(state,{type:'END_TURN'}); ui={phase:'ROLL',dice:null}; render(state,ui);
  scheduleAiTurn();
}
async function rollDice(auto=false){
  if(ui.phase!=='ROLL'||state.phase==='GAME_OVER'||(!auto&&current()?.controlType==='AI')) return;
  ui.rolling=true; renderActionPanel(state,ui);
  for(let i=0;i<8;i++){ui.dice=[1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)];renderActionPanel(state,ui);await wait(70+i*12);}
  ui.rolling=false; const steps=ui.dice[0]+ui.dice[1];
  state.actionLog.push({type:'ROLL_MOVE',playerId:current().id,dice:[...ui.dice],steps});
  await animateMove(steps,auto);
}
async function animateMove(steps,auto=false){
  ui={phase:'MOVING',remaining:steps}; render(state,ui);
  for(let i=0;i<steps;i++){
    dispatchGameAction(state,{type:'ROLL_MOVE',playerId:current().id,steps:1,endTurn:false});
    ui.remaining=steps-i-1; render(state,ui); await wait(230);
    if(state.phase==='GAME_OVER') return render(state,ui);
  }
  resolveArrival(auto);
}
function resolveArrival(auto=false){
  const p=current(), tile=tileAtPlayer(state), t=currentTerritory(state);
  let passageReceipt='';
  if(tile.type==='TERRITORY'&&t?.ownerId&&t.ownerId!==p.id){
    const payment=payPassageDamage(state,p.id,t.id),owner=state.players.find(candidate=>candidate.id===payment.ownerId);
    p.lastPassagePayment={territoryId:t.id,...payment};
    passageReceipt=`<div class="passage-receipt"><span>통행 병력 지불</span><b>-${payment.amount}</b><small>${owner?.name??'소유자'} +${payment.amount} · 내 잔여 ${p.troops}</small></div>`;
  }
  let actions='';
  if(tile.type==='TERRITORY'&&!t.ownerId) actions='<button data-action="monster" class="primary">👹 몬스터 공격</button><button data-action="skip" class="secondary">지나가기</button>';
  else if(tile.type==='TERRITORY'&&t.ownerId===p.id&&t.level<3) actions='<button data-action="upgrade" class="primary">🏰 영토 발전</button><button data-action="skip" class="secondary">지나가기</button>';
  else if(tile.type==='TERRITORY'&&t.ownerId!==p.id) actions='<button data-action="conquest" class="primary">⚔ 영토 침공</button><button data-action="skip" class="secondary">통행만 하기</button>';
  else if(tile.type==='GATE') actions='<button data-action="gate" class="primary">🌀 관문 선택</button><button data-action="skip" class="secondary">머무르기</button>';
  else if(tile.type==='PRISON') actions='<button data-action="prison" class="primary">🎲 탈출 시도</button>';
  else if(tile.type==='WAR_COUNCIL') actions='<button data-action="council" class="primary">⚔ 전쟁회의 참가</button>';
  else actions='<button data-action="skip" class="primary">턴 마치기</button>';
  ui={phase:'ARRIVAL',actions:passageReceipt+actions}; render(state,ui);
  if(auto)setTimeout(()=>resolveAiArrival(tile,t),450);
}
function resolveAiArrival(tile,t){
  const p=current();
  if(tile.type==='TERRITORY'){
    const action=chooseAutoAction(state,p.id,Math.random);
    if(action.type!=='ROLL_MOVE')dispatchGameAction(state,{...action,endTurn:false});
  }else if(tile.type==='WAR_COUNCIL')p.pendingWarCouncil=true;
  else if(tile.type==='GATE'){
    const target=state.board.findIndex((candidate,index)=>candidate.type==='GATE'&&index!==p.position);
    if(target>=0){p.position=target;state.actionLog.push({type:'GATE_TRAVEL',playerId:p.id});}
  }else if(tile.type==='PRISON'){
    const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);p.isInPrison=a!==b;
  }
  if(p.pendingTraitChoice&&state.sharedTraitPool.length){const offer=generateTraitOffer(state,p.id);const trait=offer.options[0];if(trait){acquireTrait(state,p.id,trait.id);p.pendingTraitChoice=false;state.actionLog.push({type:'TRAIT',playerId:p.id,traitId:trait.id});}}else if(p.pendingTraitChoice)p.pendingTraitChoice=false;
  render(state,ui);setTimeout(endTurn,450);
}
function scheduleAiTurn(){
  if(state.phase==='GAME_OVER'||current()?.controlType!=='AI')return;
  ui={phase:'ROLL',dice:null};render(state,ui);setTimeout(()=>rollDice(true),650);
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
  const p=current(); if(p.pendingTraitChoice&&state.sharedTraitPool.length) return openTraits(); p.pendingTraitChoice=false;endTurn();
}
function openTraits(previous=[]){
  const p=current(),offer=generateTraitOffer(state,p.id), ids=previous.length?rerollTraitOffer(state,previous,offer.options.length):offer.options.map(t=>t.id), options=ids.map(id=>state.sharedTraitPool.includes(id)?id:null).filter(Boolean),root=document.getElementById('modal-root');
  if(!options.length){p.pendingTraitChoice=false;root.innerHTML='';endTurn();return;}
  root.innerHTML=`<div class="modal-backdrop"><div class="modal-card trait-modal"><span class="eyebrow">레벨업 보상</span><h2>새로운 특성을 선택하세요</h2><p>특성은 영토 업그레이드가 아니라 왕도 완주 레벨업 보상입니다. 선택한 특성은 다른 플레이어의 목록에서 사라집니다.</p><div class="trait-grid">${options.map(id=>{const def=TRAITS.find(t=>t.id===id);return `<button data-trait="${id}"><b>${def?.name??id}</b><small>${def?.text??'왕국에 단 하나뿐인 특성'}</small></button>`}).join('')}</div>${offer.rerollCount&&!previous.length?'<button data-reroll class="secondary">↻ 한 번 다시 뽑기</button>':''}</div></div>`;
  root.onclick=e=>{if(e.target.closest('[data-reroll]'))return openTraits(options);const id=e.target.closest('[data-trait]')?.dataset.trait;if(!id)return;if(acquireTrait(state,p.id,id)){p.pendingTraitChoice=false;state.actionLog.push({type:'TRAIT',playerId:p.id,traitId:id});}root.onclick=null;root.innerHTML='';endTurn();};
}
function gateChoice(){
  const gates=state.board.map((t,i)=>({...t,index:i})).filter(t=>t.type==='GATE'&&t.index!==current().position),root=document.getElementById('modal-root');root.innerHTML=`<div class="modal-backdrop"><div class="modal-card"><span class="eyebrow">빛나는 관문</span><h2>목적지를 선택하세요</h2><div class="gate-list">${gates.map(g=>`<button data-gate="${g.index}">🌀 ${g.name}<small>${g.line}라인</small></button>`).join('')}</div></div></div>`;root.onclick=e=>{const idx=e.target.closest('[data-gate]')?.dataset.gate;if(idx==null)return;current().position=+idx;state.actionLog.push({type:'GATE_TRAVEL',playerId:current().id});root.innerHTML='';endTurn();};
}
document.addEventListener('click',e=>{
  if(e.target.closest('#roll-dice'))rollDice();
  const action=e.target.closest('[data-action]')?.dataset.action;if(!action)return;
  if(current()?.controlType==='AI')return;
  if(['monster','upgrade','conquest'].includes(action))openDecision(action);else if(action==='gate')gateChoice();else if(action==='council'){current().pendingWarCouncil=true;endTurn();}else if(action==='prison'){const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6);current().isInPrison=a!==b;endTurn();}else endTurn();
});
const setupNames=['기사','장군','레인저','영주'];
function renderPlayerSetup(){
  const count=Number(document.getElementById('player-count').value),root=document.getElementById('player-setup');
  const previous=[...root.querySelectorAll('.setup-player')].map(row=>({name:row.querySelector('input')?.value,type:row.querySelector('select')?.value}));
  root.innerHTML=Array.from({length:count},(_,i)=>`<div class="setup-player" style="--slot:${i}"><span class="setup-avatar">${i+1}</span><input maxlength="12" value="${previous[i]?.name??setupNames[i]}" aria-label="${i+1}번 플레이어 이름"><select aria-label="${i+1}번 플레이어 종류"><option value="LOCAL" ${previous[i]?.type==='LOCAL'||(!previous[i]&&i===0)?'selected':''}>👤 사람 (로컬)</option><option value="AI" ${previous[i]?.type==='AI'||(!previous[i]&&i>0)?'selected':''}>🤖 AI</option><option value="ONLINE" ${previous[i]?.type==='ONLINE'?'selected':''}>🌐 사람 (온라인)</option></select></div>`).join('');
  const hints={2:'시작 병력 84 · 통행/정복 비용 1.35배',3:'시작 병력 72 · 통행/정복 비용 1.15배',4:'시작 병력 60 · 기본 통행/정복 비용'};document.getElementById('balance-hint').textContent=`⚖ ${count}인 보정: ${hints[count]}`;
}
document.getElementById('player-count').addEventListener('change',renderPlayerSetup);
document.getElementById('start-game').addEventListener('click',()=>{
  const configs=[...document.querySelectorAll('.setup-player')].map((row,i)=>({name:row.querySelector('input').value.trim()||setupNames[i],controlType:row.querySelector('select').value}));
  document.getElementById('title-screen').classList.add('hidden');newGame(configs);
});
document.getElementById('new-game').addEventListener('click',()=>document.getElementById('title-screen').classList.remove('hidden'));
document.getElementById('log-toggle').addEventListener('click',()=>document.getElementById('log-panel').classList.toggle('open'));
renderPlayerSetup();render(state,ui);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');
