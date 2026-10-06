import {assemblySpec,validAssemblyOrder,changeAssembly,assemblyResult,renderAssembly} from './sentence-assembly.mjs';
/** One-question recall session. No grading, SRS, recording, or network access. */
export const STORAGE_NAMESPACE = 'lingourmet:pilot:practice-session:v1';
export const PRACTICE_LABELS = {
 'zh-Hant': {start:'開始練習',reveal:'看答案與說明',remembered:'想起來了',retry:'還沒想起來',previous:'上一題',skip:'略過',material:'查看教材',back:'回到練習',again:'再練一次',done:'這次練習完成了',answer:'答案與示範',draft:'你的回答',play:'播放',progress:'題',saveError:'這次回答還沒存好。請重試，存好後再繼續。',saveAgain:'重試儲存',history:'已保存的自評',summary:'想起來了／還沒想起來／略過',unavailable:'練習記錄無法讀取，原記錄已保留。',empty:'目前沒有練習題。'},
 en:{start:'Start practice',reveal:'Show answer and explanation',remembered:'I recalled it',retry:'Not yet',previous:'Previous',skip:'Skip',material:'View material',back:'Back to practice',again:'Practice again',done:'Practice complete',answer:'Answer and examples',draft:'Your response',play:'Play',progress:'Question',saveError:'Your response hasn’t been saved yet. Retry to save it and continue.',saveAgain:'Retry saving',history:'Saved self-checks',summary:'Recalled / Not yet / Skipped',unavailable:'Practice history could not be read. The original record has been kept.',empty:'No practice questions yet.'},
 ja:{start:'練習を始める',reveal:'答えと解説を見る',remembered:'思い出せた',retry:'まだ思い出せない',previous:'前の問題',skip:'スキップ',material:'教材を見る',back:'練習に戻る',again:'もう一度練習する',done:'今回の練習は終わりです',answer:'答えと例',draft:'あなたの答え',play:'再生',progress:'問題',saveError:'回答をまだ保存できていません。もう一度保存してから進みましょう。',saveAgain:'もう一度保存',history:'保存した自己評価',summary:'思い出せた／まだ／スキップ',unavailable:'練習記録を読み込めませんでした。元の記録は残っています。',empty:'練習問題はまだありません。'}
};
const localized=(value,locale)=>typeof value==='string'?value:value?.[locale]??'';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=value=>JSON.parse(JSON.stringify(value));
export function practiceAnswerText(item,locale){const option=item.responseType==='choice'?(item.options??[]).find(o=>o.id===item.answer):null;return option?localized(option.text,locale):localized(item.answer,locale);}
export function practiceStorageKey(lessonId,practiceVersion){
 if(!lessonId||!practiceVersion)throw new Error('An explicit pilot lessonId and practiceVersion are required');
 return `${STORAGE_NAMESPACE}:${encodeURIComponent(lessonId)}:${encodeURIComponent(practiceVersion)}`;
}
/** A content signature, never an identity: excludes localized display strings. */
export function answerSignature(item){
 return JSON.stringify({answer:item.answer??null,answerOptionId:item.answerOptionId??null,order:item.machineAnswerTokenOrder??null,models:Object.entries(item.modelAnswers??{}).sort(([a],[b])=>a.localeCompare(b)),optionIds:(item.options??[]).map(o=>o.id)});
}
export function createPracticeState({lessonId,practiceVersion,items,locale='zh-Hant',uiLocale=locale,sessionId='session-1'}){
 practiceStorageKey(lessonId,practiceVersion);
 if(new Set(items.map(i=>i.id)).size!==items.length||items.some(i=>!i.id))throw new Error('Unique stable item IDs are required');
 return {schemaVersion:1,lessonId,practiceVersion,itemIds:items.map(i=>i.id),signatures:Object.fromEntries(items.map(i=>[i.id,answerSignature(i)])),assemblySpecs:Object.fromEntries(items.map(i=>[i.id,assemblySpec(i)]).filter(([,spec])=>spec)),orderingHistory:[],locale,uiLocale,sessionId,round:1,index:0,visit:0,phase:'ready',revealed:false,drafts:{},history:[],error:null,pending:null};
}
export function currentItemId(state){return state.itemIds[state.index]??null;}
export function getPracticeAudioAccess(state){return {revealedPracticeIds:state.phase==='revealed'&&state.revealed?[currentItemId(state)]:[]};}
export function visitToken(state){return `${state.sessionId}:${state.round}:${state.visit}:${currentItemId(state)}`;}
export function practiceSummary(state){
 const entries=state.history.filter(e=>e.sessionId===state.sessionId&&e.round===state.round);
 return {remembered:entries.filter(e=>e.rating==='remembered').length,retry:entries.filter(e=>e.rating==='retry').length,skipped:entries.filter(e=>e.rating==='skipped').length,total:entries.length};
}
const nextQuestion=state=>({...state,index:state.index+1,visit:state.visit+1,revealed:false,phase:state.index+1>=state.itemIds.length?'complete':'recall'});
/** Pure reducer. Controller is responsible for committing history atomically. */
export function reducePractice(state,event){
 if(event.type==='locale')return {...state,locale:event.locale??state.locale,uiLocale:event.uiLocale??state.uiLocale};
 if(event.type==='start'&&state.phase==='ready')return {...state,phase:state.itemIds.length?'recall':'complete',revealed:false};
 if(event.type==='restart'&&state.phase==='complete')return {...state,round:state.round+1,index:0,visit:state.visit+1,phase:state.itemIds.length?'recall':'complete',revealed:false,drafts:{},pending:null,error:null};
 if(event.type==='return'&&state.phase==='material')return {...state,phase:state.returnPhase??'recall',returnPhase:undefined};
 if(!['recall','revealed'].includes(state.phase))return state;
 if(event.token&&event.token!==visitToken(state))return state;
 if(state.pending&&!['retry-save'].includes(event.type))return state;
 const id=currentItemId(state),spec=state.assemblySpecs?.[id];
 if(event.type.startsWith('assembly-')){
  if(!spec||state.phase!=='recall'||state.revealed)return state;
  const draft=state.drafts[id]??{};
  if(event.type==='assembly-check'){
   const result=assemblyResult(spec,draft.order??[]);if(result==='incomplete')return state;
   const attemptId=`${visitToken(state)}:order:${draft.assemblyRevision??0}`;
   if((state.orderingHistory??[]).some(e=>e.attemptId===attemptId))return state;
   const entry={attemptId,itemId:id,kind:'ordering',result,order:[...draft.order],at:event.at??null};
   return {...state,drafts:{...state.drafts,[id]:{...draft,assemblyResult:result}},orderingHistory:[...(state.orderingHistory??[]),entry]};
  }
  const next=changeAssembly(spec,draft,event.type,event.pieceId);return next===draft?state:{...state,drafts:{...state.drafts,[id]:next}};
 }
 if(event.type==='draft')return {...state,drafts:{...state.drafts,[id]:{...state.drafts[id],text:String(event.text)}}};
 if(event.type==='select')return {...state,drafts:{...state.drafts,[id]:{...state.drafts[id],optionId:event.optionId}}};
 if(event.type==='reveal'){
  const entry={attemptId:`${visitToken(state)}:order:reveal`,itemId:id,kind:'ordering',result:'revealed',order:[...(state.drafts[id]?.order??[])],at:event.at??null};
  return {...state,revealed:true,phase:'revealed',...(spec&&!state.revealed&&!state.orderingHistory?.some(e=>e.attemptId===entry.attemptId)?{orderingHistory:[...(state.orderingHistory??[]),entry]}:{})};
 }
 if(event.type==='material')return {...state,returnPhase:state.phase,phase:'material'};
 if(event.type==='previous'&&state.index>0)return {...state,index:state.index-1,visit:state.visit+1,revealed:false,phase:'recall'};
 if(event.type==='assess'&&(!state.revealed||!['remembered','retry'].includes(event.rating)))return state;
 if(event.type!=='assess'&&event.type!=='skip')return state;
 // A stale or repeated assessment must never append an event twice.
 const attemptId=visitToken(state);
 if(state.history.some(e=>e.attemptId===attemptId))return state;
 const entry={attemptId,lessonId:state.lessonId,practiceVersion:state.practiceVersion,itemId:id,answerSignature:state.signatures[id],sessionId:state.sessionId,round:state.round,rating:event.type==='skip'?'skipped':event.rating,response:clone(state.drafts[id]??{}),at:event.at??null};
 return nextQuestion({...state,history:[...state.history,entry],pending:null,error:null});
}
export function createPracticeController({lesson,lessonId,practiceVersion,storage,locale='zh-Hant',uiLocale=locale,sessionId,now=()=>new Date().toISOString()}){
 const items=lesson.practice?.items??[],key=practiceStorageKey(lessonId,practiceVersion);
 const id=sessionId??globalThis.crypto?.randomUUID?.()??`session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
 let state=createPracticeState({lessonId,practiceVersion,items,locale,uiLocale,sessionId:id}),blocked=false;
 try{
  const raw=storage?.getItem(key);
  if(raw){const saved=JSON.parse(raw);
   if(saved.schemaVersion!==1||saved.lessonId!==lessonId||saved.practiceVersion!==practiceVersion||!Array.isArray(saved.history)||!Array.isArray(saved.itemIds)||!Number.isInteger(saved.index)||saved.index<0||saved.index>items.length||!['ready','recall','revealed','material','complete'].includes(saved.phase)||JSON.stringify(saved.itemIds)!==JSON.stringify(state.itemIds)||JSON.stringify(saved.signatures)!==JSON.stringify(state.signatures))throw new Error('Incompatible saved session');
   for(const [itemId,spec] of Object.entries(state.assemblySpecs)){const order=saved.drafts?.[itemId]?.order;if(order!==undefined&&!validAssemblyOrder(spec,order))throw new Error('Invalid saved assembly');}
   if(saved.orderingHistory!==undefined&&!Array.isArray(saved.orderingHistory))throw new Error('Invalid ordering history');
   state={...state,...saved,assemblySpecs:state.assemblySpecs,orderingHistory:saved.orderingHistory??[],locale,uiLocale,error:null};
   // Material is rendered by the host; refresh always returns to the same question.
   if(state.phase==='material')state={...state,phase:state.returnPhase??'recall',returnPhase:undefined};
  }
 }catch{blocked=true;state={...state,error:'read'};}
 const listeners=new Set();
 function notify(event){for(const listener of [...listeners])listener(state,event);}
 function save(candidate){if(blocked||!storage?.setItem)throw new Error('Storage unavailable');storage.setItem(key,JSON.stringify({...candidate,error:null}));}
 function dispatch(event){
  if(event.type==='retry-save'){
   if(!state.pending){
    if(state.error!=='save')return state;
    try{save(state);state={...state,error:null};}catch{state={...state,error:'save'};}
    notify(event);return state;
   }
   const pending=state.pending;
   return dispatch({...pending,retrying:true});
  }
  if(event.type==='select'&&!(items.find(i=>i.id===currentItemId(state))?.options??[]).some(o=>o.id===event.optionId))return state;
  const eventWithTime={...event,at:event.at??now()};
  const input=event.retrying?{...state,pending:null,error:null}:state;
  const next=reducePractice(input,eventWithTime);
  if(next===input)return state;
  const committing=event.type==='assess'||event.type==='skip'||event.type==='assembly-check'||(event.type==='reveal'&&!!state.assemblySpecs?.[currentItemId(state)]);
  if(event.type==='locale'){state=next;notify(event);return state;}
  try{save(next);state=next;}
  catch{
   // Preserve the exact attempted rating, response and timestamp for retry.
   state=committing?{...state,error:blocked?'read':'save',pending:{...eventWithTime,retrying:undefined}}:{...next,error:blocked?'read':'save'};
  }
  notify(event);return state;
 }
 return {get state(){return state;},key,dispatch,subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},get canPersist(){return !blocked&&!!storage?.setItem;}};
}
export function renderPracticeSession(state,lesson,{answerTargets=[],renderField=(value)=>escape(value)}={}){
 const u=PRACTICE_LABELS[state.uiLocale]??PRACTICE_LABELS.en,items=lesson.practice?.items??[],item=items.find(i=>i.id===currentItemId(state));
 const button=(action,label,disabled=false,extra='')=>`<button type="button" data-practice-action="${action}"${disabled?' disabled':''} ${extra}>${escape(label)}</button>`;
 const error=state.error?`<p role="alert">${escape(state.error==='read'?u.unavailable:u.saveError)}</p>${state.error==='save'?button('retry-save',u.saveAgain):''}`:'';
 if(state.phase==='ready')return `<section class="practice-session" data-practice-phase="ready"><h2>${escape(u.start)}</h2>${error}${button('start',u.start,!items.length)}${!items.length?`<p>${escape(u.empty)}</p>`:''}</section>`;
 if(state.phase==='complete'){const s=practiceSummary(state);return `<section class="practice-session" data-practice-phase="complete"><h2 tabindex="-1" data-practice-focus>${escape(u.done)}</h2><p>${escape(u.summary)}: ${s.remembered} / ${s.retry} / ${s.skipped}</p><p>${escape(u.history)}: ${state.history.filter(e=>e.rating!=='skipped').length}</p>${error}${button('restart',u.again)}</section>`;}
 if(state.phase==='material')return `<section class="practice-session" data-practice-phase="material">${button('return',u.back)}</section>`;
 if(!item)return '';
 const disabled=!!state.pending,draft=state.drafts[item.id]??{},token=visitToken(state);
 const itemIndex=items.findIndex(i=>i.id===item.id),base=['practice','items',itemIndex],gate={practiceId:item.id,phase:'answer'};
 const field=(value,path,answerOnly=false)=>renderField(localized(value,state.locale),[...base,...path,...(typeof value==='string'?[]:[state.locale])],{gate:answerOnly?gate:undefined})??'';
 const spec=assemblySpec(item);
 const choices=(spec?[]:item.options??[]).map((option,optionIndex)=>{
  const text=localized(option.text,state.locale),choice=item.responseType==='choice'||item.stage==='comprehension'||item.stage==='context-choice'||item.id==='Q04';
  return choice?`<label><input type="radio" name="practice-choice" data-practice-option="${escape(option.id)}" value="${escape(option.id)}"${draft.optionId===option.id?' checked':''}${disabled?' disabled':''}> ${field(option.text,['options',optionIndex,'text'])}</label>`:`<span class="practice-hint">${field(option.text,['options',optionIndex,'text'])}</span>`;
 }).join(' ');
 const answerOptionIndex=item.responseType==='choice'?(item.options??[]).findIndex(o=>o.id===item.answer):-1;
 const answerHTML=state.revealed?(answerOptionIndex>=0?field(item.options[answerOptionIndex].text,['options',answerOptionIndex,'text'],true):field(item.answer,['answer'],true)):'';
 const answer=state.revealed?`<section class="practice-answer"><h3>${escape(u.answer)}</h3><p class="practice-answer-text">${answerHTML}</p>${answerTargets.map(target=>button('play-answer',`${u.play} · ${target.text}`,disabled,`data-practice-audio-id="${escape(target.id)}"`)).join(' ')}<p>${field(item.explanation,['explanation'],true)}</p>${item.checklist?`<ul>${item.checklist.map((c,index)=>`<li>${field(c,['checklist',index],true)}</li>`).join('')}</ul>`:''}<div class="practice-self-check">${button('remembered',u.remembered,disabled)}${button('retry',u.retry,disabled)}</div></section>`:button('reveal',u.reveal,disabled);
 return `<section class="practice-session" data-practice-phase="${state.phase}" data-practice-token="${escape(token)}"><p aria-live="polite">${escape(u.progress)} ${state.index+1} / ${items.length}</p><h2 tabindex="-1" data-practice-focus>${field(item.title,['title'])}</h2><p>${field(item.prompt,['prompt'])}</p>${spec?renderAssembly(item,draft,{uiLocale:state.uiLocale,disabled,revealed:state.revealed,field,escape}):''}${choices?`<div class="practice-options">${choices}</div>`:''}${spec?'':`<label for="practice-response">${escape(u.draft)}</label><textarea id="practice-response" data-practice-draft${disabled?' disabled':''}>${escape(draft.text??'')}</textarea>`}${answer}${error}<nav aria-label="${escape(u.start)}">${button('previous',u.previous,disabled||state.index===0)}${button('skip',u.skip,disabled)}${button('material',u.material,disabled||!item.sourceRefs?.length)}</nav></section>`;
}
/** Delegate events once on a persistent host. Parent replaces HTML on changes.
 * onViewMaterial receives ONLY sourceRefs plus a return callback, not answers.
 * onPlay receives target-language text ONLY after reveal; never auto-played.
 */
export function bindPracticeSession(root,controller,{lesson,onChange=()=>{},onViewMaterial=()=>{},onPlay,resolveAnswerAudio=()=>null}={}){
 const notify=(_state,event)=>onChange(controller.state,event);
 const unsubscribe=controller.subscribe(notify);
 const input=event=>{if(event.target.matches?.('[data-practice-draft]'))controller.dispatch({type:'draft',text:event.target.value,token:visitToken(controller.state)});};
 const change=event=>{if(event.target.matches?.('[data-practice-option]'))controller.dispatch({type:'select',optionId:event.target.dataset.practiceOption,token:visitToken(controller.state)});};
 const click=event=>{
  // A double click may land on the next question's newly rendered button.
  if(event.detail>1)return;
  const el=event.target.closest?.('[data-practice-action]');if(!el||!root.contains(el)||el.disabled)return;
  const action=el.dataset.practiceAction,state=controller.state,item=lesson?.practice?.items.find(i=>i.id===currentItemId(state));
  const token=el.closest?.('[data-practice-token]')?.dataset.practiceToken??visitToken(state);
  if(action==='play-answer'){if(event.isTrusted===true&&state.revealed&&state.phase==='revealed'&&token===visitToken(state)&&onPlay&&item){const target=resolveAnswerAudio(item.id,el.dataset.practiceAudioId);if(target)onPlay({...target,itemId:item.id,kind:'answer',gate:{practiceId:item.id,phase:'answer'}});}return;}
  if(action==='material'){
   controller.dispatch({type:'material',token});
   if(controller.state.phase==='material'&&item)onViewMaterial({itemId:item.id,sourceRefs:clone(item.sourceRefs??[]),returnToPractice:()=>controller.dispatch({type:'return'})});
   return;
  }
  if(action.startsWith('assembly-')){controller.dispatch({type:action,pieceId:el.dataset.pieceId,token});return;}
  controller.dispatch(action==='remembered'||action==='retry'?{type:'assess',rating:action,token}:{type:action,token});
 };
 root.addEventListener('input',input);root.addEventListener('change',change);root.addEventListener('click',click);
 return ()=>{unsubscribe();root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('click',click);};
}
