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
import {renderLesson,selectionHTML,unitHTML} from './renderer.mjs';
import {withCatalog,tokensForRange} from './model.mjs';
// Host copy applies to both lexical and sentence scopes; frozen session mechanics stay unchanged.
for(const locale of Object.keys(FLASHCARD_LABELS))Object.assign(FLASHCARD_LABELS[locale],{production:UI[locale].cardProduction,listening:UI[locale].cardListening,listen:UI[locale].cardPlay});
const main=document.querySelector('#main'),select=document.querySelector('#teaching-language'),uiSelect=document.querySelector('#ui-language');
const initial=initialLanguages(new URL(location.href).searchParams);let locale=initial.teachingLocale,uiLocale=initial.uiLocale;
const translationVisibility=createTranslationVisibility();
const flashControllers=new Map();
let storage,lesson,catalog,data,flashData,clozePracticeSelections,lexicalPracticeSelections,lexicalProjection,mapping,lexicalAnalysis,dictionaryResolver,dictionaryIndex,session,flashSession,cards,audioView,practiceCleanup,flashCleanup,voiceCleanup,selection=null,showLesson=false;
let cardScope=new URL(location.href).searchParams.get('deck')==='lexical'?'lexical':'sentences';
let practiceMode=initialPracticeMode(new URL(location.href).searchParams);
function inspectorContext(){return {...audioView,lexicalAnalysis,dictionaryResolver,renderDictionary:(result,locale,ui)=>renderDictionary(result,locale,ui,lexicalAnalysis.localizations?.[locale]?.labels?.pos,target=>audioView.lexicalAudio({targetLanguage:'ja',text:target.text,reading:target.speech}))};}
function render(){
 audioView.begin();practiceCleanup?.();practiceCleanup=null;flashCleanup?.();flashCleanup=null;
 document.documentElement.lang=uiLocale;document.querySelector('.skip').textContent=UI[uiLocale].skip;syncTeachingSelector(select,locale,uiLocale);uiSelect.value=uiLocale;main.dataset.teachingLocale=locale;
 document.querySelector('#language-label').textContent=UI[uiLocale].language;document.querySelector('#ui-language-label').textContent=UI[uiLocale].interfaceLanguage;
 document.title=`${lesson.localizations[locale]?.title??'Lingourmet'} · Lingourmet`;
 const view=activePracticeView({mode:practiceMode,practiceState:session.state,flashState:flashSession.state,lesson,cards,showLesson});
 let practiceHTML=modeNavigation(practiceMode,uiLocale);
 if(practiceMode==='cards')practiceHTML+=`<nav class="card-scope-nav" aria-label="${h(UI[uiLocale].cardScope)}"><button type="button" data-card-scope="lexical" aria-pressed="${cardScope==='lexical'}">${h(UI[uiLocale].lexicalCards)}</button><button type="button" data-card-scope="sentences" aria-pressed="${cardScope==='sentences'}">${h(UI[uiLocale].sentenceCards)}</button></nav>`+renderSourceAwareFlashcards(flashSession.state,cards,flashData,{
  audioAvailable:audioView.controller.availability().available,
  renderTarget:(_text,ref,{side}={})=>unitHTML(ref.unit,flashData,{interactive:false,ctx:side==='front'?audioView:undefined}),
  renderMeaning:(text,path,options)=>cardScope==='lexical'?h(text):audioView.renderField(text,catalog.units[path[3]]?'catalog':'lesson',path,options)
 });
 else practiceHTML+=renderPracticeSession(session.state,lesson,{renderField:(value,path,options)=>audioView.renderField(value,'lesson',path,options)});
 if(view.canReturnToContent&&view.phase!=='ready')practiceHTML+=`<button class="go-next" type="button" data-back-content>${UI[uiLocale].backContent}</button>`;
 main.innerHTML=renderLesson(lesson,catalog,locale,uiLocale,{...audioView,translationsVisible:translationVisibility.visible,practiceHTML,phase:view.phase,materialRefs:view.materialRefs});
 const practiceRoot=main.querySelector('#practice-root');
 if(practiceRoot&&practiceMode==='questions'){
  practiceCleanup=bindPracticeSession(practiceRoot,session,{lesson,onChange:(_state,event)=>{
   if(event.type==='draft'||event.type==='select'){updatePracticeError();return;}
   if(['start','restart'].includes(event.type))showLesson=false;selection=null;render();
   if(['start','assess','skip','previous','restart','return','retry-save'].includes(event.type))main.querySelector('[data-practice-focus]')?.focus();
  }});
  const error=document.createElement('p');error.id='practice-save-status';error.setAttribute('role','alert');error.hidden=true;practiceRoot.append(error);
 }
 if(practiceRoot&&practiceMode==='cards')flashCleanup=bindFlashcardSession(practiceRoot,flashSession,{cards,lesson:flashData,onPlay:target=>audioView.controller.speak(target,{userInitiated:true}),onChange:(_state,event)=>{
  if(event.type==='start')showLesson=false;selection=null;render();main.querySelector('[data-flash-focus]')?.focus();
 }});
 audioView.bind();syncFlashAudio();

 if(selection&&lesson.localizations?.[locale])showSelection(selection);
}
function syncFlashAudio(){
 if(!audioView||!flashSession)return;
 const unavailable=!audioView.controller.availability().available;
 main.querySelectorAll('[data-flash-action="play-front"],[data-flash-action="play-back"]').forEach(button=>button.disabled=unavailable||!!flashSession.state.pending||flashSession.state.error==='read');
 main.querySelectorAll('[data-flash-audio-unavailable]').forEach(node=>node.hidden=!unavailable);
}
function changePracticeMode(event){
 const button=event.target.closest('[data-practice-mode]');if(!button||!main.contains(button)||button.disabled)return;
 const mode=button.dataset.practiceMode;if(!['questions','cards'].includes(mode)||mode===practiceMode)return;
 practiceMode=mode;showLesson=false;selection=null;render();
 const url=new URL(location.href);url.searchParams.set('mode',practiceMode);history.replaceState(null,'',url);
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
 if(event.target.closest('[data-back-content]')){showLesson=true;render();main.querySelector('h1')?.scrollIntoView();return;}
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
 session=createPracticeController({lesson,lessonId:'multisource-first-lesson-pilot',practiceVersion:lesson.practice.representationVersion,storage,locale,uiLocale});
 lexicalProjection=buildLexicalFlashcardProjection(data,lexicalAnalysis,lexicalPracticeSelections);
 selectCardScope(cardScope);
 audioView=createAudioView({root:main,documents:{lesson,catalog,lexical:lexicalAnalysis},mapping,getAccess:()=>activePracticeAccess(practiceMode,session.state,flashSession.state),getUILocale:()=>uiLocale});voiceCleanup=audioView.controller.subscribe(syncFlashAudio);render();
 window.addEventListener('pagehide',()=>{practiceCleanup?.();flashCleanup?.();voiceCleanup?.();audioView.dispose();},{once:true});
}catch(error){main.textContent=UI[uiLocale].error;main.setAttribute('role','alert');console.error(error);}

function selectCardScope(scope){cardScope=scope;flashData=scope==='lexical'?lexicalProjection.data:data;cards=scope==='lexical'?lexicalProjection.cards:[...buildFlashcardDeck(data),...buildSourceRecallClozeCards(data,clozePracticeSelections)];if(!flashControllers.has(scope))flashControllers.set(scope,createFlashcardController({cards,lessonId:'multisource-first-lesson-pilot',version:scope==='lexical'?'source-lexical-v1':'source-sentences-v2',storage,locale,uiLocale}));flashSession=flashControllers.get(scope);flashSession.dispatch({type:'locale',locale,uiLocale});}
main.addEventListener('click',event=>{const button=event.target.closest('[data-card-scope]');if(!button||!main.contains(button)||button.disabled||button.dataset.cardScope===cardScope)return;const scope=button.dataset.cardScope;if(!['lexical','sentences'].includes(scope))return;flashCleanup?.();selectCardScope(scope);selection=null;showLesson=false;render();const url=new URL(location.href);url.searchParams.set('deck',scope);history.replaceState(null,'',url);});
