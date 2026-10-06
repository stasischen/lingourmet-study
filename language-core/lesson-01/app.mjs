import {createSelectedItemsStore} from './selected-items.mjs';
import {createSelectedRef,resolveSelectedRef,buildSelectedPractice,selectedSessionIdentity} from './selected-practice.mjs';
import {selectedToggleHTML,selectedOverviewHTML} from './selected-view.mjs';
import {buildSourceRecallClozeCards,renderSourceAwareFlashcards} from './cloze-flashcards.mjs';
import {buildLexicalFlashcardProjection} from './lexical-flashcards.mjs';
import {renderDictionary} from './dictionary-view.mjs';
import {loadLearningPackage} from './package-loader.mjs';
import {createDictionaryResolver} from './dictionary-resolver.mjs';
import {h} from './i18n.mjs';
import {FLASHCARD_LABELS,buildFlashcardDeck,createFlashcardController,renderFlashcardSession,bindFlashcardSession} from './flashcard-session.mjs';
import {initialPracticeMode,modeNavigation,activePracticeAccess,activePracticeView} from './practice-modes.mjs';
import {createPracticeController,renderPracticeSession,bindPracticeSession,currentItemId,getPracticeAudioAccess,PRACTICE_LABELS} from './practice-session.mjs';
import {createTranslationVisibility,toggleTranslationsFromClick} from './translation-visibility.mjs';
import {createAudioView} from './audio-view.mjs';
import {resolveUnitTarget} from './pronunciation.mjs';
import {UI} from './i18n.mjs';
import {initialLanguages,nextLanguages,syncTeachingSelector} from './language-state.mjs';
import {renderLesson,selectionHTML,unitHTML,tokenText} from './renderer.mjs';
import {withCatalog,tokensForRange} from './model.mjs';
// Host copy applies to both lexical and sentence scopes; frozen session mechanics stay unchanged.
for(const locale of Object.keys(FLASHCARD_LABELS))Object.assign(FLASHCARD_LABELS[locale],{production:UI[locale].cardProduction,listening:UI[locale].cardListening,listen:UI[locale].cardPlay});
const main=document.querySelector('#main'),select=document.querySelector('#teaching-language'),uiSelect=document.querySelector('#ui-language');
const initial=initialLanguages(new URL(location.href).searchParams);let locale=initial.teachingLocale,uiLocale=initial.uiLocale;
const translationVisibility=createTranslationVisibility();
const flashControllers=new Map(),selectedQuestionControllers=new Map();
const LESSON_ID='multisource-first-lesson-pilot';
let selectedStore,selectedCleanup,selectedProjection,selectedCardsProjection,selectedQuestionProjection,lessonSession,questionLesson,questionScope='lesson';
let showSelected=new URL(location.href).searchParams.get('view')==='selected';
let storage,lesson,catalog,data,flashData,clozePracticeSelections,lexicalPracticeSelections,lexicalProjection,mapping,lexicalAnalysis,dictionaryResolver,dictionaryIndex,session,flashSession,cards,audioView,practiceCleanup,flashCleanup,voiceCleanup,selection=null,showLesson=true;
let cardScope=['lexical','selected'].includes(new URL(location.href).searchParams.get('deck'))?new URL(location.href).searchParams.get('deck'):'sentences';
let practiceMode=initialPracticeMode(new URL(location.href).searchParams);
function inspectorContext(){return {...audioView,lexicalAnalysis,dictionaryResolver,selectionAction:(_data,value)=>selectedToggleHTML(selectedStore,selectionReference(value),uiLocale),renderDictionary:(result,locale,ui)=>renderDictionary(result,locale,ui,lexicalAnalysis.localizations?.[locale]?.labels?.pos,target=>audioView.lexicalAudio({targetLanguage:'ja',text:target.text,reading:target.speech}))};}
function render(){
 audioView.begin();practiceCleanup?.();practiceCleanup=null;flashCleanup?.();flashCleanup=null;
 document.documentElement.lang=uiLocale;document.querySelector('.skip').textContent=UI[uiLocale].skip;syncTeachingSelector(select,locale,uiLocale);uiSelect.value=uiLocale;main.dataset.teachingLocale=locale;
 document.querySelector('#language-label').textContent=UI[uiLocale].language;document.querySelector('#ui-language-label').textContent=UI[uiLocale].interfaceLanguage;
 document.title=`${lesson.localizations[locale]?.title??'Lingourmet'} · Lingourmet`;
 if(showSelected){const projection=buildSelectedPractice(data,selectedStore.list(),{lessonId:LESSON_ID,analysis:lexicalAnalysis,locale});main.innerHTML=selectedOverviewHTML(data,lexicalAnalysis,selectedStore,projection,locale,uiLocale,audioView);audioView.bind();return;}
 const view=activePracticeView({mode:practiceMode,practiceState:session.state,flashState:flashSession.state,lesson:questionLesson,cards,showLesson});
 let practiceHTML='';
 if(practiceMode==='cards')practiceHTML+=`<nav class="card-scope-nav" aria-label="${h(UI[uiLocale].cardScope)}"><button type="button" data-card-scope="selected" aria-pressed="${cardScope==='selected'}">${h(UI[uiLocale].selectedTitle)}</button><button type="button" data-card-scope="lexical" aria-pressed="${cardScope==='lexical'}">${h(UI[uiLocale].lexicalCards)}</button><button type="button" data-card-scope="sentences" aria-pressed="${cardScope==='sentences'}">${h(UI[uiLocale].sentenceCards)}</button></nav>`+renderSourceAwareFlashcards(flashSession.state,cards,flashData,{
  audioAvailable:audioView.controller.availability().available,
  renderTarget:(_text,ref,{side}={})=>unitHTML(ref.unit,flashData,{interactive:false,ctx:side==='front'?audioView:undefined}),
  renderMeaning:(text,path,options)=>cardScope==='selected'?selectedMeaningHTML(text,cards.find(c=>c.id===flashSession.state.queue[0])?.selectedRef,options):cardScope==='lexical'?h(text):audioView.renderField(text,catalog.units[path[3]]?'catalog':'lesson',path,options)
 });
 else practiceHTML+=`<nav class="question-scope-nav"><button type="button" data-question-scope="lesson" aria-pressed="${questionScope==='lesson'}">${h(UI[uiLocale].lessonPractice)}</button><button type="button" data-question-scope="selected" aria-pressed="${questionScope==='selected'}">${h(UI[uiLocale].practiceSelectedSentences)}</button></nav>`+renderPracticeSession(session.state,questionLesson,{renderField:(value,path,options)=>questionScope==='selected'?selectedQuestionField(value,path,options):audioView.renderField(value,'lesson',path,options)});
 if(view.canReturnToContent&&view.phase!=='ready')practiceHTML+=`<button class="go-next" type="button" data-back-content>${UI[uiLocale].backContent}</button>`;
 main.innerHTML=renderLesson(lesson,catalog,locale,uiLocale,{...audioView,translationsVisible:translationVisibility.visible,practiceHTML,phase:view.phase,materialRefs:view.materialRefs});
 const practiceRoot=main.querySelector('#practice-root');
 if(practiceRoot&&practiceMode==='questions'){
  practiceCleanup=bindPracticeSession(practiceRoot,session,{lesson:questionLesson,onChange:(_state,event)=>{
   if(event.type==='draft'||event.type==='select'){updatePracticeError();return;}
   if(['start','restart'].includes(event.type))showLesson=false;selection=null;render();
   restorePracticeFocus(event);
  }});
  const error=document.createElement('p');error.id='practice-save-status';error.setAttribute('role','alert');error.hidden=true;practiceRoot.append(error);
 }
 if(practiceRoot&&practiceMode==='cards')flashCleanup=bindFlashcardSession(practiceRoot,flashSession,{cards,lesson:flashData,onPlay:target=>audioView.controller.speak(target,{userInitiated:true}),onChange:(_state,event)=>{
  if(event.type==='start')showLesson=false;selection=null;render();restoreFlashFocus(event);
 }});
 audioView.bind();syncFlashAudio();

 if(selection&&lesson.localizations?.[locale])showSelection(selection);
}
function restorePracticeFocus(event){
 let target;
 if(event.type==='assembly-add'||event.type==='assembly-remove')target=[...main.querySelectorAll('[data-piece-id]')].find(el=>el.dataset.pieceId===event.pieceId&&el.dataset.practiceAction===(event.type==='assembly-add'?'assembly-remove':'assembly-add')&&!el.disabled);
 else if(event.type==='assembly-reset')target=main.querySelector('[data-practice-action="assembly-add"]');
 else if(event.type==='assembly-check')target=main.querySelector('[data-practice-action="assembly-check"]');
 else if(event.type==='material')target=main.querySelector('[data-practice-action="return"]');
 else if(event.type==='reveal')target=main.querySelector('.practice-answer h3');
 target??=main.querySelector('[data-practice-focus]');if(target){if(!target.matches('button,input,textarea,a,[tabindex]'))target.setAttribute('tabindex','-1');target.focus();}
}
function restoreFlashFocus(event){
 const selector=event.type==='material'?'[data-flash-action="return"]':event.type==='reveal'?'.flashcard-back h3':'[data-flash-focus]';const target=main.querySelector(selector)??main.querySelector('[data-flash-action="start"]');if(target){if(!target.matches('button,input,textarea,a,[tabindex]'))target.setAttribute('tabindex','-1');target.focus();}
}
function syncFlashAudio(){
 if(!audioView||!flashSession)return;
 const unavailable=!audioView.controller.availability().available;
 main.querySelectorAll('[data-flash-action="play-front"],[data-flash-action="play-back"]').forEach(button=>button.disabled=unavailable||!!flashSession.state.pending||flashSession.state.error==='read');
 main.querySelectorAll('[data-flash-audio-unavailable]').forEach(node=>node.hidden=!unavailable);
}
function changePracticeMode(event){
 const button=event.target.closest('[data-practice-mode]');if(!button||!main.contains(button)||button.disabled)return;
 const mode=button.dataset.practiceMode;if(!['questions','cards'].includes(mode))return;const targetSession=mode==='cards'?flashSession:session;if(mode===practiceMode&&!showLesson&&!showSelected&&targetSession.state.phase!=='material')return;
 practiceCleanup?.();flashCleanup?.();
 const currentSelectionVersion=selectedSessionIdentity(selectedStore.list(),LESSON_ID).version;
 if(mode==='cards'&&cardScope==='selected'&&selectedCardsProjection?.sessionIdentity.version!==currentSelectionVersion)selectCardScope('selected',true);
 if(mode==='questions'&&questionScope==='selected'&&selectedQuestionProjection?.sessionIdentity.version!==currentSelectionVersion)selectQuestionScope('selected',true);
 const destination=mode==='cards'?flashSession:session;if(destination.state.phase==='material')destination.dispatch({type:'return'});
 practiceMode=mode;showLesson=false;showSelected=false;selection=null;render();
 const url=new URL(location.href);url.searchParams.set('mode',practiceMode);url.searchParams.delete('view');history.replaceState(null,'',url);
 (main.querySelector('[data-practice-focus],[data-flash-focus]')??main.querySelector(`[data-practice-mode="${practiceMode}"]`))?.focus();
}
main.addEventListener('click',changePracticeMode);
function updatePracticeError(){
 const error=main.querySelector('#practice-save-status');if(!error)return;const labels=PRACTICE_LABELS[uiLocale];
 main.querySelectorAll('.practice-session [role="alert"],.practice-session [data-practice-action="retry-save"]').forEach(el=>el.hidden=true);
 error.hidden=!session.state.error;error.replaceChildren();if(!session.state.error)return;
 error.append(document.createTextNode(session.state.error==='read'?labels.unavailable:labels.saveError));
 if(session.state.error!=='read'){const retry=document.createElement('button');retry.type='button';retry.dataset.practiceAction='retry-save';retry.textContent=labels.saveAgain;error.append(retry);}
}
function clearHighlight(){document.querySelectorAll('.token.selected').forEach(el=>{el.classList.remove('selected');el.removeAttribute('aria-pressed');});}
function highlight(unit,from,to){clearHighlight();const ids=new Set(tokensForRange(data.units[unit],from,to).map(t=>t.id));document.querySelectorAll('.token[data-select-kind="token"]').forEach(el=>{if(el.dataset.selectUnit===unit&&ids.has(el.dataset.selectId)){el.classList.add('selected');el.setAttribute('aria-pressed','true');}});}
function showSelection(value){
 audioView.cancel();selection=value;const panel=document.querySelector('#selection-panel');panel.innerHTML=selectionHTML(data,locale,value,uiLocale,inspectorContext());panel.hidden=false;audioView.sync();
 const unit=data.units[value.unit];
 if(value.kind==='sentence')highlight(value.unit);
 else if(value.kind==='token')highlight(value.unit,value.id,value.id);
 else if(value.kind==='expression'){const range=lexicalAnalysis.expressions[value.id].target;highlight(value.unit,range.fromTokenId,range.toTokenId);}
 else{const range=unit[value.kind==='chunk'?'chunks':'spans'].find(r=>r.id===value.id);highlight(value.unit,range.from,range.to);}
}
main.addEventListener('click',event=>toggleTranslationsFromClick(event,main,translationVisibility,UI[uiLocale]));
main.addEventListener('click',event=>{
 const study=event.target.closest('[data-study-section]');if(study&&main.contains(study)&&['content','teaching'].includes(study.dataset.studySection)){showSelected=false;showLesson=true;selection=null;clearSelectedURL();render();const section=main.querySelector('#'+study.dataset.studySection);section?.setAttribute('tabindex','-1');section?.focus();section?.scrollIntoView();return;}
 if(event.target.closest('[data-back-content]')){showSelected=false;showLesson=true;clearSelectedURL();render();main.querySelector('h1')?.scrollIntoView();return;}
 if(event.target.closest('[data-pronunciation-target]'))return;
 const clicked=event.target.closest('[data-select-kind]');if(clicked){
  const wasPanel=clicked.closest('#selection-panel');
  const value={unit:clicked.dataset.selectUnit,kind:clicked.dataset.selectKind,id:clicked.dataset.selectId||undefined,anchor:clicked.dataset.selectAnchor};
  showSelection(value);
  if(wasPanel)document.querySelector('#selection-panel .selection-choice[aria-pressed="true"]')?.focus();
  else if(event.isTrusted===true&&value.kind==='token'&&clicked.classList.contains('token')&&main.contains(clicked))audioView.controller.speak(resolveUnitTarget(data,value),{userInitiated:true});
  return;
 }
 if(event.target.closest('[data-close-selection]')){audioView.cancel();selection=null;document.querySelector('#selection-panel').hidden=true;clearHighlight();return;}
 const ref=event.target.closest('[data-source-unit]');if(ref){const {sourceUnit:unit,sourceFrom:from,sourceTo:to}=ref.dataset;
  if(from===undefined)showSelection({unit,kind:'sentence'});
  else if(from===to)showSelection({unit,kind:'token',id:from});
  else {const source=data.units[unit];let kind='span',range=source.spans?.find(r=>r.from===from&&r.to===to);if(!range){kind='chunk';range=source.chunks?.find(r=>r.from===from&&r.to===to);}if(range)showSelection({unit,kind,id:range.id});else {selection=null;document.querySelector('#selection-panel').hidden=true;highlight(unit,from,to);}}
 }
});
main.addEventListener('keydown',event=>{if(event.key==='Escape'){audioView.cancel();selection=null;const panel=document.querySelector('#selection-panel');if(panel)panel.hidden=true;clearHighlight();}});
function changeLanguage(event){const next=nextLanguages({teachingLocale:locale,uiLocale},event.target===uiSelect?'ui':'teaching',event.target.value);locale=next.teachingLocale;uiLocale=next.uiLocale;selection=null;practiceCleanup?.();practiceCleanup=null;flashCleanup?.();flashCleanup=null;session.dispatch({type:'locale',locale,uiLocale});flashSession.dispatch({type:'locale',locale,uiLocale});render();const url=new URL(location.href);url.searchParams.set('lang',locale);url.searchParams.set('ui',uiLocale);history.replaceState(null,'',url);}
select.addEventListener('change',changeLanguage);uiSelect.addEventListener('change',changeLanguage);
document.querySelector('.skip').textContent=UI[uiLocale].skip;main.textContent=UI[uiLocale].loading;
try{({lesson,catalog,mapping,lexicalAnalysis,lexicalPracticeSelections,clozePracticeSelections,dictionaryIndex}=await loadLearningPackage());dictionaryResolver=createDictionaryResolver({index:dictionaryIndex,allowCandidate:true});data=withCatalog(lesson,catalog);
 try{storage=window.localStorage;}catch{storage=null;}
 selectedStore=createSelectedItemsStore({storage,lessonId:LESSON_ID});
 lessonSession=createPracticeController({lesson,lessonId:LESSON_ID,practiceVersion:lesson.practice.representationVersion,storage,locale,uiLocale});session=lessonSession;questionLesson=lesson;
 if(new URL(location.href).searchParams.get('questionDeck')==='selected')selectQuestionScope('selected',true);
 lexicalProjection=buildLexicalFlashcardProjection(data,lexicalAnalysis,lexicalPracticeSelections);
 selectCardScope(cardScope);
 audioView=createAudioView({root:main,documents:{lesson,catalog,lexical:lexicalAnalysis},mapping,getAccess:()=>activePracticeAccess(practiceMode,session.state,flashSession.state),getUILocale:()=>uiLocale});voiceCleanup=audioView.controller.subscribe(syncFlashAudio);selectedCleanup=selectedStore.subscribe(()=>{if(showSelected||selection)render();});render();
 window.addEventListener('pagehide',event=>{if(event.persisted){audioView.cancel();return;}practiceCleanup?.();flashCleanup?.();voiceCleanup?.();selectedCleanup?.();audioView.dispose();});
 window.addEventListener('pageshow',event=>{if(event.persisted&&!selectedStore.state.pending)selectedStore.restore();});
}catch(error){main.textContent=UI[uiLocale].error;main.setAttribute('role','alert');console.error(error);}

function selectCardScope(scope,refresh=false){
 cardScope=scope;let key=scope,identity;
 if(scope==='selected'){if(refresh||!selectedCardsProjection)selectedCardsProjection=buildSelectedPractice(data,selectedStore.list(),{lessonId:LESSON_ID,analysis:lexicalAnalysis,locale});flashData=selectedCardsProjection.data;cards=selectedCardsProjection.cards;identity=selectedCardsProjection.sessionIdentity;key='selected:'+identity.version;}
 else{flashData=scope==='lexical'?lexicalProjection.data:data;cards=scope==='lexical'?lexicalProjection.cards:[...buildFlashcardDeck(data),...buildSourceRecallClozeCards(data,clozePracticeSelections)];identity={lessonId:LESSON_ID,version:scope==='lexical'?'source-lexical-v1':'source-sentences-v2'};}
 if(!flashControllers.has(key))flashControllers.set(key,createFlashcardController({cards,...identity,storage,locale,uiLocale}));flashSession=flashControllers.get(key);flashSession.dispatch({type:'locale',locale,uiLocale});
}
main.addEventListener('click',event=>{const button=event.target.closest('[data-card-scope]');if(!button||!main.contains(button)||button.disabled||button.dataset.cardScope===cardScope)return;const scope=button.dataset.cardScope;if(!['lexical','sentences','selected'].includes(scope))return;flashCleanup?.();selectCardScope(scope,scope==='selected');selection=null;showSelected=false;showLesson=false;render();main.querySelector('[data-card-scope="'+scope+'"]')?.focus();const url=new URL(location.href);url.searchParams.set('deck',scope);url.searchParams.delete('view');history.replaceState(null,'',url);});
function clearSelectedURL(){const url=new URL(location.href);url.searchParams.delete('view');history.replaceState(null,'',url);}
function selectionReference(value){if(!['sentence','token','expression'].includes(value?.kind))return null;try{return createSelectedRef(data,value,{lessonId:LESSON_ID,analysis:lexicalAnalysis});}catch{return null;}}
function selectedMeaningHTML(text,ref,options){if(!ref)return h(text);const resolved=resolveSelectedRef(data,ref,{lessonId:LESSON_ID,analysis:lexicalAnalysis});if(resolved.status!=='available')return h(UI[uiLocale].missing);if(ref.kind==='sentence')return audioView.renderField(text,ref.document,['localizations',locale,'units',ref.unit,'meaning'],options);return audioView.renderField(text,'lexical',['localizations',locale,ref.kind==='expression'?'expressions':'annotations',resolved.lexicalId,ref.kind==='expression'?'meaning':'contextMeaning'],options);}
function selectedQuestionField(value,path,options){const item=questionLesson.practice.items[path[2]],ref=item?.selectedRef;if(!ref)return h(value);if(path[3]==='answer')return unitHTML(ref.unit,data,{interactive:false,ctx:{audio:(d,selection)=>audioView.audio(d,selection,options)}});if(path[3]==='options'){const option=item.options[path[4]],token=data.units[ref.unit].tokens.find(t=>t.id===option?.id);return token?`${tokenText(token)}${audioView.audio(data,{unit:ref.unit,kind:'token',id:token.id})}`:h(value);}if(path[3]==='explanation')return selectedMeaningHTML(value,ref,options);return h(value);}
function selectQuestionScope(scope,refresh=false){questionScope=scope;if(scope==='lesson'){session=lessonSession;questionLesson=lesson;}else{if(refresh||!selectedQuestionProjection)selectedQuestionProjection=buildSelectedPractice(data,selectedStore.list(),{lessonId:LESSON_ID,analysis:lexicalAnalysis,locale});const p=selectedQuestionProjection;questionLesson={...data,practice:{items:p.wordBank.map(x=>x.item)}};const key=p.sessionIdentity.version;if(!selectedQuestionControllers.has(key))selectedQuestionControllers.set(key,createPracticeController({lesson:questionLesson,lessonId:p.sessionIdentity.lessonId,practiceVersion:key,storage,locale,uiLocale}));session=selectedQuestionControllers.get(key);}session.dispatch({type:'locale',locale,uiLocale});}
main.addEventListener('click',event=>{
 if(event.target.closest('[data-open-selected]')){showSelected=true;selection=null;render();main.querySelector('[data-selected-focus]')?.focus();const url=new URL(location.href);url.searchParams.set('view','selected');history.replaceState(null,'',url);return;}
 if(event.target.closest('[data-toggle-selected]')){const ref=selectionReference(selection);if(ref){selectedStore.has(ref)?selectedStore.remove(ref):selectedStore.add(ref);(main.querySelector('[data-selected-retry]')??main.querySelector('[data-toggle-selected]'))?.focus();}return;}
 if(event.target.closest('[data-selected-retry]')){selectedStore.state.error==='read'?selectedStore.restore():selectedStore.retrySave();(main.querySelector('[data-selected-retry]')??main.querySelector('[data-selected-focus]')??main.querySelector('[data-toggle-selected]'))?.focus();return;}
 const remove=event.target.closest('[data-selected-remove]');if(remove&&main.contains(remove)){selectedStore.remove(remove.dataset.selectedRemove);(main.querySelector('[data-selected-retry]')??main.querySelector('[data-selected-focus]'))?.focus();return;}
 const open=event.target.closest('[data-selected-open]');if(open&&main.contains(open)){const item=selectedStore.list().find(x=>x.id===open.dataset.selectedOpen);if(!item)return;showSelected=false;showLesson=true;clearSelectedURL();selection={kind:item.ref.kind,unit:item.ref.unit,id:item.ref.id};render();main.querySelector('#selection-panel')?.scrollIntoView();main.querySelector('[data-toggle-selected]')?.focus();return;}
 const scope=event.target.closest('[data-question-scope]');if(scope&&main.contains(scope)&&['lesson','selected'].includes(scope.dataset.questionScope)){practiceCleanup?.();selectQuestionScope(scope.dataset.questionScope,scope.dataset.questionScope==='selected');showSelected=false;showLesson=false;selection=null;render();main.querySelector('[data-question-scope="'+questionScope+'"]')?.focus();const url=new URL(location.href);url.searchParams.set('questionDeck',questionScope);history.replaceState(null,'',url);return;}
 const start=event.target.closest('[data-selected-start]');if(start&&main.contains(start)&&!start.disabled){practiceCleanup?.();flashCleanup?.();showSelected=false;showLesson=false;selection=null;practiceMode=start.dataset.selectedStart;if(practiceMode==='cards')selectCardScope('selected',true);else selectQuestionScope('selected',true);render();const url=new URL(location.href);url.searchParams.delete('view');url.searchParams.set('mode',practiceMode);url.searchParams.set(practiceMode==='cards'?'deck':'questionDeck','selected');history.replaceState(null,'',url);main.querySelector('[data-flash-action="start"],[data-practice-action="start"]')?.focus();}
});
window.addEventListener('storage',event=>{if(selectedStore&&event.key===selectedStore.key&&!selectedStore.state.pending)selectedStore.restore();});
