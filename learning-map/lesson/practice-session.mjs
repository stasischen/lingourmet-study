import {ASSEMBLY_ADDITIVE_VERSION,migrateBoundedAssembly,validateBoundedAssemblyState} from './assembly-progress-migration.mjs';
import {FOLLOWUP_QUESTION_PREDECESSOR} from './followup-question-predecessor.mjs';
import {ORDINARY_QUESTION_PREDECESSOR} from './ordinary-question-predecessor.mjs';
import {choiceSpec,choiceQuestionSignature,CHOICE_ASSESSMENT_VERSION} from './choice-assessment.mjs';
import {assemblySpec,validAssemblyBank,shuffleAssemblyBank,validAssemblyOrder,changeAssembly,assemblyResult,renderAssembly} from './sentence-assembly.mjs';
/** One-question practice. Explicit authored choices are graded; prose remains self-review. */
export const STORAGE_NAMESPACE = 'lingourmet:pilot:practice-session:v1';
export const PRACTICE_LABELS = {
 'zh-Hant': {start:'開始練習',reveal:'看答案與說明',remembered:'想起來了',retry:'還沒想起來',previous:'上一題',skip:'略過',material:'查看教材',back:'回到練習',again:'再練一次',done:'這次練習完成了',answer:'答案與示範',draft:'你的回答',play:'播放',progress:'題',saveError:'這次回答還沒存好。請重試，存好後再繼續。',saveAgain:'重試儲存',history:'已保存的自評',summary:'想起來了／還沒想起來／略過',unavailable:'練習記錄無法讀取，原記錄已保留。',empty:'目前沒有練習題。'},
 en:{start:'Start practice',reveal:'Show answer and explanation',remembered:'I recalled it',retry:'Not yet',previous:'Previous',skip:'Skip',material:'View material',back:'Back to practice',again:'Practice again',done:'Practice complete',answer:'Answer and examples',draft:'Your response',play:'Play',progress:'Question',saveError:'Your response hasn’t been saved yet. Retry to save it and continue.',saveAgain:'Retry saving',history:'Saved self-checks',summary:'Recalled / Not yet / Skipped',unavailable:'Practice history could not be read. The original record has been kept.',empty:'No practice questions yet.'},
 ja:{start:'練習を始める',reveal:'答えと解説を見る',remembered:'思い出せた',retry:'まだ思い出せない',previous:'前の問題',skip:'スキップ',material:'教材を見る',back:'練習に戻る',again:'もう一度練習する',done:'今回の練習は終わりです',answer:'答えと例',draft:'あなたの答え',play:'再生',progress:'問題',saveError:'回答をまだ保存できていません。もう一度保存してから進みましょう。',saveAgain:'もう一度保存',history:'保存した自己評価',summary:'思い出せた／まだ／スキップ',unavailable:'練習記録を読み込めませんでした。元の記録は残っています。',empty:'練習問題はまだありません。'}
};
// Recall labels remain only for honest display of legacy history; new entries never claim recall or correctness.
Object.assign(PRACTICE_LABELS['zh-Hant'],{next:'下一題',reviewSummary:'已看答案／略過',reviewHistory:'已保存的操作紀錄（筆）',done:'本輪已結束',coverage:'已看答案',skippedItems:'略過',legacy:'練習流程已更新。舊回答、自評與進度仍保留；這裡開始新一輪。'});
Object.assign(PRACTICE_LABELS.en,{next:'Next question',reviewSummary:'Answer viewed / Skipped',reviewHistory:'Saved action records',done:'This round has ended',coverage:'Answers viewed',skippedItems:'Skipped',legacy:'The practice flow has changed. Earlier responses, self-checks and progress are preserved; a new round starts here.'});
Object.assign(PRACTICE_LABELS.ja,{next:'次の問題',reviewSummary:'答えを確認／スキップ',reviewHistory:'保存した操作履歴（件）',done:'このラウンドは終了しました',coverage:'答えを確認した問題',skippedItems:'スキップした問題',legacy:'練習の流れが変わりました。以前の回答・自己評価・進捗は残したまま、ここでは新しく始めます。'});
export const REVIEW_FLOW_VERSION='answer-review-v3';
Object.assign(PRACTICE_LABELS['zh-Hant'],{checkChoice:'檢查選項',correctChoice:'選項正確',incorrectChoice:'選項不正確',reason:'你的理由（自行對照說明）',reasonLimit:'這裡只檢查選項；理由請自行對照說明。',choiceCount:'目前選對',choiceScope:'僅計選項，不評分自由回答或理由。',chooseFirst:'先選一個選項，再檢查。',afterHelp:'已看過回饋或答案後的作答'});
Object.assign(PRACTICE_LABELS.en,{checkChoice:'Check selection',correctChoice:'Correct selection',incorrectChoice:'Incorrect selection',reason:'Your reason (compare it with the explanation)',reasonLimit:'Only the selection is checked. Compare your reason with the explanation yourself.',choiceCount:'Currently correct selections',choiceScope:'Counts selections only; open responses and reasons are not graded.',chooseFirst:'Choose an option before checking.',afterHelp:'Answered after viewing feedback or the answer'});
Object.assign(PRACTICE_LABELS.ja,{checkChoice:'選択を確認する',correctChoice:'選択は正解です',incorrectChoice:'選択は不正解です',reason:'あなたの理由（解説と比べましょう）',reasonLimit:'判定するのは選択肢だけです。理由は自分で解説と比べてください。',choiceCount:'現在正しく選べた問題',choiceScope:'選択肢だけの集計です。自由回答や理由は採点しません。',chooseFirst:'選択肢を一つ選んでから確認してください。',afterHelp:'解説や答えを見た後の回答'});
/** Only lesson questions get a new identity; assembly and selected history keep theirs. */
export function choicePracticeVersion(version,presentationVersion){if(presentationVersion!==undefined&&(typeof presentationVersion!=='string'||!/^learner-value-v[1-9][0-9]*$/.test(presentationVersion)))throw Error('Invalid question presentation version');return `${reviewPracticeVersion(version)}:${CHOICE_ASSESSMENT_VERSION}${presentationVersion?':'+presentationVersion:''}`;}

/** Preserve authored records and canonical field indices; partition only the active view. */
export function lessonPracticeProjection(lesson,scope='questions'){
 if(!['questions','assembly'].includes(scope))throw new Error('Unknown lesson practice scope');
 const sourceItems=lesson.practice?.items??[];let items=sourceItems.filter(item=>!!assemblySpec(item)===(scope==='assembly'));
 if(scope==='questions'&&lesson.practice.questionOrder!==undefined){const order=lesson.practice.questionOrder;if(!Array.isArray(order)||order.length!==items.length||new Set(order).size!==items.length||order.some(id=>!items.some(item=>item.id===id)))throw Error('Invalid authored question order');items=order.map(id=>items.find(item=>item.id===id));}
 return {...lesson,practice:{...lesson.practice,items,sourceItemIndices:items.map(item=>sourceItems.indexOf(item))}};
}
export function reviewPracticeVersion(version,scope='questions'){return `${version}:${REVIEW_FLOW_VERSION}:${scope}`;}
const localized=(value,locale)=>typeof value==='string'?value:value&&Object.hasOwn(value,locale)&&typeof value[locale]==='string'?value[locale]:'';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=value=>JSON.parse(JSON.stringify(value));
export function practiceAnswerText(item,locale){const option=item.responseType==='choice'?(item.options??[]).find(o=>o.id===item.answer):null;return option?localized(option.text,locale):localized(item.answer,locale);}
export function practiceStorageKey(lessonId,practiceVersion){
 if(!lessonId||!practiceVersion)throw new Error('An explicit pilot lessonId and practiceVersion are required');
 return `${STORAGE_NAMESPACE}:${encodeURIComponent(lessonId)}:${encodeURIComponent(practiceVersion)}`;
}
/** A content signature, never an identity: excludes localized display strings. */
export function answerSignature(item){
 return JSON.stringify({answer:item.answer??null,answerOptionId:item.answerOptionId??null,order:item.machineAnswerTokenOrder??null,models:Object.entries(item.modelAnswers??{}).sort(([a],[b])=>a.localeCompare(b)),optionIds:(item.options??[]).map(o=>o.id),...(Object.hasOwn(item,'assemblyDistractors')?{assemblyDistractors:item.assemblyDistractors,assemblyOptions:item.options}:{}),...(choiceSpec(item)?{choiceAssessment:choiceSpec(item),choiceQuestion:choiceQuestionSignature(item)}:{})});
}
export function createPracticeState({lessonId,practiceVersion,items,locale='zh-Hant',uiLocale=locale,sessionId='session-1'}){
 practiceStorageKey(lessonId,practiceVersion);
 if(new Set(items.map(i=>i.id)).size!==items.length||items.some(i=>!i.id))throw new Error('Unique stable item IDs are required');
 const choiceSpecs=Object.fromEntries(items.map(i=>[i.id,choiceSpec(i)]).filter(([,spec])=>spec));
 return {schemaVersion:2,lessonId,practiceVersion,itemIds:items.map(i=>i.id),signatures:Object.fromEntries(items.map(i=>[i.id,answerSignature(i)])),assemblySpecs:Object.fromEntries(items.map(i=>[i.id,assemblySpec(i)]).filter(([,spec])=>spec)),orderingHistory:[],answerViews:[],...(Object.keys(choiceSpecs).length?{choiceSpecs,choiceHistory:[]}:{ }),locale,uiLocale,sessionId,round:1,index:0,visit:0,phase:'ready',revealed:false,drafts:{},history:[],error:null,pending:null};
}
export function currentItemId(state){return state.itemIds[state.index]??null;}
export function getPracticeAudioAccess(state){return {feedbackReadBlocked:state.error==='read',revealedPracticeIds:state.phase==='revealed'&&state.revealed?[currentItemId(state)]:[],checkedFeedbackTokens:!state.error&&!state.pending&&['recall','revealed'].includes(state.phase)&&currentChoiceResult(state)?[visitToken(state)]:[]};}
export function visitToken(state){return `${state.sessionId}:${state.round}:${state.visit}:${currentItemId(state)}${state.choiceSpecs?.[currentItemId(state)]?`:choice:${state.drafts[currentItemId(state)]?.choiceRevision??0}`:''}`;}
export function practiceSummary(state){
 const active=new Set(state.itemIds),entries=state.history.filter(e=>e.sessionId===state.sessionId&&e.round===state.round&&active.has(e.itemId));
 // Coverage is unique per item, not event count. Keep the append-only event history untouched.
 // Revealed access is visit-local; persistent answer-view facts survive navigation.
 const reviewed=new Set((state.answerViews??[]).filter(view=>view.sessionId===state.sessionId&&view.round===state.round&&active.has(view.itemId)&&view.answerSignature===state.signatures[view.itemId]).map(view=>view.itemId));
 const skipped=new Set(entries.filter(e=>e.rating==='skipped'&&!reviewed.has(e.itemId)).map(e=>e.itemId));
 return {reviewed:reviewed.size,remembered:entries.filter(e=>e.rating==='remembered').length,retry:entries.filter(e=>e.rating==='retry').length,skipped:skipped.size,total:active.size};
}

export function currentChoiceResult(state,id=currentItemId(state)){
 const spec=state.choiceSpecs?.[id],draft=state.drafts[id];if(!spec||!draft||!spec.optionIds.includes(draft.optionId)||draft.checkedRevision!==draft.choiceRevision)return null;
 const expected=draft.optionId===spec.answerOptionId?'correct':'incorrect';
 return draft.choiceResult===expected&&(state.choiceHistory??[]).some(e=>e.itemId===id&&e.sessionId===state.sessionId&&e.round===state.round&&e.answerSignature===state.signatures[id]&&e.revision===draft.choiceRevision&&e.optionId===draft.optionId&&e.result===expected)?expected:null;
}
export function choiceSummary(state){
 const ids=Object.keys(state.choiceSpecs??{});return {correct:ids.filter(id=>currentChoiceResult(state,id)==='correct').length,checked:ids.filter(id=>currentChoiceResult(state,id)).length,total:ids.length};
}
const nextChoiceRevision=value=>{if(!Number.isSafeInteger(value)||value<0||value>=Number.MAX_SAFE_INTEGER)throw new Error('Choice revision exhausted');return value+1;};
const clearChoiceCheck=(state,id,draft)=>({...state,revealed:false,phase:'recall',drafts:{...state.drafts,[id]:{...draft,choiceRevision:nextChoiceRevision(state.drafts[id]?.choiceRevision??0),choiceResult:null,checkedRevision:null}}});
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
 const id=currentItemId(state),spec=state.assemblySpecs?.[id],choice=state.choiceSpecs?.[id];
 if(event.type==='choice-check'){
  const draft=state.drafts[id]??{};if(!choice||!choice.optionIds.includes(draft.optionId)||currentChoiceResult(state,id))return state;
  const revision=draft.choiceRevision??0,attemptId=JSON.stringify([state.sessionId,state.round,id,revision]);
  if((state.choiceHistory??[]).some(e=>e.attemptId===attemptId))return state;
  const result=draft.optionId===choice.answerOptionId?'correct':'incorrect',help=(state.answerViews??[]).some(v=>v.sessionId===state.sessionId&&v.round===state.round&&v.itemId===id)?'answer':(state.choiceHistory??[]).some(e=>e.sessionId===state.sessionId&&e.round===state.round&&e.itemId===id)?'feedback':'none';
  const entry={attemptId,sessionId:state.sessionId,round:state.round,itemId:id,answerSignature:state.signatures[id],revision,optionId:draft.optionId,result,help,at:event.at??null};
  return {...state,drafts:{...state.drafts,[id]:{...draft,choiceRevision:revision,choiceResult:result,checkedRevision:revision}},choiceHistory:[...(state.choiceHistory??[]),entry]};
 }
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
 if(event.type==='draft'){
  const draft=state.drafts[id]??{},text=String(event.text);if(draft.text===text)return state;
  return choice?choice.responseMode==='selection-with-reason'?clearChoiceCheck(state,id,{...draft,text}):state:{...state,drafts:{...state.drafts,[id]:{...draft,text}}};
 }
 if(event.type==='select'){
  const draft=state.drafts[id]??{};if(choice&&!choice.optionIds.includes(event.optionId)||draft.optionId===event.optionId)return state;
  return choice?clearChoiceCheck(state,id,{...draft,optionId:event.optionId}):{...state,drafts:{...state.drafts,[id]:{...draft,optionId:event.optionId}}};
 }
 if(event.type==='reveal'){
  if(state.revealed)return state;
  const viewId=JSON.stringify([state.sessionId,state.round,id]),views=state.answerViews??[];
  const answerViews=views.some(view=>view.viewId===viewId)?views:[...views,{viewId,sessionId:state.sessionId,round:state.round,itemId:id,answerSignature:state.signatures[id],at:event.at??null}];
  const entry={attemptId:`${visitToken(state)}:order:reveal`,itemId:id,kind:'ordering',result:'revealed',order:[...(state.drafts[id]?.order??[])],at:event.at??null};
  return {...state,revealed:true,phase:'revealed',answerViews,...(spec&&!state.revealed&&!state.orderingHistory?.some(e=>e.attemptId===entry.attemptId)?{orderingHistory:[...(state.orderingHistory??[]),entry]}:{})};
 }
 if(event.type==='material')return {...state,returnPhase:state.phase,phase:'material'};
 if(event.type==='previous'&&state.index>0)return {...state,index:state.index-1,visit:state.visit+1,revealed:false,phase:'recall'};
 if(event.type==='next'&&!state.revealed&&!currentChoiceResult(state,id))return state;
 if(event.type!=='next'&&event.type!=='skip')return state;
 // A stale or repeated advance must never append an event twice.
 const attemptId=visitToken(state);
 if(state.history.some(e=>e.attemptId===attemptId))return state;
 const entry={attemptId,lessonId:state.lessonId,practiceVersion:state.practiceVersion,itemId:id,answerSignature:state.signatures[id],sessionId:state.sessionId,round:state.round,...(event.type==='skip'?{rating:'skipped',answerViewed:state.revealed}:{kind:state.revealed?'answer-review':'choice-check',...(currentChoiceResult(state,id)?{choiceResult:currentChoiceResult(state,id)}:{})}),response:clone(state.drafts[id]??{}),at:event.at??null};
 return nextQuestion({...state,history:[...state.history,entry],pending:null,error:null});
}
/** Bounded v2 -> v3 admission. Never infer content equivalence from IDs or answers alone. */
const canonicalQuestion=value=>JSON.stringify(value,(_key,entry)=>entry&&typeof entry==='object'&&!Array.isArray(entry)?Object.fromEntries(Object.keys(entry).sort().map(key=>[key,entry[key]])):entry);
function migrateOrdinaryQuestions({state,items,storage,locale,uiLocale}){
 const v3=FOLLOWUP_QUESTION_PREDECESSOR.version,v4=v3.replace(/learner-value-v3$/,'learner-value-v4');
 if(![v3,v4].includes(state.practiceVersion))return null;
 const prior=state.practiceVersion===v4&&storage?.getItem(practiceStorageKey(state.lessonId,v3))!=null?FOLLOWUP_QUESTION_PREDECESSOR:ORDINARY_QUESTION_PREDECESSOR;
 const priorKey=practiceStorageKey(state.lessonId,prior.version),raw=storage?.getItem(priorKey);
 if(raw==null)return null;
 const expected=FOLLOWUP_QUESTION_PREDECESSOR.items.map(item=>item.id);
 if(items.length!==expected.length||items.some(item=>!expected.includes(item.id)||assemblySpec(item)||item.selectedRef))throw Error('Unknown ordinary migration item set');
 const saved=JSON.parse(raw),object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
 if(!object(saved)||!object(saved.drafts)||!Number.isSafeInteger(saved.visit)||saved.visit<0||saved.visit>=Number.MAX_SAFE_INTEGER||!Number.isSafeInteger(saved.round)||saved.pending!==null||saved.error!==null||typeof saved.revealed!=='boolean'||!Array.isArray(saved.orderingHistory)||saved.orderingHistory.length||!object(saved.assemblySpecs)||Object.keys(saved.assemblySpecs).length||saved.assemblyBanks!==undefined||!Array.isArray(saved.history)||new Set(saved.history.map(e=>e?.attemptId)).size!==saved.history.length)throw Error('Malformed predecessor session');
 for(const draft of Object.values(saved.drafts))if(!object(draft)||draft.text!==undefined&&typeof draft.text!=='string')throw Error('Malformed predecessor draft');
 const restored=createPracticeController({lesson:{practice:{items:prior.items}},lessonId:state.lessonId,practiceVersion:prior.version,storage:{getItem:key=>key===priorKey?raw:null},locale,uiLocale});
 if(restored.state.error)throw Error('Unverifiable predecessor session');
 if(canonicalQuestion(saved.choiceSpecs)!==canonicalQuestion(restored.state.choiceSpecs)||saved.history.some(entry=>entry.lessonId!==state.lessonId||!(entry.practiceVersion===prior.version||prior===FOLLOWUP_QUESTION_PREDECESSOR&&saved.ordinaryMigration?.fromVersion===ORDINARY_QUESTION_PREDECESSOR.version&&entry.practiceVersion===ORDINARY_QUESTION_PREDECESSOR.version&&saved.ordinaryMigration.unchanged.includes(entry.itemId))||!object(entry.response)||!(entry.at===null||typeof entry.at==='string')))throw Error('Unknown predecessor evidence');
 const previous=restored.state,unchanged=prior.items.filter(old=>canonicalQuestion(old)===canonicalQuestion(items.find(item=>item.id===old.id))).map(item=>item.id),keep=new Set(unchanged);
 const stale=prior.items.filter(item=>!keep.has(item.id)).map(item=>item.id),added=items.filter(item=>!prior.items.some(old=>old.id===item.id)).map(item=>item.id);
 const history=previous.history.filter(entry=>keep.has(entry.itemId)),completed=new Set(history.filter(entry=>entry.round===previous.round).map(entry=>entry.itemId));
 const first=state.itemIds.findIndex(itemId=>!completed.has(itemId));
 return {...state,sessionId:previous.sessionId,round:previous.round,visit:previous.visit+1,index:first<0?state.itemIds.length:first,phase:first<0?'complete':previous.phase==='ready'?'ready':'recall',revealed:false,
  drafts:Object.fromEntries(Object.entries(previous.drafts).filter(([itemId])=>keep.has(itemId))),history,answerViews:previous.answerViews.filter(entry=>keep.has(entry.itemId)),choiceHistory:(previous.choiceHistory??[]).filter(entry=>keep.has(entry.itemId)),legacyPreserved:true,
  ordinaryMigration:{version:'u01-additive-v1',fromVersion:prior.version,unchanged,stale,added}};
}
export function createPracticeController({lesson,lessonId,practiceVersion,storage,locale='zh-Hant',uiLocale=locale,sessionId,legacyPracticeVersion,legacyPracticeVersions=[],rng=Math.random,now=()=>new Date().toISOString()}){
 const items=lesson.practice?.items??[],key=practiceStorageKey(lessonId,practiceVersion);
 const id=sessionId??globalThis.crypto?.randomUUID?.()??`session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
 let state=createPracticeState({lessonId,practiceVersion,items,locale,uiLocale,sessionId:id}),blocked=false;
 const priorVersions=[...new Set([legacyPracticeVersion,...legacyPracticeVersions].filter(version=>version&&version!==practiceVersion))],legacyKeys=[];
 try{
  for(const version of priorVersions){const priorKey=practiceStorageKey(lessonId,version);if(storage?.getItem(priorKey)!=null)legacyKeys.push(priorKey);}
  state.legacyPreserved=legacyKeys.length>0;
  const raw=storage?.getItem(key);
  if(raw==null){const migrated=migrateOrdinaryQuestions({state,items,storage,locale,uiLocale})??migrateBoundedAssembly({state,items,storage,storageKey:practiceStorageKey,createState:createPracticeState});if(migrated)state=migrated;}
  if(raw!=null){const saved=JSON.parse(raw);
   if(practiceVersion===ASSEMBLY_ADDITIVE_VERSION)validateBoundedAssemblyState(saved,state,items);
   if(saved?.ordinaryMigration!==undefined){
    const proof=saved.ordinaryMigration,prior=proof?.fromVersion===FOLLOWUP_QUESTION_PREDECESSOR.version?FOLLOWUP_QUESTION_PREDECESSOR:ORDINARY_QUESTION_PREDECESSOR;
    const v3=FOLLOWUP_QUESTION_PREDECESSOR.version,v4=v3.replace(/learner-value-v3$/,'learner-value-v4');
    const unchanged=prior.items.filter(old=>canonicalQuestion(old)===canonicalQuestion(items.find(item=>item.id===old.id))).map(item=>item.id),stale=prior.items.filter(old=>!unchanged.includes(old.id)).map(item=>item.id),added=items.filter(item=>!prior.items.some(old=>old.id===item.id)).map(item=>item.id);
    if(!proof||proof.version!=='u01-additive-v1'||proof.fromVersion!==prior.version||![v3,v4].includes(practiceVersion)||prior===FOLLOWUP_QUESTION_PREDECESSOR&&practiceVersion!==v4||['unchanged','stale','added'].some(field=>canonicalQuestion(proof[field])!==canonicalQuestion({unchanged,stale,added}[field])))throw Error('Malformed migration proof');
   }
   if(saved.schemaVersion!==2||typeof saved.sessionId!=='string'||!saved.sessionId||!Number.isInteger(saved.round)||saved.round<1||saved.lessonId!==lessonId||saved.practiceVersion!==practiceVersion||!Array.isArray(saved.history)||!Array.isArray(saved.itemIds)||!Number.isInteger(saved.index)||saved.index<0||saved.index>items.length||!['ready','recall','revealed','material','complete'].includes(saved.phase)||JSON.stringify(saved.itemIds)!==JSON.stringify(state.itemIds)||JSON.stringify(saved.signatures)!==JSON.stringify(state.signatures))throw new Error('Incompatible saved session');
   if(Object.keys(state.choiceSpecs??{}).length){
    const ended=saved.phase==='complete',inactive=saved.phase==='ready';
    if(!Number.isSafeInteger(saved.round)||!Number.isSafeInteger(saved.index)||!Number.isSafeInteger(saved.visit)||saved.visit<0||typeof saved.revealed!=='boolean'||saved.pending!==null||ended!== (saved.index===items.length)||inactive&&saved.index!==0||!['material','revealed'].includes(saved.phase)&&saved.revealed||saved.phase==='material'&&(!['recall','revealed'].includes(saved.returnPhase)||saved.revealed!==(saved.returnPhase==='revealed'))||saved.phase!=='material'&&saved.returnPhase!==undefined)throw new Error('Invalid saved choice phase');
    for(const e of saved.history)if(!e||typeof e!=='object'||typeof e.attemptId!=='string'||!state.itemIds.includes(e.itemId)||e.sessionId!==saved.sessionId||!Number.isSafeInteger(e.round)||e.round<1||e.round>saved.round||e.answerSignature!==state.signatures[e.itemId]||!(e.rating==='skipped'||['answer-review','choice-check'].includes(e.kind)))throw new Error('Invalid saved choice action history');
    if(!Array.isArray(saved.choiceHistory)||!saved.drafts||typeof saved.drafts!=='object'||Array.isArray(saved.drafts)||new Set(saved.choiceHistory.map(e=>e?.attemptId)).size!==saved.choiceHistory.length)throw new Error('Invalid saved choice history');
    for(const e of saved.choiceHistory){const spec=state.choiceSpecs[e?.itemId];if(!spec||e.sessionId!==saved.sessionId||!Number.isSafeInteger(e.round)||e.round<1||e.round>saved.round||!Number.isSafeInteger(e.revision)||e.revision<0||e.answerSignature!==state.signatures[e.itemId]||!spec.optionIds.includes(e.optionId)||e.result!==(e.optionId===spec.answerOptionId?'correct':'incorrect')||!['none','feedback','answer'].includes(e.help)||!(e.at===null||typeof e.at==='string')||e.attemptId!==JSON.stringify([e.sessionId,e.round,e.itemId,e.revision]))throw new Error('Invalid saved choice attempt');}
    for(const [id,draft] of Object.entries(saved.drafts)){
     const spec=state.choiceSpecs[id];if(!state.itemIds.includes(id))throw new Error('Unknown saved draft');if(!spec)continue;
     if(!draft||typeof draft!=='object'||Array.isArray(draft)||draft.optionId!==undefined&&!spec.optionIds.includes(draft.optionId)||!Number.isSafeInteger(draft.choiceRevision)||draft.choiceRevision<0||draft.text!==undefined&&typeof draft.text!=='string')throw new Error('Invalid saved choice draft');
     if(draft.choiceResult!=null||draft.checkedRevision!=null){if(!currentChoiceResult({...saved,choiceSpecs:state.choiceSpecs,signatures:state.signatures},id))throw new Error('Invalid saved choice result');}
    }
   }
   for(const [itemId,spec] of Object.entries(state.assemblySpecs)){const order=saved.drafts?.[itemId]?.order;if(order!==undefined&&!validAssemblyOrder(spec,order))throw new Error('Invalid saved assembly');}
   if(saved.orderingHistory!==undefined&&!Array.isArray(saved.orderingHistory))throw new Error('Invalid ordering history');
   if(!Array.isArray(saved.answerViews)||new Set(saved.answerViews.map(view=>view?.viewId)).size!==saved.answerViews.length||saved.answerViews.some(view=>!view||view.sessionId!==saved.sessionId||!Number.isInteger(view.round)||view.round<1||view.round>saved.round||!state.itemIds.includes(view.itemId)||view.answerSignature!==state.signatures[view.itemId]||view.viewId!==JSON.stringify([view.sessionId,view.round,view.itemId])||!(view.at===null||typeof view.at==='string')))throw new Error('Invalid answer-view facts');
   if((saved.phase==='revealed'&&!saved.revealed)||(saved.revealed&&!saved.answerViews.some(view=>view.sessionId===saved.sessionId&&view.round===saved.round&&view.itemId===saved.itemIds[saved.index])))throw new Error('Revealed answer is missing its view fact');
   // Only an absent field is legacy. A malformed present map must never repair/reorder a round.
   const selectedAssemblyIds=items.filter(item=>item.selectedRef&&state.assemblySpecs[item.id]).map(item=>item.id);
   const hasAssemblyBanks=Object.hasOwn(saved,'assemblyBanks'),savedBanks=saved.assemblyBanks;
   if(hasAssemblyBanks&&(!savedBanks||typeof savedBanks!=='object'||Array.isArray(savedBanks)||Object.keys(savedBanks).length!==selectedAssemblyIds.length||Object.keys(savedBanks).some(id=>!selectedAssemblyIds.includes(id))))throw new Error('Invalid saved assembly bank map');
   const assemblyBanks={};
   for(const itemId of selectedAssemblyIds){
    const spec=state.assemblySpecs[itemId],bank=hasAssemblyBanks?savedBanks[itemId]:saved.assemblySpecs?.[itemId]?.bank??spec.bank;
    if(!validAssemblyBank(spec,bank))throw new Error('Invalid saved assembly bank');
    assemblyBanks[itemId]=[...bank];
   }
   state={...state,...saved,...(Object.keys(assemblyBanks).length?{assemblyBanks}:{}),...(state.choiceSpecs?{choiceSpecs:state.choiceSpecs,choiceHistory:saved.choiceHistory??[]}:{ }),assemblySpecs:state.assemblySpecs,orderingHistory:saved.orderingHistory??[],locale,uiLocale,error:null};
   // Material is rendered by the host; refresh always returns to the same question.
   if(state.phase==='material')state={...state,phase:state.returnPhase??'recall',returnPhase:undefined};
  }
 }catch{blocked=true;state={...state,error:'read'};}
 const listeners=new Set();
 function notify(event){for(const listener of [...listeners])listener(state,event);}
 function save(candidate){if(blocked||!storage?.setItem)throw new Error('Storage unavailable');storage.setItem(key,JSON.stringify({...candidate,error:null}));}
 function dispatch(event){
  if(blocked&&event.type!=='locale')return state;
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
  let next;try{next=reducePractice(input,eventWithTime);}catch{blocked=true;state={...state,error:'read'};notify(event);return state;}
  if(next===input)return state;
  if(state.choiceSpecs&&[next.round,next.visit,next.index].some(n=>!Number.isSafeInteger(n)||n<0)){blocked=true;state={...state,error:'read'};notify(event);return state;}
  // Generate only after an accepted transition, never during render, loading or retry.
  if(event.type==='start'||event.type==='restart'||event.type==='assembly-reset'){
   const assemblyBanks={...state.assemblyBanks};
   for(const item of items.filter(item=>item.selectedRef&&(event.type!=='assembly-reset'||item.id===currentItemId(state)))){
    const spec=state.assemblySpecs[item.id];if(spec)assemblyBanks[item.id]=shuffleAssemblyBank(spec,{rng,previous:state.assemblyBanks?.[item.id]??spec.bank});
   }
   if(Object.keys(assemblyBanks).length)next={...next,assemblyBanks};
  }
  const committing=event.type==='next'||event.type==='skip'||event.type==='assembly-check'||event.type==='choice-check'||event.type==='reveal';
  if(event.type==='locale'){state=next;notify(event);return state;}
  try{save(next);state=next;}
  catch{
   // Preserve the exact attempted review/skip, response and timestamp for retry.
   state=committing?{...state,error:blocked?'read':'save',pending:{...eventWithTime,retrying:undefined}}:{...next,error:blocked?'read':'save'};
  }
  notify(event);return state;
 }
 return {get state(){return state;},key,legacyKey:legacyKeys[0]??null,legacyKeys:[...legacyKeys],dispatch,subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},get canPersist(){return !blocked&&!!storage?.setItem;}};
}
export function renderPracticeSession(state,lesson,{renderListening=()=>'',answerTargets=[],emptyLabel,showLegacyNotice=true,renderField=(value,_path,options)=>options?.audioOnly?'':escape(value)}={}){
 const u=PRACTICE_LABELS[state.uiLocale]??PRACTICE_LABELS.en,items=lesson.practice?.items??[],item=items.find(i=>i.id===currentItemId(state));
 const button=(action,label,disabled=false,extra='')=>`<button type="button" data-practice-action="${action}"${disabled||state.error==='read'?' disabled':''} ${extra}>${escape(label)}</button>`;
 const migration=(state.ordinaryMigration||state.assemblyMigration)?`<p class="practice-migration-notice" role="note">${escape(({en:'Unchanged question progress kept. Changed questions reset; new questions are unfinished. Original records preserved.',ja:'変更のない問題の進捗は引き継ぎました。変更した問題はリセットし、新しい問題は未完了です。元の記録は保存しています。','zh-Hant':'未更動題目的進度已保留；更動的題目已重設，新題目尚未完成。原記錄仍保留。'})[state.uiLocale]??'Unchanged progress kept; changed questions reset and new questions unfinished.')} ${escape((state.ordinaryMigration?.stale??[]).join(', '))}</p>`:'';
 const legacy=showLegacyNotice&&state.legacyPreserved&&!state.ordinaryMigration&&!state.assemblyMigration?`<p class="practice-legacy-notice" role="note">${escape(u.legacy)}</p>`:'';
 const error=state.error?`<p role="alert">${escape(state.error==='read'?u.unavailable:u.saveError)}</p>${state.error==='save'?button('retry-save',u.saveAgain):''}`:'';
 if(state.phase==='ready')return `<section class="practice-session" data-practice-phase="ready">${migration}${legacy}${error}${button('start',u.start,!items.length)}${!items.length?`<p>${escape(emptyLabel??u.empty)}</p>`:''}</section>`;
 if(state.phase==='complete'){const s=practiceSummary(state),cs=choiceSummary(state);return `<section class="practice-session" data-practice-phase="complete"><h2 tabindex="-1" data-practice-focus>${escape(u.done)}</h2><p>${escape(u.coverage)}: ${s.reviewed} / ${s.total} · ${escape(u.skippedItems)}: ${s.skipped}</p>${cs.total?`<p>${escape(u.choiceCount)}: ${cs.correct} / ${cs.total}</p><p>${escape(u.choiceScope)}</p>`:''}${error}${button('restart',u.again)}</section>`;}
 if(state.phase==='material')return `<section class="practice-session" data-practice-phase="material">${button('return',u.back)}</section>`;
 if(!item)return '';
 const disabled=!!state.pending||state.error==='read',draft=state.drafts[item.id]??{},token=visitToken(state);
 const itemIndex=items.findIndex(i=>i.id===item.id),base=['practice','items',lesson.practice.sourceItemIndices?.[itemIndex]??itemIndex],gate={practiceId:item.id,phase:'answer'};
 const field=(value,path,answerOnly=false,options={})=>renderField(localized(value,state.locale),[...base,...path,...(typeof value==='string'?[]:[state.locale])],{...options,gate:answerOnly?gate:options.gate})??'';
 const spec=assemblySpec(item),choice=choiceSpec(item),choiceResult=currentChoiceResult(state),choiceIndex=(item.options??[]).findIndex(o=>o.id===draft.optionId);
 const choices=(spec?[]:item.options??[]).map((option,optionIndex)=>{
  const text=localized(option.text,state.locale),choice=item.responseType==='choice'||item.stage==='comprehension'||item.stage==='context-choice'||item.id==='Q04';
  return choice?`<div class="practice-choice-option"><label><input type="radio" name="practice-choice" data-practice-option="${escape(option.id)}" value="${escape(option.id)}"${draft.optionId===option.id?' checked':''}${disabled?' disabled':''}> ${escape(text)}</label>${field(option.text,['options',optionIndex,'text'],false,{audioOnly:true})}</div>`:`<span class="practice-hint">${field(option.text,['options',optionIndex,'text'])}</span>`;
 }).join(' ');
 const feedback=choiceResult?`<section class="choice-feedback" data-choice-result="${choiceResult}" role="status"><h3 tabindex="-1">${escape(choiceResult==='correct'?u.correctChoice:u.incorrectChoice)}</h3><p>${field(item.choiceAssessment.feedbackByOption[draft.optionId],['choiceAssessment','feedbackByOption',draft.optionId],false,{gate:{practiceId:item.id,phase:'feedback',visitToken:token}})}</p>${choice.responseMode==='selection-with-reason'?`<p>${escape(u.reasonLimit)}</p>`:''}${state.choiceHistory.filter(e=>e.itemId===item.id&&e.round===state.round).at(-1)?.help!=='none'?`<p class="choice-help-note">${escape(u.afterHelp)}</p>`:''}</section>`:'';
 const check=choice?`${!choiceResult?button('choice-check',u.checkChoice,disabled||choiceIndex<0):''}${choiceIndex<0?`<p class="choice-prompt">${escape(u.chooseFirst)}</p>`:''}${feedback}${choiceResult&&!state.revealed?`<div class="choice-next">${button('next',u.next,disabled)}</div>`:''}`:'';
 const answerOptionIndex=item.responseType==='choice'?(item.options??[]).findIndex(o=>o.id===item.answer):-1;
 const answerHTML=state.revealed?(answerOptionIndex>=0?field(item.options[answerOptionIndex].text,['options',answerOptionIndex,'text'],true):field(item.answer,['answer'],true)):'';
 const answer=state.revealed?`<section class="practice-answer"><h3>${escape(u.answer)}</h3><p class="practice-answer-text">${answerHTML}</p>${answerTargets.map(target=>button('play-answer',`${u.play} · ${target.text}`,disabled,`data-practice-audio-id="${escape(target.id)}"`)).join(' ')}<p>${field(item.explanation,['explanation'],true)}</p>${item.checklist?`<ul>${item.checklist.map((c,index)=>`<li>${field(c,['checklist',index],true)}</li>`).join('')}</ul>`:''}<div class="practice-next">${button('next',u.next,disabled)}</div></section>`:button('reveal',u.reveal,disabled);
 return `<section class="practice-session" data-practice-phase="${state.phase}" data-practice-token="${escape(token)}">${migration}<p aria-live="polite">${escape(u.progress)} ${state.index+1} / ${items.length}</p><h2 tabindex="-1" data-practice-focus>${field(item.title,['title'])}</h2><p>${field(item.prompt,['prompt'])}</p>${item.listeningRef?renderListening(item,{disabled,uiLocale:state.uiLocale}):''}${spec?renderAssembly(item,draft,{uiLocale:state.uiLocale,disabled,revealed:state.revealed,bank:state.assemblyBanks?.[item.id],field,escape}):''}${choices?`<div class="practice-options">${choices}</div>`:''}${spec||choice?.responseMode==='selection'?'':`<label for="practice-response">${escape(choice?.responseMode==='selection-with-reason'?u.reason:u.draft)}</label><textarea id="practice-response" data-practice-draft${disabled?' disabled':''}>${escape(draft.text??'')}</textarea>`}${check}${answer}${error}<nav aria-label="${escape(u.start)}">${button('previous',u.previous,disabled||state.index===0)}${button('skip',u.skip,disabled)}${button('material',u.material,disabled||!item.sourceRefs?.length)}</nav></section>`;
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
  controller.dispatch({type:action,token});
 };
 root.addEventListener('input',input);root.addEventListener('change',change);root.addEventListener('click',click);
 return ()=>{unsubscribe();root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('click',click);};
}
