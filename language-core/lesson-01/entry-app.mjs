import {createSelectedItemsStore} from './selected-items.mjs';
import {createSelectedRef} from './selected-practice.mjs';
import {selectedToggleHTML} from './selected-view.mjs';
import {loadEntryPackage} from './package-loader.mjs';
import {createDictionaryResolver} from './dictionary-resolver.mjs';
import {renderDictionary} from './dictionary-view.mjs';
import {withCatalog,tokensForRange} from './model.mjs';
import {resolveUnitTarget} from './pronunciation.mjs';
import {createAudioView} from './audio-view.mjs';
import {UI} from './i18n.mjs';
import {initialLanguages,nextLanguages,syncTeachingSelector} from './language-state.mjs';
import {renderEntry,selectionHTML} from './renderer.mjs';
const main=document.querySelector('#main'),select=document.querySelector('#teaching-language'),uiSelect=document.querySelector('#ui-language'),url=new URL(location.href);
const initial=initialLanguages(url.searchParams);let locale=initial.teachingLocale,uiLocale=initial.uiLocale;
const id=url.searchParams.get('entry');let catalog,mapping,audioView,data,lexicalAnalysis,dictionaryIndex,dictionaryResolver,selectedStore,selectedCleanup,currentSelection=null;
const LESSON_ID='multisource-first-lesson-pilot';
function selectionReference(value){if(!['sentence','token','expression'].includes(value?.kind))return null;try{return createSelectedRef(data,value,{lessonId:LESSON_ID,analysis:lexicalAnalysis});}catch{return null;}}
function inspectorContext(){return {...audioView,lexicalAnalysis,dictionaryResolver,selectionAction:(_data,value)=>selectedToggleHTML(selectedStore,selectionReference(value),uiLocale),renderDictionary:(result,locale,ui)=>renderDictionary(result,locale,ui,lexicalAnalysis.localizations?.[locale]?.labels?.pos,target=>audioView.lexicalAudio({targetLanguage:'ja',text:target.text,reading:target.speech}))};}
function refreshSelection(){const panel=main.querySelector('#selection-panel');if(currentSelection&&panel&&!panel.hidden){audioView.cancel();panel.innerHTML=selectionHTML(data,locale,currentSelection,uiLocale,inspectorContext());audioView.sync();}}
function render(){currentSelection=null;audioView.begin();document.documentElement.lang=uiLocale;document.querySelector('.skip').textContent=UI[uiLocale].skip;syncTeachingSelector(select,locale,uiLocale);uiSelect.value=uiLocale;main.dataset.teachingLocale=locale;document.querySelector('#language-label').textContent=UI[uiLocale].language;document.querySelector('#ui-language-label').textContent=UI[uiLocale].interfaceLanguage;main.innerHTML=renderEntry(catalog,id,locale,uiLocale,audioView);audioView.bind();document.title=`${catalog.entries?.[id]?.localizations?.[locale]?.title??UI[uiLocale].entryDraft} · Lingourmet`;}
function changeLanguage(event){const nextState=nextLanguages({teachingLocale:locale,uiLocale},event.target===uiSelect?'ui':'teaching',event.target.value);locale=nextState.teachingLocale;uiLocale=nextState.uiLocale;render();const next=new URL(location.href);next.searchParams.set('lang',locale);next.searchParams.set('ui',uiLocale);history.replaceState(null,'',next);}
select.addEventListener('change',changeLanguage);uiSelect.addEventListener('change',changeLanguage);
document.querySelector('.skip').textContent=UI[uiLocale].skip;main.textContent=UI[uiLocale].loading;
try{({catalog,mapping,lexicalAnalysis,dictionaryIndex}=await loadEntryPackage());data=withCatalog({units:{},localizations:{}},catalog);dictionaryResolver=createDictionaryResolver({index:dictionaryIndex,allowCandidate:true});let storage;try{storage=window.localStorage;}catch{storage=null;}selectedStore=createSelectedItemsStore({storage,lessonId:LESSON_ID});selectedCleanup=selectedStore.subscribe(refreshSelection);audioView=createAudioView({root:main,documents:{catalog,lexical:lexicalAnalysis},mapping,getUILocale:()=>uiLocale});render();window.addEventListener('pagehide',event=>{if(event.persisted){audioView.cancel();return;}selectedCleanup?.();audioView.dispose();});window.addEventListener('pageshow',event=>{if(event.persisted&&!selectedStore.state.pending)selectedStore.restore();});}catch(error){main.textContent=UI[uiLocale].error;main.setAttribute('role','alert');console.error(error);}
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

main.addEventListener('click',event=>{if(event.target.closest('[data-toggle-selected]')){const ref=selectionReference(currentSelection);if(ref){selectedStore.has(ref)?selectedStore.remove(ref):selectedStore.add(ref);(main.querySelector('[data-selected-retry]')??main.querySelector('[data-toggle-selected]'))?.focus();}}else if(event.target.closest('[data-selected-retry]')){selectedStore.state.error==='read'?selectedStore.restore():selectedStore.retrySave();(main.querySelector('[data-selected-retry]')??main.querySelector('[data-toggle-selected]'))?.focus();}});
window.addEventListener('storage',event=>{if(selectedStore&&event.key===selectedStore.key&&!selectedStore.state.pending)selectedStore.restore();});
