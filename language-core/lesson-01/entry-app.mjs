import {returnPracticeURL,boundedScroll,sameTabClick,leavesDocument} from './page-routes.mjs';
import {PRACTICE_LABELS} from './practice-session.mjs';
import {FLASHCARD_LABELS} from './flashcard-session.mjs';
import {focusResourceDestination} from './resource-navigation.mjs';
import {loadCompleteResources} from './complete-resources.mjs';
import {renderCompleteResource} from './complete-resource-view.mjs';
import {createSelectedItemsStore} from './selected-items.mjs';
import {createSelectedRef} from './selected-practice.mjs';
import {selectedToggleHTML,sentenceToggleHTML,syncSentenceToggles,matchingSelectedItem} from './selected-view.mjs';
import {loadEntryPackage} from './package-loader.mjs';
import {createDictionaryResolver} from './dictionary-resolver.mjs';
import {renderDictionary} from './dictionary-view.mjs';
import {withCatalog,tokensForRange} from './model.mjs';
import {resolveUnitTarget} from './pronunciation.mjs';
import {createAudioView} from './audio-view.mjs';
import {UI,h} from './i18n.mjs';
import {searchCatalog} from './catalog-search.mjs';
import {initialLanguages,nextLanguages,syncTeachingSelector} from './language-state.mjs';
import {renderEntry,selectionHTML,renderCatalogResults,renderEntryContext,renderRelatedEntries} from './renderer.mjs';
const main=document.querySelector('#main'),select=document.querySelector('#teaching-language'),uiSelect=document.querySelector('#ui-language'),url=new URL(location.href);
const initial=initialLanguages(url.searchParams);let locale=initial.teachingLocale,uiLocale=initial.uiLocale;
const id=url.searchParams.get('entry');let query=url.searchParams.get('q')??'',composing=false;let catalog,mapping,audioView,data,lexicalAnalysis,dictionaryIndex,dictionaryResolver,selectedStore,selectedCleanup,currentSelection=null;
let resourceAdapter=null;
let loadState='loading';
let sentenceFocusUnit=null;
function toggleSelectedReference(ref){const existing=matchingSelectedItem(selectedStore,ref,{data,analysis:lexicalAnalysis});existing?selectedStore.remove(existing.id):selectedStore.add(ref);}
function sentenceAction(unit){return sentenceToggleHTML(selectedStore,selectionReference({kind:'sentence',unit}),uiLocale,{data,analysis:lexicalAnalysis});}
function refreshSentences(){syncSentenceToggles(main,selectedStore,selectionReference,uiLocale,{data,analysis:lexicalAnalysis});}
function focusSentence(unit){const target=[...main.querySelectorAll('[data-sentence]')].find(el=>el.dataset.sentence===unit);target?.setAttribute('tabindex','-1');target?.focus();target?.scrollIntoView();}
const LESSON_ID='multisource-first-lesson-pilot';
function selectionReference(value){if(!['sentence','token','expression'].includes(value?.kind))return null;try{return createSelectedRef(data,value,{lessonId:LESSON_ID,analysis:lexicalAnalysis});}catch{return null;}}
function inspectorContext(){return {...audioView,lexicalAnalysis,dictionaryResolver,selectionAction:(_data,value)=>selectedToggleHTML(selectedStore,selectionReference(value),uiLocale,{data,analysis:lexicalAnalysis}),renderDictionary:(result,locale,ui)=>renderDictionary(result,locale,ui,lexicalAnalysis.localizations?.[locale]?.labels?.pos,target=>audioView.lexicalAudio({targetLanguage:'ja',text:target.text,reading:target.speech}))};}
function refreshSelection(){refreshSentences();const panel=main.querySelector('#selection-panel');if(currentSelection&&panel&&!panel.hidden){audioView.cancel();panel.innerHTML=selectionHTML(data,locale,currentSelection,uiLocale,inspectorContext());audioView.sync();}}
function render(){currentSelection=null;audioView?.begin();document.documentElement.lang=uiLocale;document.querySelector('.skip').textContent=UI[uiLocale].skip;syncTeachingSelector(select,locale,uiLocale);uiSelect.value=uiLocale;main.dataset.teachingLocale=locale;document.querySelector('#language-label').textContent=UI[uiLocale].language;document.querySelector('#ui-language-label').textContent=UI[uiLocale].interfaceLanguage;const u=UI[uiLocale];if(loadState!=='ready'){main.textContent=loadState==='failed'?u.catalogLoadError:u.loading;document.title=`${u.catalogTitle} · Lingourmet`;return;}const back=`./knowledge.html?lang=${encodeURIComponent(locale)}&ui=${encodeURIComponent(uiLocale)}&q=${encodeURIComponent(query)}`;
 main.innerHTML=id?`<a data-catalog-back href="${back}">${h(u.catalogBack)}</a>`+(Object.hasOwn(catalog.entries??{},id)?renderCompleteResource(resourceAdapter,id,locale,uiLocale,audioView,catalog.entries[id].localizations?.[locale]?.title)+renderRelatedEntries(catalog,id,locale,uiLocale,resourceAdapter,query)+renderEntryContext(catalog,id,locale,uiLocale,{...audioView,sentenceAction}):renderEntry(catalog,id,locale,uiLocale,{...audioView,sentenceAction}))+'<div id="sentence-selection-status"></div>':`<a href="./?lang=${encodeURIComponent(locale)}&ui=${encodeURIComponent(uiLocale)}">${h(u.back)}</a><h1>${h(u.catalogTitle)}</h1><form data-catalog-form role="search"><label for="catalog-query">${h(u.catalogSearch)}</label><input id="catalog-query" type="search" value="${h(query)}" autocomplete="off" enterkeyhint="search"></form><section id="catalog-results" aria-live="polite"></section><p id="audio-status" role="status"></p>`;
 if(!id)updateResults();else{refreshSentences();audioView.bind();}document.title=`${u.catalogTitle} · Lingourmet`;syncPracticeReturn();}
function updateResults(){audioView.begin();const target=main.querySelector('#catalog-results');if(target)target.innerHTML=renderCatalogResults(searchCatalog(catalog,{query,teachingLocale:locale}),catalog,locale,uiLocale,query,audioView);audioView.bind();}
function saveQuery(){const next=new URL(location.href);next.searchParams.set('q',query);history.replaceState(null,'',next);}
main.addEventListener('compositionstart',event=>{if(event.target.id==='catalog-query')composing=true;});
main.addEventListener('compositionend',event=>{if(event.target.id==='catalog-query'){composing=false;query=event.target.value;saveQuery();updateResults();}});
main.addEventListener('input',event=>{if(event.target.id==='catalog-query'){query=event.target.value;if(!composing&&!event.isComposing){saveQuery();updateResults();}}});
main.addEventListener('submit',event=>{if(event.target.matches('[data-catalog-form]')){event.preventDefault();if(!composing){query=main.querySelector('#catalog-query').value;saveQuery();updateResults();}}});
function changeLanguage(event){const examplesOpen=main.querySelector('#resource-lesson-examples')?.open;const nextState=nextLanguages({teachingLocale:locale,uiLocale},event.target===uiSelect?'ui':'teaching',event.target.value);locale=nextState.teachingLocale;uiLocale=nextState.uiLocale;render();const examples=main.querySelector('#resource-lesson-examples');if(examples&&typeof examplesOpen==='boolean')examples.open=examplesOpen;const next=new URL(location.href);next.searchParams.set('lang',locale);next.searchParams.set('ui',uiLocale);history.replaceState(null,'',next);focusResourceHash({restoreFocus:false,expandExamples:false});}
select.addEventListener('change',changeLanguage);uiSelect.addEventListener('change',changeLanguage);
document.querySelector('.skip').textContent=UI[uiLocale].skip;main.textContent=UI[uiLocale].loading;
try{({catalog,mapping,lexicalAnalysis,dictionaryIndex}=await loadEntryPackage());if(id&&Object.hasOwn(catalog.entries??{},id)){try{resourceAdapter=await loadCompleteResources({sourceFiles:lexicalAnalysis.sourceFiles});}catch(error){console.error(error);}}data=withCatalog({units:{},localizations:{}},catalog);dictionaryResolver=createDictionaryResolver({index:dictionaryIndex,allowCandidate:true});let storage;try{storage=window.localStorage;}catch{storage=null;}selectedStore=createSelectedItemsStore({storage,lessonId:LESSON_ID});selectedCleanup=selectedStore.subscribe(refreshSelection);audioView=createAudioView({root:main,documents:{catalog,lexical:lexicalAnalysis},mapping,getUILocale:()=>uiLocale});loadState='ready';render();window.addEventListener('pagehide',event=>{if(event.persisted){audioView.cancel();return;}selectedCleanup?.();audioView.dispose();});window.addEventListener('pageshow',event=>{if(event.persisted&&!selectedStore.state.pending)selectedStore.restore();});}catch(error){loadState='failed';render();main.setAttribute('role','alert');console.error(error);}
function closeSelection(){currentSelection=null;audioView.cancel();const panel=main.querySelector('#selection-panel');if(panel)panel.hidden=true;main.querySelectorAll('.token.selected').forEach(el=>{el.classList.remove('selected');el.removeAttribute('aria-pressed');});}
main.addEventListener('click',event=>{
 if(event.target.closest('[data-pronunciation-target]'))return;
 if(event.target.closest('[data-close-selection]')){closeSelection();return;}
 const button=event.target.closest('[data-select-kind]');if(!button||!main.contains(button))return;
 const wasPanel=button.closest('#selection-panel');
 const selection={unit:button.dataset.selectUnit,kind:button.dataset.selectKind,id:button.dataset.selectId||undefined,anchor:button.dataset.selectAnchor};
 closeSelection();currentSelection=selection;const panel=main.querySelector('#selection-panel');if(!panel)return;
 panel.innerHTML=selectionHTML(data,locale,selection,uiLocale,inspectorContext());panel.hidden=false;audioView.sync();
 let from,to;const unit=data.units[selection.unit];if(selection.kind==='token'){from=to=selection.id;}else if(selection.kind==='expression'){const target=lexicalAnalysis.expressions[selection.id].target;from=target.fromTokenId;to=target.toTokenId;}else if(selection.kind!=='sentence'){const range=unit[selection.kind==='chunk'?'chunks':'spans'].find(r=>r.id===selection.id);from=range.from;to=range.to;}
 const ids=new Set(tokensForRange(unit,from,to).map(t=>t.id));main.querySelectorAll('.token').forEach(el=>{if(el.dataset.selectUnit===selection.unit&&ids.has(el.dataset.selectId)){el.classList.add('selected');el.setAttribute('aria-pressed','true');}});
 if(wasPanel)panel.querySelector('.selection-choice[aria-pressed="true"]')?.focus();
 else if(event.isTrusted===true&&selection.kind==='token'&&button.classList.contains('token'))audioView.controller.speak(resolveUnitTarget(data,selection),{userInitiated:true});
});
main.addEventListener('keydown',event=>{if(event.key==='Escape')closeSelection();});

main.addEventListener('click',event=>{if(event.target.closest('[data-toggle-selected]')){const ref=selectionReference(currentSelection);if(ref){toggleSelectedReference(ref);(main.querySelector('[data-selected-retry]')??main.querySelector('[data-toggle-selected]'))?.focus();}}else if(event.target.closest('[data-selected-retry]')){const sentenceRetry=!!event.target.closest('#sentence-selection-status');selectedStore.state.error==='read'?selectedStore.restore():selectedStore.retrySave();(main.querySelector('[data-selected-retry]')??(sentenceRetry?[...main.querySelectorAll('[data-toggle-sentence]')].find(el=>el.dataset.toggleSentence===sentenceFocusUnit):null)??main.querySelector('[data-toggle-selected]'))?.focus();}});
window.addEventListener('storage',event=>{if(selectedStore&&event.key===selectedStore.key&&!selectedStore.state.pending)selectedStore.restore();});

main.addEventListener('click',event=>{const button=event.target.closest('[data-toggle-sentence]');if(!button||!main.contains(button))return;sentenceFocusUnit=button.dataset.toggleSentence;const ref=selectionReference({kind:'sentence',unit:sentenceFocusUnit});if(!ref)return;toggleSelectedReference(ref);refreshSentences();(main.querySelector('#sentence-selection-status [data-selected-retry]')??[...main.querySelectorAll('[data-toggle-sentence]')].find(el=>el.dataset.toggleSentence===sentenceFocusUnit))?.focus();});



// Native anchors remain usable without JavaScript; repeated activations also restore focus.
main.addEventListener('click',event=>{const link=event.target.closest('[data-resource-section-link], [data-open-resource-examples]');if(!link||!main.contains(link)||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();if(location.hash!==new URL(link.href).hash)history.pushState(null,'',link.href);focusResourceHash();});
function focusResourceHash(options={}){if(new URL(location.href).searchParams.has('sourceUnit'))return focusExactSource(options);return focusResourceDestination({root:main,adapter:resourceAdapter,entryId:id,locale,location,history,...options});}
window.addEventListener('hashchange',()=>focusResourceHash());
window.addEventListener('popstate',()=>focusResourceHash());
window.addEventListener('pageshow',event=>{if(event.persisted)focusResourceHash({restoreFocus:false,expandExamples:false});});
focusResourceHash();

function syncPracticeReturn(){const url=returnPracticeURL(location.href);if(!url)return;url.searchParams.set('lang',locale);url.searchParams.set('ui',uiLocale);url.searchParams.set('resumeScroll',String(boundedScroll(new URL(location.href).searchParams.get('returnScroll'))));const link=document.createElement('a');link.href=url.href;link.dataset.returnPractice='';link.className='go-next';link.textContent=url.searchParams.get('mode')==='cards'?FLASHCARD_LABELS[uiLocale].back:PRACTICE_LABELS[uiLocale].back;main.prepend(link);}
function focusExactSource({restoreFocus=true}={}){const p=new URL(location.href).searchParams,unit=p.get('sourceUnit');let ref;try{ref=createSelectedRef(data,{kind:'sentence',unit},{lessonId:LESSON_ID,analysis:lexicalAnalysis});}catch{}let hash;try{hash=decodeURIComponent(location.hash.slice(1));}catch{}const target=[...main.querySelectorAll('[data-sentence]')].find(el=>el.dataset.sentence===unit);if(!ref||ref.document!==p.get('sourceDocument')||ref.sourceRevision!==p.get('sourceRevision')||hash!=='unit-'+unit||!target){const notice=document.createElement('p');notice.id='page-source-status';notice.setAttribute('role','status');notice.textContent=UI[uiLocale].missing;main.querySelector('#page-source-status')?.remove();main.prepend(notice);return false;}main.querySelector('#resource-lesson-examples').open=true;target.setAttribute('tabindex','-1');if(restoreFocus)target.focus();target.scrollIntoView();return true;}
document.addEventListener('click',event=>{const link=event.target.closest?.('a[href]');if(!link||!sameTabClick(event,link))return;if(leavesDocument(link,location.href)&&(selectedStore?.state.error||selectedStore?.state.pending)){event.preventDefault();event.stopImmediatePropagation();refreshSelection();let notice=main.querySelector('#page-route-status');if(!notice){notice=document.createElement('p');notice.id='page-route-status';notice.setAttribute('role','alert');main.prepend(notice);}notice.textContent=UI[uiLocale][selectedStore.state.error==='read'?'selectedReadError':'selectedSaveError'];notice.setAttribute('tabindex','-1');notice.focus();}else if(leavesDocument(link,location.href))audioView.cancel();},true);
window.addEventListener('beforeunload',event=>{if(selectedStore?.state.pending||selectedStore?.state.error==='save'){event.preventDefault();event.returnValue='';}});
