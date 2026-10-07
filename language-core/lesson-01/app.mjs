import {PAGE_FILES,pageFromURL,pageURL,legacyDestination,sourcePage,sourceEntry,returnPracticeURL,boundedScroll,sameTabClick,leavesDocument,returnFocusScrollDelta} from './page-routes.mjs';
import {buildReviewedSentenceDeck,SENTENCE_DECK_VERSION,LEGACY_SENTENCE_DECK_VERSION} from './sentence-presentation.mjs';
import {createSelectedItemsStore} from './selected-items.mjs';
import {createSelectedRef,resolveSelectedRef,buildSelectedPractice} from './selected-practice.mjs';
import {selectedToggleHTML,selectedOverviewHTML} from './selected-view.mjs';
import {sentenceToggleHTML,syncSentenceToggles,matchingSelectedItem} from './selected-view.mjs';
import {buildSourceRecallClozeCards,renderSourceAwareFlashcards} from './cloze-flashcards.mjs';
import {buildLexicalFlashcardProjection} from './lexical-flashcards.mjs';
import {renderDictionary} from './dictionary-view.mjs';
import {loadLearningPackage} from './package-loader.mjs';
import {createDictionaryResolver} from './dictionary-resolver.mjs';
import {h} from './i18n.mjs';
import {FLASHCARD_LABELS,flashcardVisitToken,buildFlashcardDeck,createFlashcardController,renderFlashcardSession,bindFlashcardSession} from './flashcard-session.mjs';
import {initialPracticeMode,modeNavigation,activePracticeAccess,activePracticeView} from './practice-modes.mjs';
import {lessonPracticeProjection,reviewPracticeVersion,createPracticeController,renderPracticeSession,bindPracticeSession,currentItemId,getPracticeAudioAccess,PRACTICE_LABELS} from './practice-session.mjs';
import {createTranslationVisibility,toggleTranslationsFromClick} from './translation-visibility.mjs';
import {createAudioView} from './audio-view.mjs';
import {resolveUnitTarget} from './pronunciation.mjs';
import {UI} from './i18n.mjs';
import {initialLanguages,nextLanguages,syncTeachingSelector} from './language-state.mjs';
import {renderLessonPage as renderLesson,selectionHTML,unitHTML,tokenText} from './renderer.mjs';
import {withCatalog,tokensForRange} from './model.mjs';
// Host copy applies to both lexical and sentence scopes; frozen session mechanics stay unchanged.
for(const locale of Object.keys(FLASHCARD_LABELS))Object.assign(FLASHCARD_LABELS[locale],{production:UI[locale].cardProduction,listening:UI[locale].cardListening,listen:UI[locale].cardPlay});
const main=document.querySelector('#main'),select=document.querySelector('#teaching-language'),uiSelect=document.querySelector('#ui-language');
const initial=initialLanguages(new URL(location.href).searchParams);let locale=initial.teachingLocale,uiLocale=initial.uiLocale;
const legacyRoute=legacyDestination(location.href);if(legacyRoute)location.replace(legacyRoute.href);
const page=pageFromURL(legacyRoute??location.href);
const translationVisibility=createTranslationVisibility(new URL(location.href).searchParams.get('hideTranslation')==='0');
const flashControllers=new Map(),selectedQuestionControllers=new Map(),acknowledgedLegacyKeys=new Set();
function rememberLegacyNotice(controller){if(controller&&controller.state.phase!=='ready')for(const key of controller.legacyKeys)acknowledgedLegacyKeys.add(key);}
let sentenceFocusUnit=null;let returnVisibilityEpoch=0,materialDeparture=null;
function toggleSelectedReference(ref){const existing=matchingSelectedItem(selectedStore,ref,{data,analysis:lexicalAnalysis});existing?selectedStore.remove(existing.id):selectedStore.add(ref);}
function sentenceAction(unit){return sentenceToggleHTML(selectedStore,selectionReference({kind:'sentence',unit}),uiLocale,{data,analysis:lexicalAnalysis});}
function refreshSentences(){syncSentenceToggles(main,selectedStore,selectionReference,uiLocale,{data,analysis:lexicalAnalysis});}
function focusSentence(unit){const target=[...main.querySelectorAll('[data-sentence]')].find(el=>el.dataset.sentence===unit);target?.setAttribute('tabindex','-1');target?.focus();target?.scrollIntoView();}
const LESSON_ID='multisource-first-lesson-pilot';
let selectedStore,selectedCleanup,selectedProjection,selectedCardsProjection,selectedQuestionProjection,lessonSession,assemblySession,lessonQuestions,lessonAssembly,questionLesson,questionScope='lesson';
let showSelected=page==='practice'&&new URL(location.href).searchParams.get('view')==='selected';
let storage,lessonPresentation,lesson,catalog,data,flashData,clozePracticeSelections,lexicalPracticeSelections,lexicalProjection,sentenceProjection,mapping,lexicalAnalysis,dictionaryResolver,dictionaryIndex,session,flashSession,cards,audioView,practiceCleanup,flashCleanup,voiceCleanup,selection=null,showLesson=page!=='practice';
let cardScope=['lexical','selected'].includes(new URL(location.href).searchParams.get('deck'))?new URL(location.href).searchParams.get('deck'):'sentences';
let practiceMode=initialPracticeMode(new URL(location.href).searchParams);
function inspectorContext(){return {...audioView,lexicalAnalysis,dictionaryResolver,selectionAction:(_data,value)=>selectedToggleHTML(selectedStore,selectionReference(value),uiLocale,{data,analysis:lexicalAnalysis}),renderDictionary:(result,locale,ui)=>renderDictionary(result,locale,ui,lexicalAnalysis.localizations?.[locale]?.labels?.pos,target=>audioView.lexicalAudio({targetLanguage:'ja',text:target.text,reading:target.speech}))};}
function render(){
 syncPageNavigation();
 audioView.begin();practiceCleanup?.();practiceCleanup=null;flashCleanup?.();flashCleanup=null;
 document.documentElement.lang=uiLocale;document.querySelector('.skip').textContent=UI[uiLocale].skip;syncTeachingSelector(select,locale,uiLocale);uiSelect.value=uiLocale;main.dataset.teachingLocale=locale;
 document.querySelector('#language-label').textContent=UI[uiLocale].language;document.querySelector('#ui-language-label').textContent=UI[uiLocale].interfaceLanguage;
 document.title=`${lesson.localizations[locale]?.title??'Lingourmet'} · Lingourmet`;
 if(showSelected){const projection=buildSelectedPractice(data,selectedStore.list(),{lessonId:LESSON_ID,analysis:lexicalAnalysis,locale});main.innerHTML=selectedOverviewHTML(data,lexicalAnalysis,selectedStore,projection,locale,uiLocale,audioView);main.querySelector('.study-navigation')?.remove();main.insertAdjacentHTML('afterbegin',modeNavigation(practiceMode,uiLocale));audioView.bind();return;}
 const view=activePracticeView({mode:practiceMode,practiceState:session.state,flashState:flashSession.state,lesson:questionLesson,cards,showLesson});
 let practiceHTML=modeNavigation(practiceMode,uiLocale);
 if(practiceMode==='cards')practiceHTML+=`<nav class="card-scope-nav" aria-label="${h(UI[uiLocale].cardScope)}"><button type="button" data-card-scope="selected" aria-pressed="${cardScope==='selected'}">${h(UI[uiLocale].selectedTitle)}</button><button type="button" data-card-scope="lexical" aria-pressed="${cardScope==='lexical'}">${h(UI[uiLocale].lexicalCards)}</button><button type="button" data-card-scope="sentences" aria-pressed="${cardScope==='sentences'}">${h(UI[uiLocale].sentenceCards)}</button></nav>`+renderSourceAwareFlashcards(flashSession.state,cards,flashData,{
  audioAvailable:audioView.controller.availability().available,showLegacyNotice:flashSession.showLegacyNotice,
  renderTarget:(_text,ref,{side}={})=>unitHTML(ref.unit,flashData,{interactive:false,ctx:side==='front'?audioView:undefined}),
  renderMeaning:(text,path,options)=>cardScope==='selected'?selectedMeaningHTML(text,cards.find(c=>c.id===flashSession.state.queue[0])?.selectedRef,options):cardScope==='lexical'?h(text):audioView.renderField(text,catalog.units[path[3]]?'catalog':'lesson',path,options)
 });
 else practiceHTML+=`<nav class="question-scope-nav"><button type="button" data-question-scope="lesson" aria-pressed="${questionScope==='lesson'}">${h(UI[uiLocale].lessonPractice)}</button><button type="button" data-question-scope="assembly" aria-pressed="${questionScope==='assembly'}">${h(UI[uiLocale].lessonAssembly)}</button><button type="button" data-question-scope="selected" aria-pressed="${questionScope==='selected'}">${h(UI[uiLocale].practiceSelectedSentences)}</button></nav>`+renderPracticeSession(session.state,questionLesson,{emptyLabel:questionScope==='selected'?UI[uiLocale][!selectedStore.list().length?'selectedEmpty':selectedQuestionProjection?.cards.length?'selectedAssemblyEmpty':'selectedUnavailable']:undefined,showLegacyNotice:session.legacyKeys.some(key=>!acknowledgedLegacyKeys.has(key)),renderField:(value,path,options)=>questionScope==='selected'?selectedQuestionField(value,path,options):audioView.renderField(value,'lesson',path,options)});
 if(view.canReturnToContent&&view.phase!=='ready')practiceHTML+=`<button class="go-next" type="button" data-back-content>${UI[uiLocale].backContent}</button>`;
 main.innerHTML=renderLesson(lesson,catalog,locale,uiLocale,{...audioView,page,lessonPresentation,sentenceAction,translationsVisible:translationVisibility.visible,practiceHTML,phase:view.phase,materialRefs:view.materialRefs});
 main.insertAdjacentHTML('beforeend','<div id="sentence-selection-status"></div>');refreshSentences();
 const practiceRoot=main.querySelector('#practice-root');
 if(practiceRoot&&practiceMode==='questions'){
  practiceCleanup=bindPracticeSession(practiceRoot,session,{lesson:questionLesson,onChange:(_state,event)=>{
   if(event.type==='draft'||event.type==='select'){updatePracticeError();return;}
   if(['start','restart'].includes(event.type)){showLesson=false;rememberLegacyNotice(session);}selection=null;render();
   restorePracticeFocus(event);
  }});
  const error=document.createElement('p');error.id='practice-save-status';error.setAttribute('role','alert');error.hidden=true;practiceRoot.append(error);
 }
 if(practiceRoot&&practiceMode==='cards')flashCleanup=bindFlashcardSession(practiceRoot,flashSession,{cards,lesson:flashData,onPlay:(target,options)=>audioView.controller.speak(target,{userInitiated:true,...options}),onChange:(_state,event)=>{
  if(['audio-heard','audio-availability'].includes(event.type)){syncFlashAudio();if(event.type==='audio-availability'&&flashSession.state.template==='listening'&&main.querySelector('[data-flash-phase="revealed"]')&&flashSession.state.phase==='recall')render();return;}if(event.type==='start')showLesson=false;selection=null;render();restoreFlashFocus(event);
 }});
 audioView.bind();syncFlashAudio();syncReturnLink();syncSourceLinks();

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
 flashSession.dispatch({type:'audio-availability',available:!unavailable});
 main.querySelectorAll('[data-flash-action="play-front"],[data-flash-action="play-back"]').forEach(button=>button.disabled=unavailable||!!flashSession.state.pending||flashSession.state.error==='read');
 main.querySelectorAll('[data-flash-action="start"][data-flash-template="listening"]').forEach(button=>button.disabled=unavailable||!!flashSession.state.pending||flashSession.state.error==='read');
 if(flashSession.state.template==='listening')main.querySelectorAll('[data-flash-action="reveal"],[data-flash-action="again"],[data-flash-action="remembered"]').forEach(button=>button.disabled=unavailable||flashSession.state.heardToken!==flashcardVisitToken(flashSession.state)||!!flashSession.state.pending||flashSession.state.error==='read');
 main.querySelectorAll('[data-flash-audio-unavailable]').forEach(node=>node.hidden=!unavailable);
}
function changePracticeMode(event){
 const button=event.target.closest('[data-practice-mode]');if(!button||!main.contains(button)||button.disabled)return;
 const mode=button.dataset.practiceMode;if(!['questions','cards'].includes(mode))return;const targetSession=mode==='cards'?flashSession:session;if(mode===practiceMode&&!showLesson&&!showSelected&&targetSession.state.phase!=='material')return;
 practiceCleanup?.();flashCleanup?.();
 const currentSelectionVersion=buildSelectedPractice(data,selectedStore.list(),{lessonId:LESSON_ID,analysis:lexicalAnalysis,locale}).sessionIdentity.version;
 if(mode==='cards'&&cardScope==='selected'&&selectedCardsProjection?.sessionIdentity.version!==currentSelectionVersion)selectCardScope('selected',true);
 if(mode==='questions'&&questionScope==='selected'&&selectedQuestionProjection?.sessionIdentity.version!==currentSelectionVersion)selectQuestionScope('selected',true);
 const destination=mode==='cards'?flashSession:session;if(destination.state.phase==='material')destination.dispatch({type:'return'});
 practiceMode=mode;showLesson=false;showSelected=false;selection=null;render();
 const url=new URL(location.href);url.searchParams.set('mode',practiceMode);url.searchParams.delete('view');history.replaceState(history.state,'',url);syncPageNavigation();
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
// The inspector is a non-modal region. Remember the external opener across rerenders.
let selectionOpener=null;
function rememberSelectionOpener(node){
 if(!node||node.closest('#selection-panel'))return;
 const attributes=[...node.attributes].filter(a=>/^data-(select-|source-|selected-open$)/.test(a.name)).map(a=>[a.name,a.value]);
 selectionOpener={node,attributes,scopeId:node.closest('article[id]')?.id};
}
function restoreSelectionFocus(){
 const visible=node=>node?.isConnected&&main.contains(node)&&!node.disabled&&!node.closest('[hidden]')&&!node.closest('details:not([open])');
 let target=selectionOpener?.node;
 if(!visible(target)){
  const scope=selectionOpener?.scopeId?document.getElementById(selectionOpener.scopeId):main;
  target=[...(scope?.querySelectorAll('[data-select-kind],[data-source-unit],[data-selected-open]')??[])].find(node=>visible(node)&&!node.closest('#selection-panel')&&selectionOpener?.attributes.length&&selectionOpener.attributes.every(([name,value])=>node.getAttribute(name)===value));
 }
 if(!visible(target)){target=main.querySelector('#teaching')??main;if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');}
 target.focus();
}
function dismissSelection(){
 audioView.cancel();selection=null;const panel=main.querySelector('#selection-panel'),wasOpen=panel&&!panel.hidden;
 if(panel)panel.hidden=true;clearHighlight();if(wasOpen)restoreSelectionFocus();
}
function showSelection(value){
 audioView.cancel();selection=value;const panel=document.querySelector('#selection-panel');panel.innerHTML=selectionHTML(data,locale,value,uiLocale,inspectorContext());panel.hidden=false;audioView.sync();syncSourceLinks();
 const unit=data.units[value.unit];
 if(value.kind==='sentence')highlight(value.unit);
 else if(value.kind==='token')highlight(value.unit,value.id,value.id);
 else if(value.kind==='expression'){const range=lexicalAnalysis.expressions[value.id].target;highlight(value.unit,range.fromTokenId,range.toTokenId);}
 else{const range=unit[value.kind==='chunk'?'chunks':'spans'].find(r=>r.id===value.id);highlight(value.unit,range.from,range.to);}
}
main.addEventListener('click',event=>{if(toggleTranslationsFromClick(event,main,translationVisibility,UI[uiLocale])){const url=new URL(location.href);url.searchParams.set('hideTranslation',translationVisibility.visible?'0':'1');history.replaceState(history.state,'',url);syncPageNavigation();syncReturnLink();}});
main.addEventListener('click',event=>{
 const study=event.target.closest('[data-study-section]');if(study&&main.contains(study)&&['content','teaching'].includes(study.dataset.studySection)){showSelected=false;showLesson=true;selection=null;clearSelectedURL();render();const section=main.querySelector('#'+study.dataset.studySection);section?.setAttribute('tabindex','-1');section?.focus();section?.scrollIntoView();return;}
 if(event.target.closest('[data-back-content]')){showSelected=false;showLesson=true;clearSelectedURL();render();main.querySelector('h1')?.scrollIntoView();return;}
 if(event.target.closest('[data-pronunciation-target]'))return;
 const clicked=event.target.closest('[data-select-kind]');if(clicked){
  const wasPanel=clicked.closest('#selection-panel');if(!wasPanel)rememberSelectionOpener(clicked);
  const value={unit:clicked.dataset.selectUnit,kind:clicked.dataset.selectKind,id:clicked.dataset.selectId||undefined,anchor:clicked.dataset.selectAnchor};
  showSelection(value);
  if(wasPanel)document.querySelector('#selection-panel .selection-choice[aria-pressed="true"]')?.focus();
  else if(event.isTrusted===true&&value.kind==='token'&&clicked.classList.contains('token')&&main.contains(clicked))audioView.controller.speak(resolveUnitTarget(data,value),{userInitiated:true});
  return;
 }
 if(event.target.closest('[data-close-selection]')){dismissSelection();return;}
 const ref=event.target.closest('[data-source-unit]');if(ref){rememberSelectionOpener(ref);const {sourceUnit:unit,sourceFrom:from,sourceTo:to}=ref.dataset;
  if(from===undefined){selection=null;showSelected=false;showLesson=true;render();focusSentence(unit);}
  else if(from===to)showSelection({unit,kind:'token',id:from});
  else {const source=data.units[unit];let kind='span',range=source.spans?.find(r=>r.from===from&&r.to===to);if(!range){kind='chunk';range=source.chunks?.find(r=>r.from===from&&r.to===to);}if(range)showSelection({unit,kind,id:range.id});else {selection=null;document.querySelector('#selection-panel').hidden=true;highlight(unit,from,to);}}
 }
});
main.addEventListener('keydown',event=>{if(event.key==='Escape')dismissSelection();});
function changeLanguage(event){const restoreInspectorFocus=main.querySelector('#selection-panel')?.contains(document.activeElement);const next=nextLanguages({teachingLocale:locale,uiLocale},event.target===uiSelect?'ui':'teaching',event.target.value);locale=next.teachingLocale;uiLocale=next.uiLocale;selection=null;practiceCleanup?.();practiceCleanup=null;flashCleanup?.();flashCleanup=null;session.dispatch({type:'locale',locale,uiLocale});flashSession.dispatch({type:'locale',locale,uiLocale});render();if(restoreInspectorFocus)restoreSelectionFocus();const url=new URL(location.href);url.searchParams.set('lang',locale);url.searchParams.set('ui',uiLocale);history.replaceState(history.state,'',url);syncPageNavigation();}
select.addEventListener('change',changeLanguage);uiSelect.addEventListener('change',changeLanguage);
document.querySelector('.skip').textContent=UI[uiLocale].skip;main.textContent=UI[uiLocale].loading;
try{({lessonPresentation,lesson,catalog,mapping,lexicalAnalysis,lexicalPracticeSelections,clozePracticeSelections,dictionaryIndex}=await loadLearningPackage());dictionaryResolver=createDictionaryResolver({index:dictionaryIndex,allowCandidate:true});data=withCatalog(lesson,catalog);
 try{storage=window.localStorage;}catch{storage=null;}
 selectedStore=createSelectedItemsStore({storage,lessonId:LESSON_ID});
 lessonQuestions=lessonPracticeProjection(lesson);lessonAssembly=lessonPracticeProjection(lesson,'assembly');
 lessonSession=createPracticeController({lesson:lessonQuestions,lessonId:LESSON_ID,practiceVersion:reviewPracticeVersion(lesson.practice.representationVersion),legacyPracticeVersions:[lesson.practice.representationVersion,`${lesson.practice.representationVersion}:answer-review-v2:questions`],storage,locale,uiLocale});
 assemblySession=createPracticeController({lesson:lessonAssembly,lessonId:LESSON_ID,practiceVersion:reviewPracticeVersion(lesson.practice.representationVersion,'assembly'),legacyPracticeVersions:[lesson.practice.representationVersion,`${lesson.practice.representationVersion}:answer-review-v2:assembly`],storage,locale,uiLocale});session=lessonSession;questionLesson=lessonQuestions;rememberLegacyNotice(lessonSession);rememberLegacyNotice(assemblySession);
 if(['selected','assembly'].includes(new URL(location.href).searchParams.get('questionDeck')))selectQuestionScope(new URL(location.href).searchParams.get('questionDeck'),true);
 lexicalProjection=buildLexicalFlashcardProjection(data,lexicalAnalysis,lexicalPracticeSelections);
 sentenceProjection=await buildReviewedSentenceDeck(data,lexicalAnalysis);
 for(const diagnostic of sentenceProjection.diagnostics)console.warn(diagnostic.code,diagnostic);
 selectCardScope(cardScope);
 audioView=createAudioView({root:main,documents:{lesson,catalog,lexical:lexicalAnalysis},mapping,getAccess:()=>activePracticeAccess(practiceMode,session.state,flashSession.state),getUILocale:()=>uiLocale});voiceCleanup=audioView.controller.subscribe(syncFlashAudio);selectedCleanup=selectedStore.subscribe(()=>{if(showSelected||selection)render();else refreshSentences();});render();applyPageDestination();
 window.addEventListener('pagehide',event=>{if(event.persisted){audioView.cancel();return;}practiceCleanup?.();flashCleanup?.();voiceCleanup?.();selectedCleanup?.();audioView.dispose();});
 window.addEventListener('pageshow',event=>{if(event.persisted&&!selectedStore.state.pending){const restoredMaterial=materialDeparture;selectedStore.restore();refreshSelectedProjection();render();applyPageDestination(restoredMaterial);}});
}catch(error){main.textContent=UI[uiLocale].error;main.setAttribute('role','alert');console.error(error);}

function selectCardScope(scope,refresh=false){
 cardScope=scope;let key=scope,identity;
 if(scope==='selected'){if(refresh||!selectedCardsProjection)selectedCardsProjection=buildSelectedPractice(data,selectedStore.list(),{lessonId:LESSON_ID,analysis:lexicalAnalysis,locale});flashData=selectedCardsProjection.data;cards=selectedCardsProjection.cards;identity=selectedCardsProjection.sessionIdentity;key='selected:'+identity.version;}
 else{flashData=scope==='lexical'?lexicalProjection.data:data;cards=scope==='lexical'?lexicalProjection.cards:[...sentenceProjection.cards,...buildSourceRecallClozeCards(data,clozePracticeSelections)];identity={lessonId:LESSON_ID,version:scope==='lexical'?'source-lexical-v1':SENTENCE_DECK_VERSION};}
 if(!flashControllers.has(key))flashControllers.set(key,createFlashcardController({cards,...identity,storage,locale,uiLocale,legacyVersions:scope==='sentences'?[LEGACY_SENTENCE_DECK_VERSION]:[]}));flashSession=flashControllers.get(key);flashSession.dispatch({type:'locale',locale,uiLocale});
}
main.addEventListener('click',event=>{const button=event.target.closest('[data-card-scope]');if(!button||!main.contains(button)||button.disabled||button.dataset.cardScope===cardScope)return;const scope=button.dataset.cardScope;if(!['lexical','sentences','selected'].includes(scope))return;flashCleanup?.();selectCardScope(scope,scope==='selected');selection=null;showSelected=false;showLesson=false;render();main.querySelector('[data-card-scope="'+scope+'"]')?.focus();const url=new URL(location.href);url.searchParams.set('deck',scope);url.searchParams.delete('view');history.replaceState(history.state,'',url);syncPageNavigation();});
function clearSelectedURL(){const url=new URL(location.href);url.searchParams.delete('view');history.replaceState(history.state,'',url);syncPageNavigation();}
function selectionReference(value){if(!['sentence','token','expression'].includes(value?.kind))return null;try{return createSelectedRef(data,value,{lessonId:LESSON_ID,analysis:lexicalAnalysis});}catch{return null;}}
function selectedMeaningHTML(text,ref,options){if(!ref)return h(text);const resolved=resolveSelectedRef(data,ref,{lessonId:LESSON_ID,analysis:lexicalAnalysis});if(resolved.status!=='available')return h(UI[uiLocale].missing);if(ref.kind==='sentence')return audioView.renderField(text,ref.document,['localizations',locale,'units',ref.unit,'meaning'],options);return audioView.renderField(text,'lexical',['localizations',locale,ref.kind==='expression'?'expressions':'annotations',resolved.lexicalId,ref.kind==='expression'?'meaning':'contextMeaning'],options);}
function selectedQuestionField(value,path,options){const item=questionLesson.practice.items[path[2]],ref=item?.selectedRef;if(!ref)return h(value);if(path[3]==='answer')return unitHTML(ref.unit,data,{interactive:false,ctx:{audio:(d,selection)=>audioView.audio(d,selection,options)}});if(path[3]==='options'){const option=item.options[path[4]],token=data.units[ref.unit].tokens.find(t=>t.id===option?.id);return token?`${options?.audioOnly?'':tokenText(token)}${audioView.audio(data,{unit:ref.unit,kind:'token',id:token.id})}`:h(value);}if(path[3]==='explanation')return selectedMeaningHTML(value,ref,options);return h(value);}
function selectQuestionScope(scope,refresh=false){questionScope=scope;if(scope==='lesson'){session=lessonSession;questionLesson=lessonQuestions;}else if(scope==='assembly'){session=assemblySession;questionLesson=lessonAssembly;}else{if(refresh||!selectedQuestionProjection)selectedQuestionProjection=buildSelectedPractice(data,selectedStore.list(),{lessonId:LESSON_ID,analysis:lexicalAnalysis,locale});const p=selectedQuestionProjection;questionLesson={...data,practice:{items:p.wordBank.map(x=>x.item)}};const priorKey=reviewPracticeVersion(p.sessionIdentity.version,'selected-assembly'),key=priorKey+':ordering-min2-v1';if(!selectedQuestionControllers.has(key))selectedQuestionControllers.set(key,createPracticeController({lesson:questionLesson,lessonId:p.sessionIdentity.lessonId,practiceVersion:key,legacyPracticeVersions:[priorKey,p.sessionIdentity.version,`${p.sessionIdentity.version}:answer-review-v2:selected-assembly`],storage,locale,uiLocale}));session=selectedQuestionControllers.get(key);rememberLegacyNotice(session);}session.dispatch({type:'locale',locale,uiLocale});}
main.addEventListener('click',event=>{
 if(event.target.closest('[data-open-selected]')){showSelected=true;selection=null;render();main.querySelector('[data-selected-focus]')?.focus();const url=new URL(location.href);url.searchParams.set('view','selected');history.replaceState(history.state,'',url);syncPageNavigation();return;}
 if(event.target.closest('[data-toggle-selected]')){const ref=selectionReference(selection);if(ref){toggleSelectedReference(ref);(main.querySelector('[data-selected-retry]')??main.querySelector('[data-toggle-selected]'))?.focus();}return;}
 if(event.target.closest('[data-selected-retry]')){const sentenceRetry=!!event.target.closest('#sentence-selection-status');selectedStore.state.error==='read'?selectedStore.restore():selectedStore.retrySave();(main.querySelector('[data-selected-retry]')??(sentenceRetry?[...main.querySelectorAll('[data-toggle-sentence]')].find(el=>el.dataset.toggleSentence===sentenceFocusUnit):null)??main.querySelector('[data-selected-focus]')??main.querySelector('[data-toggle-selected]'))?.focus();return;}
 const remove=event.target.closest('[data-selected-remove]');if(remove&&main.contains(remove)){selectedStore.remove(remove.dataset.selectedRemove);(main.querySelector('[data-selected-retry]')??main.querySelector('[data-selected-focus]'))?.focus();return;}
 const open=event.target.closest('[data-selected-open]');if(open&&main.contains(open)){rememberSelectionOpener(open);const item=selectedStore.list().find(x=>x.id===open.dataset.selectedOpen);if(!item)return;showSelected=false;showLesson=true;clearSelectedURL();selection=item.ref.kind==='sentence'?null:{kind:item.ref.kind,unit:item.ref.unit,id:item.ref.id};render();if(item.ref.kind==='sentence')focusSentence(item.ref.unit);else{main.querySelector('#selection-panel')?.scrollIntoView();main.querySelector('[data-toggle-selected]')?.focus();}return;}
 const scope=event.target.closest('[data-question-scope]');if(scope&&main.contains(scope)&&['lesson','assembly','selected'].includes(scope.dataset.questionScope)){practiceCleanup?.();selectQuestionScope(scope.dataset.questionScope,scope.dataset.questionScope==='selected');showSelected=false;showLesson=false;selection=null;render();main.querySelector('[data-question-scope="'+questionScope+'"]')?.focus();const url=new URL(location.href);url.searchParams.set('questionDeck',questionScope);history.replaceState(history.state,'',url);syncPageNavigation();return;}
 const start=event.target.closest('[data-selected-start]');if(start&&main.contains(start)&&!start.disabled){practiceCleanup?.();flashCleanup?.();showSelected=false;showLesson=false;selection=null;practiceMode=start.dataset.selectedStart;if(practiceMode==='cards')selectCardScope('selected',true);else selectQuestionScope('selected',true);render();const url=new URL(location.href);url.searchParams.delete('view');url.searchParams.set('mode',practiceMode);url.searchParams.set(practiceMode==='cards'?'deck':'questionDeck','selected');history.replaceState(history.state,'',url);syncPageNavigation();main.querySelector('[data-flash-action="start"],[data-practice-action="start"]')?.focus();}
});
window.addEventListener('storage',event=>{if(selectedStore&&event.key===selectedStore.key&&!selectedStore.state.pending){selectedStore.restore();refreshSelectedProjection();render();}});

main.addEventListener('click',event=>{const button=event.target.closest('[data-toggle-sentence]');if(!button||!main.contains(button))return;sentenceFocusUnit=button.dataset.toggleSentence;const ref=selectionReference({kind:'sentence',unit:sentenceFocusUnit});if(!ref)return;toggleSelectedReference(ref);refreshSentences();(main.querySelector('#sentence-selection-status [data-selected-retry]')??[...main.querySelectorAll('[data-toggle-sentence]')].find(el=>el.dataset.toggleSentence===sentenceFocusUnit))?.focus();});



function routeURL(target,updates={}){return pageURL(location.href,target,{lang:locale,ui:uiLocale,hideTranslation:translationVisibility.visible?'0':'1',sourceUnit:null,sourceDocument:null,sourceRevision:null,sourceKind:null,sourceId:null,return:null,returnView:null,returnScroll:null,returnFocus:null,returnItem:null,resumeScroll:null,resumeFocus:null,resumeItem:null,...updates});}
function syncPageNavigation(){const nav=document.querySelector('#lesson-nav');if(!nav)return;nav.setAttribute('aria-label',UI[uiLocale].draft);nav.innerHTML=Object.keys(PAGE_FILES).map(name=>`<a data-lesson-page="${name}" href="${h(routeURL(name,{view:null,sourceUnit:null,sourceDocument:null,sourceRevision:null,sourceKind:null,sourceId:null,return:null,returnView:null,returnScroll:null}).href)}"${page===name?' aria-current="page"':''}>${h(UI[uiLocale][name])}</a>`).join('');}
function refreshSelectedProjection(){if(selectedStore.state.error||selectedStore.state.pending)return;if(cardScope==='selected')selectCardScope('selected',true);if(questionScope==='selected')selectQuestionScope('selected',true);}
function navigationBlocked(){return !!(selectedStore?.state.error||selectedStore?.state.pending||[lessonSession,assemblySession,session,flashSession,...flashControllers.values(),...selectedQuestionControllers.values()].some(x=>x?.state.error||x?.state.pending));}
function routeNotice(){let node=document.querySelector('#page-route-status');if(!node){node=document.createElement('p');node.id='page-route-status';node.setAttribute('role','alert');main.prepend(node);}node.textContent=selectedStore?.state.error?UI[uiLocale][selectedStore.state.error==='read'?'selectedReadError':'selectedSaveError']:(practiceMode==='cards'?FLASHCARD_LABELS[uiLocale][flashSession?.state.error==='read'?'readError':'saveError']:PRACTICE_LABELS[uiLocale][session?.state.error==='read'?'unavailable':'saveError']);node.setAttribute('tabindex','-1');node.focus();}
function missingRoute(){let node=document.querySelector('#page-source-status');if(!node){node=document.createElement('p');node.id='page-source-status';node.setAttribute('role','status');main.prepend(node);}node.textContent=UI[uiLocale].missing;}
function goPage(target){if(navigationBlocked()){routeNotice();return;}audioView.cancel();rememberMaterialDeparture(target);location.assign(target.href);}
function sourceURL(unit,{kind,id,returnItem}={}){const owner=sourcePage(lesson,catalog,unit);if(!owner)return null;const ref=selectionReference({kind:'sentence',unit});if(!ref)return null;const url=routeURL(owner,{view:null,entry:owner==='knowledge'?sourceEntry(catalog,unit):null,sourceUnit:unit,sourceDocument:ref.document,sourceRevision:ref.sourceRevision,sourceKind:kind??null,sourceId:id??null,...(page==='practice'?{return:'practice',returnView:showSelected?'selected':null,returnScroll:Math.round(window.scrollY||0),returnFocus:showSelected?'selected-source':practiceMode==='cards'?'card-material':'question-material',returnItem:returnItem??null,mode:practiceMode,deck:cardScope,questionDeck:questionScope}:{})});url.hash='unit-'+unit;return url;}
function applyPageDestination(restoredMaterial=null){
 const url=new URL(location.href),params=url.searchParams,returnURL=returnPracticeURL(url);
 syncReturnLink();
 if(page==='practice'){if(url.hash&&!['#practice','#selected-list'].includes(url.hash)){missingRoute();}if(restoredMaterial){keepReturnFocusVisible(restorePageReturnFocus(restoredMaterial));}else if(params.has('resumeFocus')||params.has('resumeScroll')){const target=restorePageReturnFocus(params);if(params.has('resumeScroll'))window.scrollTo?.({left:0,top:boundedScroll(params.get('resumeScroll')),behavior:'instant'});for(const key of ['resumeFocus','resumeScroll','resumeItem'])url.searchParams.delete(key);history.replaceState(history.state,'',url);keepReturnFocusVisible(target);}return;}
 let hash;try{hash=decodeURIComponent(url.hash.slice(1));}catch{missingRoute();return;}
 const unit=params.get('sourceUnit')??(hash.startsWith('unit-')?hash.slice(5):null);
 if(unit){const ref=selectionReference({kind:'sentence',unit});if(!ref||sourcePage(lesson,catalog,unit)!==page||params.has('sourceUnit')&&(params.get('sourceRevision')!==ref.sourceRevision||params.get('sourceDocument')!==ref.document)||hash&&hash!=='unit-'+unit){missingRoute();return;}const target=[...main.querySelectorAll('[data-sentence]')].find(el=>el.dataset.sentence===unit);if(!target){missingRoute();return;}for(let node=target.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;target.id='unit-'+unit+'-destination';target.setAttribute('tabindex','-1');target.focus();target.scrollIntoView();const kind=params.get('sourceKind'),id=params.get('sourceId');if(kind&&id){try{const value={kind,unit,id};if(!selectionReference(value))throw Error('Invalid selection');showSelection(value);}catch{missingRoute();}}return;}
 if(hash){const target=document.getElementById(hash);if(!target||!main.contains(target)){missingRoute();return;}target.setAttribute('tabindex','-1');target.focus();target.scrollIntoView();}
}
// Capture routing before the existing in-document controllers; modified links stay native.
document.addEventListener('click',event=>{
 const node=event.target.closest?.('a,button');if(!node)return;
 const anchor=node.tagName==='A'?node:null;
 if(anchor&&!sameTabClick(event,anchor)){if(anchor.matches('[data-source-unit]'))event.stopImmediatePropagation();return;}
 if(anchor&&leavesDocument(anchor,location.href)&&navigationBlocked()){event.preventDefault();event.stopImmediatePropagation();routeNotice();return;}
 if(anchor?.matches('[data-source-unit]')){event.stopImmediatePropagation();if(anchor.getAttribute('aria-disabled')==='true'){event.preventDefault();missingRoute();}else{audioView.cancel();rememberMaterialDeparture(new URL(anchor.href));}return;}
 if(node.matches('[data-practice-mode],[data-card-scope],[data-question-scope],[data-open-selected],[data-selected-start]')&&navigationBlocked()){event.preventDefault();event.stopImmediatePropagation();routeNotice();return;}
 if(node.matches('[data-lesson-page], [data-return-practice]')){if(navigationBlocked()){event.preventDefault();routeNotice();return;}if(node.matches('[data-return-practice]')){const u=new URL(node.href);u.searchParams.set('resumeScroll',new URL(location.href).searchParams.get('returnScroll')??'0');node.href=u.href;}return;}
 let target;
 if(node.matches('[data-open-selected]')&&page!=='practice')target=routeURL('practice',{view:'selected'});
 else if(node.matches('[data-back-content]'))target=routeURL('content',{view:null});
 else if(node.matches('[data-study-section]'))target=routeURL(node.dataset.studySection,{view:null});
 else if(node.matches('[data-selected-open]')){const item=selectedStore.list().find(x=>x.id===node.dataset.selectedOpen);if(item&&resolveSelectedRef(data,item.ref,{lessonId:LESSON_ID,analysis:lexicalAnalysis}).status==='available')target=sourceURL(item.ref.unit,{...item.ref,returnItem:item.id});}
 else if(node.matches('[data-practice-action="material"],[data-flash-action="material"]')){if(node.disabled)return;const view=activePracticeView({mode:practiceMode,practiceState:session.state,flashState:flashSession.state,lesson:questionLesson,cards});target=sourceURL(view.materialRefs?.[0]?.unit);}
 else if(node.matches('[data-source-unit]')){const {sourceUnit:unit,sourceFrom:from,sourceTo:to}=node.dataset;target=sourceURL(unit,from&&from===to?{kind:'token',id:from}:{});}
 else return;
 if(!target&&node.matches('[data-open-selected]'))return;
 event.preventDefault();event.stopImmediatePropagation();if(target)goPage(target);else missingRoute();
},true);

function syncReturnLink(){const url=returnPracticeURL(location.href);if(!url)return;url.searchParams.set('lang',locale);url.searchParams.set('ui',uiLocale);url.searchParams.set('hideTranslation',translationVisibility.visible?'0':'1');main.querySelector('[data-return-practice]')?.remove();const link=document.createElement('a');link.className='go-next';link.dataset.returnPractice='';url.searchParams.set('resumeScroll',new URL(location.href).searchParams.get('returnScroll')??'0');link.href=url.href;link.textContent=practiceMode==='cards'?FLASHCARD_LABELS[uiLocale].back:PRACTICE_LABELS[uiLocale].back;main.prepend(link);}

function syncSourceLinks(){for(const link of main.querySelectorAll('a[data-source-unit]')){const {sourceUnit:unit,sourceFrom:from,sourceTo:to}=link.dataset;const url=sourceURL(unit,from&&from===to?{kind:'token',id:from}:{});if(url){link.href=url.href;link.removeAttribute('aria-disabled');}else{link.removeAttribute('href');link.setAttribute('aria-disabled','true');}}}
function restorePageReturnFocus(params){
 const visible=node=>{if(!node?.isConnected||node.disabled||node.hidden||node.closest('[hidden],[aria-hidden="true"],details:not([open])'))return false;for(let parent=node;parent&&parent!==document.documentElement;parent=parent.parentElement){const style=window.getComputedStyle(parent);if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')return false;}return true;};
 let target;const focus=params.get('resumeFocus')??(showSelected?'selected-source':practiceMode==='cards'?'card-material':'question-material');
 if(focus==='selected-source')target=[...main.querySelectorAll('[data-selected-open]')].find(node=>node.dataset.selectedOpen===params.get('resumeItem'));
 else if(focus==='card-material')target=main.querySelector('[data-flash-action="material"]');
 else if(focus==='question-material')target=main.querySelector('[data-practice-action="material"]');
 if(!visible(target))target=[...main.querySelectorAll('[data-selected-focus],[data-practice-focus],[data-flash-focus],h1')].find(visible)??main;
 if(!target.matches('button,a,input,textarea,[tabindex]'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});return target;
}
function rememberMaterialDeparture(url){if(page==='practice'&&url.searchParams.get('return')==='practice'){materialDeparture=new URLSearchParams();materialDeparture.set('resumeFocus',url.searchParams.get('returnFocus')??(showSelected?'selected-source':practiceMode==='cards'?'card-material':'question-material'));const item=url.searchParams.get('returnItem');if(item)materialDeparture.set('resumeItem',item);}}
function keepReturnFocusVisible(target){
 const epoch=++returnVisibilityEpoch,href=location.href;
 const correct=()=>{if(epoch!==returnVisibilityEpoch||!target?.isConnected||document.activeElement!==target||location.href!==href)return;const vv=window.visualViewport,top=vv?.offsetTop??0,left=vv?.offsetLeft??0,viewport={top,left,bottom:top+(vv?.height??window.innerHeight),right:left+(vv?.width??window.innerWidth)},nav=document.querySelector('#lesson-nav')?.getBoundingClientRect(),navBottom=nav&&nav.bottom>viewport.top&&nav.top<viewport.bottom?nav.bottom:viewport.top,delta=returnFocusScrollDelta(target.getBoundingClientRect(),viewport,{navBottom});if(delta.x||delta.y)window.scrollTo?.({left:Math.max(0,window.scrollX+delta.x),top:Math.max(0,window.scrollY+delta.y),behavior:'instant'});};
 correct();window.requestAnimationFrame(()=>{correct();window.requestAnimationFrame(correct);});
}
// Bounded return-only layout correction must yield to subsequent user interaction.
for(const type of ['pointerdown','wheel','touchstart','keydown','click','input','change'])document.addEventListener(type,event=>{
 returnVisibilityEpoch++;
 // Native history navigation can revisit this same cached document repeatedly.
 // Retain only its focus identity, never a saved scroll coordinate. Learner input invalidates it.
 const historyShortcut=event.type==='keydown'&&((event.altKey&&['ArrowLeft','ArrowRight'].includes(event.key))||(event.metaKey&&['[',']'].includes(event.key))||['BrowserBack','BrowserForward'].includes(event.key));
 if(!historyShortcut)materialDeparture=null;
},{capture:true,passive:true});
window.addEventListener('pagehide',()=>{returnVisibilityEpoch++;});
window.addEventListener('beforeunload',event=>{const dirty=selectedStore?.state.pending||selectedStore?.state.error==='save'||[lessonSession,assemblySession,session,flashSession,...flashControllers.values(),...selectedQuestionControllers.values()].some(x=>x?.state.pending||x?.state.error==='save');if(dirty){event.preventDefault();event.returnValue='';}});
