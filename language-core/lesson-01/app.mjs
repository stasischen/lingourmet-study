import {createPracticeController,renderPracticeSession,bindPracticeSession,currentItemId,getPracticeAudioAccess,PRACTICE_LABELS} from './practice-session.mjs';
import {createAudioView} from './audio-view.mjs';
import {resolveUnitTarget} from './pronunciation.mjs';
import {UI} from './i18n.mjs';
import {initialLanguages,nextLanguages,syncTeachingSelector} from './language-state.mjs';
import {renderLesson,selectionHTML} from './renderer.mjs';
import {withCatalog,tokensForRange} from './model.mjs';
const main=document.querySelector('#main'),select=document.querySelector('#teaching-language'),uiSelect=document.querySelector('#ui-language');
const initial=initialLanguages(new URL(location.href).searchParams);let locale=initial.teachingLocale,uiLocale=initial.uiLocale;
let lesson,catalog,data,mapping,session,audioView,practiceCleanup,selection=null,showLesson=false;
function render(){
 audioView.begin();practiceCleanup?.();practiceCleanup=null;
 document.documentElement.lang=uiLocale;document.querySelector('.skip').textContent=UI[uiLocale].skip;syncTeachingSelector(select,locale,uiLocale);uiSelect.value=uiLocale;main.dataset.teachingLocale=locale;
 document.querySelector('#language-label').textContent=UI[uiLocale].language;document.querySelector('#ui-language-label').textContent=UI[uiLocale].interfaceLanguage;
 document.title=`${lesson.localizations[locale]?.title??'Lingourmet'} · Lingourmet`;
 let practiceHTML=renderPracticeSession(session.state,lesson,{renderField:(value,path,options)=>audioView.renderField(value,'lesson',path,options)});
 if(session.state.phase==='complete'&&!showLesson)practiceHTML+=`<button class="go-next" type="button" data-back-content>${UI[uiLocale].backContent}</button>`;
 const item=lesson.practice.items.find(item=>item.id===currentItemId(session.state));
 main.innerHTML=renderLesson(lesson,catalog,locale,uiLocale,{...audioView,practiceHTML,phase:showLesson?'ready':session.state.phase,materialRefs:item?.sourceRefs});
 const practiceRoot=main.querySelector('#practice-root');
 if(practiceRoot)practiceCleanup=bindPracticeSession(practiceRoot,session,{lesson,onChange:(_state,event)=>{
  if(event.type==='draft'||event.type==='select'){updatePracticeError();return;}
  if(['start','restart'].includes(event.type))showLesson=false;selection=null;render();if(['start','assess','skip','previous','restart','return','retry-save'].includes(event.type))main.querySelector('[data-practice-focus]')?.focus();
 }});
 if(practiceRoot){const error=document.createElement('p');error.id='practice-save-status';error.setAttribute('role','alert');error.hidden=true;practiceRoot.append(error);}
 audioView.bind();

 if(selection&&lesson.localizations?.[locale])showSelection(selection);
}
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
 audioView.cancel();selection=value;const panel=document.querySelector('#selection-panel');panel.innerHTML=selectionHTML(data,locale,value,uiLocale,audioView);panel.hidden=false;audioView.sync();
 const unit=data.units[value.unit];
 if(value.kind==='sentence')highlight(value.unit);
 else if(value.kind==='token')highlight(value.unit,value.id,value.id);
 else{const range=unit[value.kind==='chunk'?'chunks':'spans'].find(r=>r.id===value.id);highlight(value.unit,range.from,range.to);}
}
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
function changeLanguage(event){const next=nextLanguages({teachingLocale:locale,uiLocale},event.target===uiSelect?'ui':'teaching',event.target.value);locale=next.teachingLocale;uiLocale=next.uiLocale;selection=null;practiceCleanup?.();practiceCleanup=null;session.dispatch({type:'locale',locale,uiLocale});render();const url=new URL(location.href);url.searchParams.set('lang',locale);url.searchParams.set('ui',uiLocale);history.replaceState(null,'',url);}
select.addEventListener('change',changeLanguage);uiSelect.addEventListener('change',changeLanguage);
document.querySelector('.skip').textContent=UI[uiLocale].skip;main.textContent=UI[uiLocale].loading;
try{const responses=await Promise.all(['./lesson.json','./knowledge-catalog.json','./target-mapping.json'].map(url=>fetch(url)));if(responses.some(r=>!r.ok))throw new Error('Lesson files unavailable');[lesson,catalog,mapping]=await Promise.all(responses.map(r=>r.json()));data=withCatalog(lesson,catalog);
 let storage;try{storage=window.localStorage;}catch{storage=null;}
 session=createPracticeController({lesson,lessonId:'multisource-first-lesson-pilot',practiceVersion:lesson.practice.representationVersion,storage,locale,uiLocale});
 audioView=createAudioView({root:main,documents:{lesson,catalog},mapping,getAccess:()=>getPracticeAudioAccess(session.state),getUILocale:()=>uiLocale});render();
 window.addEventListener('pagehide',()=>{practiceCleanup?.();audioView.dispose();},{once:true});
}catch(error){main.textContent=UI[uiLocale].error;main.setAttribute('role','alert');console.error(error);}
