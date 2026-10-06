/** Separate, local, session-only flashcards. No SRS, due dates, export, network or semantic grading. */
import {unitText,tokensForRange} from './model.mjs';
import {resolveUnitTarget} from './pronunciation.mjs';
export const FLASHCARD_NAMESPACE='lingourmet:pilot:flashcards:v1';
export const FLASHCARD_LABELS={
 'zh-Hant':{title:'翻卡練習',recognition:'看原文，想意思',production:'看意思，想原句',listening:'聽原句，想意思',cloze:'填空回想',clozeUnavailable:'這課沒有已指定的填空範圍。',reveal:'翻面看答案',again:'再練',remembered:'記得',end:'結束本輪',restart:'再翻一輪',choose:'選擇翻卡方式',done:'本輪翻卡完成',progress:'已記得／總卡數',remaining:'待回想',front:'先回想，再翻面核對。',listen:'播放原句',play:'播放',answer:'答案',material:'查看教材',back:'回到翻卡',saveError:'這次翻卡還沒存好。重試儲存後再繼續。',retrySave:'重試儲存',readError:'翻卡記錄無法讀取，原記錄已保留。',missing:'這個教學語言尚無對應內容。',empty:'沒有可用的翻卡。',roundOnly:'這是本輪自評，不代表長期熟練。',audioUnavailable:'裝置沒有可用的本機日語語音。'},
 en:{title:'Flashcard practice',recognition:'Read the source, recall the meaning',production:'Read the meaning, recall the source',listening:'Listen, recall the meaning',cloze:'Cloze recall',clozeUnavailable:'This lesson has no assigned cloze ranges.',reveal:'Reveal answer',again:'Again',remembered:'Remembered',end:'End this round',restart:'Another round',choose:'Choose a card mode',done:'Flashcard round complete',progress:'Remembered / total cards',remaining:'Still to recall',front:'Recall first, then reveal to check.',listen:'Play source sentence',play:'Play',answer:'Answer',material:'View material',back:'Back to cards',saveError:'This card has not been saved. Retry saving before continuing.',retrySave:'Retry saving',readError:'The flashcard record could not be read. The original record has been kept.',missing:'Content is not available in this teaching language.',empty:'No cards are available.',roundOnly:'This is a self-assessment for this round, not a measure of long-term mastery.',audioUnavailable:'No local Japanese voice is available on this device.'},
 ja:{title:'フラッシュカード練習',recognition:'原文を見て意味を思い出す',production:'意味を見て原文を思い出す',listening:'原文を聞いて意味を思い出す',cloze:'穴埋めで思い出す',clozeUnavailable:'この課には穴埋めの範囲が指定されていません。',reveal:'答えを見る',again:'もう一度',remembered:'思い出せた',end:'このラウンドを終える',restart:'もう一周',choose:'カードの種類を選ぶ',done:'今回のカード練習は完了です',progress:'思い出せた数／カード数',remaining:'残りのカード',front:'まず思い出してから、答えを確認しましょう。',listen:'原文を再生',play:'再生',answer:'答え',material:'教材を見る',back:'カードに戻る',saveError:'このカードを保存できませんでした。もう一度保存してから進みましょう。',retrySave:'もう一度保存',readError:'カードの記録を読み込めませんでした。元の記録は残っています。',missing:'この学習言語の内容はまだありません。',empty:'使えるカードがありません。',roundOnly:'今回の自己評価です。長期的な習熟度を示すものではありません。',audioUnavailable:'この端末ではローカルの日本語音声を利用できません。'}
};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
export function buildFlashcardDeck(lesson,{clozeRefs=[]}={}){
 const sourceIds=[...new Set((lesson.sourceOrder??[]).flatMap(id=>{const source=lesson.sources?.[id];return (source?.turns??source?.paragraphs??[]).flatMap(x=>x.unitRefs??[]);} ))];
 const cards=[];
 for(const unit of sourceIds){if(!lesson.units?.[unit]||!Object.values(lesson.localizations??{}).some(x=>typeof x.units?.[unit]?.meaning==='string'&&x.units[unit].meaning.trim()))continue;
  for(const template of ['recognition','production','listening'])cards.push({id:`flash:${template}:${unit}`,template,unit,sourceRefs:[{unit}],signature:JSON.stringify({template,unit,tokens:lesson.units[unit].tokens})});
 }
 // An explicit authored range is necessary; do not fabricate cloze cards to fill a template menu.
 for(const ref of clozeRefs){if(!sourceIds.includes(ref.unit)||typeof ref.from!=='string'||typeof ref.to!=='string')throw new Error('Cloze range must reference an existing source unit');const tokens=lesson.units[ref.unit].tokens,from=tokens.findIndex(x=>x.id===ref.from),to=tokens.findIndex(x=>x.id===ref.to);if(from<0||to<from||from===0&&to===tokens.length-1)throw new Error('Invalid or whole-sentence cloze range');
  if(!tokensForRange(lesson.units[ref.unit],ref.from,ref.to).length)throw new Error('Empty cloze');
  const id=`flash:cloze:${ref.unit}:${ref.from}:${ref.to}`;if(cards.some(x=>x.id===id))throw new Error('Duplicate cloze identity');cards.push({id,template:'cloze',unit:ref.unit,from:ref.from,to:ref.to,sourceRefs:[{unit:ref.unit}],signature:JSON.stringify({template:'cloze',...ref,tokens})});
 }
 return cards;
}
export function flashcardKey(lessonId,version){if(!lessonId||!version)throw new Error('Explicit flashcard lesson identity/version required');return `${FLASHCARD_NAMESPACE}:${encodeURIComponent(lessonId)}:${encodeURIComponent(version)}`;}
export function currentFlashcardId(state){return state.queue[0]??null;}
export function flashcardVisitToken(state){return `${state.sessionId}:${state.round}:${state.visit}:${currentFlashcardId(state)}`;}
export function getFlashcardAudioAccess(state){return {revealedPracticeIds:state.phase==='revealed'?[currentFlashcardId(state)]:[]};}
export function createFlashcardState({cards,lessonId,version,locale='zh-Hant',uiLocale=locale,sessionId='session-1'}){
 flashcardKey(lessonId,version);if(new Set(cards.map(x=>x.id)).size!==cards.length)throw new Error('Duplicate card identity');
 return {schemaVersion:1,lessonId,version,deckSignatures:Object.fromEntries(cards.map(c=>[c.id,c.signature])),templates:Object.fromEntries(cards.map(c=>[c.id,c.template])),locale,uiLocale,sessionId,round:0,visit:0,phase:'ready',template:null,queue:[],roundIds:[],remembered:[],history:[],error:null,pending:null};
}
export function reduceFlashcard(state,event){
 if(event.type==='locale')return {...state,locale:event.locale??state.locale,uiLocale:event.uiLocale??state.uiLocale};
 if(state.pending)return state;
 if(event.token&&event.token!==flashcardVisitToken(state))return state;
 if(event.type==='start'&&['ready','complete','ended'].includes(state.phase)){
  const template=event.template??state.template,ids=Object.keys(state.templates).filter(id=>state.templates[id]===template);if(!ids.length)return state;
  return {...state,template,round:state.round+1,visit:state.visit+1,queue:ids,roundIds:ids,remembered:[],phase:'recall',error:null};
 }
 if(event.type==='choose'&&['complete','ended'].includes(state.phase))return {...state,phase:'ready'};
 if(event.type==='return'&&state.phase==='material')return {...state,phase:state.returnPhase??'recall',returnPhase:undefined};
 if(!['recall','revealed'].includes(state.phase))return state;
 if(event.type==='end')return {...state,phase:'ended'};
 if(event.type==='material')return {...state,returnPhase:state.phase,phase:'material'};
 if(event.type==='reveal'&&state.phase==='recall')return {...state,phase:'revealed'};
 if(event.type!=='rate'||state.phase!=='revealed'||!['again','remembered'].includes(event.rating))return state;
 const id=currentFlashcardId(state),attemptId=flashcardVisitToken(state);if(state.history.some(x=>x.attemptId===attemptId))return state;
 const [current,...queue]=state.queue,remembered=[...state.remembered];
 if(event.rating==='again')queue.splice(Math.min(2,queue.length),0,current);else remembered.push(current);
 const entry={kind:'flashcard',attemptId,cardId:id,template:state.template,lessonId:state.lessonId,version:state.version,round:state.round,rating:event.rating,at:event.at??null};
 return {...state,queue,remembered,history:[...state.history,entry],visit:state.visit+1,phase:queue.length?'recall':'complete',error:null};
}
function validateSaved(saved,fresh){
 if(saved.schemaVersion!==1||saved.lessonId!==fresh.lessonId||saved.version!==fresh.version||JSON.stringify(saved.deckSignatures)!==JSON.stringify(fresh.deckSignatures)||!['ready','recall','revealed','material','complete','ended'].includes(saved.phase)||!Array.isArray(saved.history)||!Number.isSafeInteger(saved.round)||saved.round<0||!Number.isSafeInteger(saved.visit)||saved.visit<0)throw new Error('Invalid flashcard record');
 for(const key of ['queue','roundIds','remembered'])if(!Array.isArray(saved[key])||new Set(saved[key]).size!==saved[key].length||saved[key].some(id=>!Object.hasOwn(fresh.deckSignatures,id)))throw new Error('Invalid flashcard queue');
 if(saved.queue.some(id=>saved.remembered.includes(id))||[...saved.queue,...saved.remembered].some(id=>!saved.roundIds.includes(id))||saved.queue.length+saved.remembered.length!==saved.roundIds.length)throw new Error('Invalid flashcard partition');
 if(saved.round>0&&JSON.stringify(saved.roundIds)!==JSON.stringify(Object.keys(fresh.templates).filter(id=>fresh.templates[id]===saved.template)))throw new Error('Invalid template round');
 if(typeof saved.sessionId!=='string'||!saved.sessionId)throw new Error('Invalid session identity');
 if(['recall','revealed','material'].includes(saved.phase)&&!saved.queue.length)throw new Error('Missing current card');
 if(saved.history.some(e=>e?.kind!=='flashcard'||!Object.hasOwn(fresh.deckSignatures,e.cardId)||!['again','remembered'].includes(e.rating)||typeof e.attemptId!=='string')||new Set(saved.history.map(x=>x.attemptId)).size!==saved.history.length)throw new Error('Invalid flashcard history');
}
export function createFlashcardController({cards,lessonId,version,storage,locale='zh-Hant',uiLocale=locale,sessionId,now=()=>new Date().toISOString()}){
 const key=flashcardKey(lessonId,version);let state=createFlashcardState({cards,lessonId,version,locale,uiLocale,sessionId:sessionId??globalThis.crypto?.randomUUID?.()??`session-${Date.now()}-${Math.random().toString(36).slice(2)}`}),blocked=false;
 try{const raw=storage?.getItem(key);if(raw){const saved=JSON.parse(raw);validateSaved(saved,state);state={...saved,templates:state.templates,locale,uiLocale,error:null,pending:null};if(state.phase==='material')state={...state,phase:state.returnPhase??'recall',returnPhase:undefined};}}catch{blocked=true;state={...state,error:'read'};}
 const listeners=new Set();const notify=event=>{for(const fn of [...listeners])fn(state,event);};
 function save(candidate){if(blocked||!storage?.setItem)throw new Error('Storage unavailable');storage.setItem(key,JSON.stringify({...candidate,error:null,pending:null}));}
 function dispatch(event){
  if(blocked&&event.type!=='locale')return state;
  if(event.type==='retry-save'){if(!state.pending)return state;event={...state.pending,retrying:true};}
  const input=event.retrying?{...state,pending:null,error:null}:state,nextEvent={...event,at:event.at??now()},next=reduceFlashcard(input,nextEvent);if(next===input)return state;
  if(event.type==='locale'){state=next;notify(event);return state;}
  try{save(next);state=next;}catch{state={...state,error:'save',pending:{...nextEvent,retrying:undefined}};}
  notify(event);return state;
 }
 return {get state(){return state;},key,dispatch,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},get canPersist(){return !blocked&&!!storage?.setItem;}};
}
export function flashcardView(card,lesson,locale){
 const unit=lesson.units[card.unit],meaning=lesson.localizations?.[locale]?.units?.[card.unit]?.meaning;
 if(typeof meaning!=='string'||!meaning.trim())return {available:false};
 const text=unitText(unit);let masked=null;if(card.template==='cloze'){const from=unit.tokens.findIndex(x=>x.id===card.from),to=unit.tokens.findIndex(x=>x.id===card.to);masked=unit.tokens.slice(0,from).map(x=>x.text).join('')+'［…］'+unit.tokens.slice(to+1).map(x=>x.text).join('');}
 return {available:true,text,meaning,masked};
}
export function flashcardAudioTarget(card,lesson,side){
 if(side==='front'&&!['listening','recognition'].includes(card.template))return null;
 if(!['front','back'].includes(side))return null;
 return resolveUnitTarget(lesson,{unit:card.unit,kind:'sentence'},side==='back'?{gate:{practiceId:card.id,phase:'answer'}}:{});
}
export function renderFlashcardSession(state,cards,lesson,{audioAvailable=false,renderTarget=(text)=>escape(text),renderMeaning=(text)=>escape(text)}={}){
 const u=FLASHCARD_LABELS[state.uiLocale]??FLASHCARD_LABELS.en,card=cards.find(c=>c.id===currentFlashcardId(state)),disabled=!!state.pending||state.error==='read';
 const button=(action,label,{off=false,template}={})=>`<button type="button" data-flash-action="${action}"${template?` data-flash-template="${template}"`:''}${disabled||off?' disabled':''}>${escape(label)}</button>`;
 const error=state.error?`<p role="alert">${escape(state.error==='read'?u.readError:u.saveError)}</p>${state.error==='save'?`<button type="button" data-flash-action="retry-save">${escape(u.retrySave)}</button>`:''}`:'';
 if(state.phase==='ready'){const templates=[...new Set(cards.map(c=>c.template))];return `<section class="flashcard-session" data-flash-phase="ready"><h2>${escape(u.title)}</h2>${error}${templates.map(template=>button('start',u[template],{template})).join(' ')}${!cards.length?`<p>${escape(u.empty)}</p>`:''}</section>`;}
 if(['complete','ended'].includes(state.phase))return `<section class="flashcard-session" data-flash-phase="${state.phase}"><h2 data-flash-focus tabindex="-1">${escape(state.phase==='complete'?u.done:u.end)}</h2><p>${escape(u.progress)}: ${state.remembered.length} / ${state.roundIds.length}</p><p>${escape(u.remaining)}: ${state.queue.length}</p>${error}${button('start',u.restart,{template:state.template})} ${button('choose',u.choose)}</section>`;
 if(state.phase==='material')return `<section class="flashcard-session" data-flash-phase="material">${error}${button('return',u.back)}</section>`;
 if(!card)return '';const view=flashcardView(card,lesson,state.locale);
 if(!view.available)return `<section class="flashcard-session" data-flash-phase="${state.phase}"><p role="status">${escape(u.missing)}</p>${error}</section>`;
 const ref={unit:card.unit,kind:'sentence'},token=flashcardVisitToken(state);
 const play=side=>button('play-'+side,side==='front'?u.listen:u.play,{off:!audioAvailable});
 const front=card.template==='recognition'?renderTarget(view.text,ref,{side:'front'}):card.template==='production'?renderMeaning(view.meaning,['localizations',state.locale,'units',card.unit,'meaning']):card.template==='listening'?play('front'):escape(view.masked);
 const back=state.phase==='revealed'?`<div class="flashcard-back"><h3>${escape(u.answer)}</h3><div>${renderTarget(view.text,ref,{side:'back',gate:{practiceId:card.id,phase:'answer'}})}</div><p>${renderMeaning(view.meaning,['localizations',state.locale,'units',card.unit,'meaning'],{gate:{practiceId:card.id,phase:'answer'}})}</p>${play('back')}<div>${button('again',u.again)} ${button('remembered',u.remembered)}</div></div>`:button('reveal',u.reveal);
 return `<section class="flashcard-session" data-flash-phase="${state.phase}" data-flash-token="${escape(token)}"><h2 data-flash-focus tabindex="-1">${escape(u[state.template])}</h2><p>${escape(u.progress)}: ${state.remembered.length} / ${state.roundIds.length}</p>${state.phase==='revealed'?'':`<div class="flashcard-front">${front}</div>`}${back}<p data-flash-audio-unavailable${audioAvailable?' hidden':''}>${escape(u.audioUnavailable)}</p>${error}${button('material',u.material)} ${button('end',u.end)}</section>`;
}
export function bindFlashcardSession(root,controller,{cards,lesson,onChange=()=>{},onPlay=()=>{},onViewMaterial=()=>{}}={}){
 const unsub=controller.subscribe((state,event)=>onChange(state,event));
 const click=event=>{
  if(event.detail>1)return;const el=event.target.closest?.('[data-flash-action]');if(!el||!root.contains(el)||el.disabled)return;
  const action=el.dataset.flashAction,state=controller.state,token=el.closest?.('[data-flash-token]')?.dataset.flashToken??flashcardVisitToken(state),card=cards.find(c=>c.id===currentFlashcardId(state));
  if(token!==flashcardVisitToken(state))return;
  if(action.startsWith('play-')){if(event.isTrusted!==true||!card||!['recall','revealed'].includes(state.phase)||state.pending)return;const side=action.slice(5);if(side==='back'&&state.phase!=='revealed')return;const target=flashcardAudioTarget(card,lesson,side);if(target)onPlay(target);return;}
  if(action==='material'){controller.dispatch({type:'material',token});if(controller.state.phase==='material'&&card)onViewMaterial({cardId:card.id,sourceRefs:clone(card.sourceRefs),returnToCards:()=>controller.dispatch({type:'return'})});return;}
  controller.dispatch(['again','remembered'].includes(action)?{type:'rate',rating:action,token}:{type:action,template:el.dataset.flashTemplate,token});
 };
 root.addEventListener('click',click);return()=>{unsub();root.removeEventListener('click',click);};
}
