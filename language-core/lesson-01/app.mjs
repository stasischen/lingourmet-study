import {UI} from './i18n.mjs';
import {initialLanguages,nextLanguages,syncTeachingSelector} from './language-state.mjs';
import {renderLesson,selectionHTML} from './renderer.mjs';
import {withCatalog,tokensForRange} from './model.mjs';
const main=document.querySelector('#main'),select=document.querySelector('#teaching-language'),uiSelect=document.querySelector('#ui-language');
const initial=initialLanguages(new URL(location.href).searchParams);let locale=initial.teachingLocale,uiLocale=initial.uiLocale;
let lesson,catalog,data,selection=null;const drafts=new Map();
function render(){
 document.querySelectorAll('[data-draft-id]').forEach(el=>drafts.set(el.dataset.draftId,el.value));
 document.documentElement.lang=uiLocale;document.querySelector('.skip').textContent=UI[uiLocale].skip;syncTeachingSelector(select,locale,uiLocale);uiSelect.value=uiLocale;main.dataset.teachingLocale=locale;
 document.querySelector('#language-label').textContent=UI[uiLocale].language;document.querySelector('#ui-language-label').textContent=UI[uiLocale].interfaceLanguage;
 document.title=`${lesson.localizations[locale]?.title??'Lingourmet'} · Lingourmet`;
 main.innerHTML=renderLesson(lesson,catalog,locale,uiLocale);
 document.querySelectorAll('[data-draft-id]').forEach(el=>el.value=drafts.get(el.dataset.draftId)??'');
 if(selection&&lesson.localizations?.[locale])showSelection(selection);
}
function clearHighlight(){document.querySelectorAll('.token.selected').forEach(el=>{el.classList.remove('selected');el.removeAttribute('aria-pressed');});}
function highlight(unit,from,to){clearHighlight();const ids=new Set(tokensForRange(data.units[unit],from,to).map(t=>t.id));document.querySelectorAll('[data-select-kind="token"]').forEach(el=>{if(el.dataset.selectUnit===unit&&ids.has(el.dataset.selectId)){el.classList.add('selected');el.setAttribute('aria-pressed','true');}});}
function showSelection(value){
 selection=value;const panel=document.querySelector('#selection-panel');panel.innerHTML=selectionHTML(data,locale,value,uiLocale);panel.hidden=false;
 const unit=data.units[value.unit];
 if(value.kind==='sentence')highlight(value.unit);
 else if(value.kind==='token')highlight(value.unit,value.id,value.id);
 else{const range=unit[value.kind==='chunk'?'chunks':'spans'].find(r=>r.id===value.id);highlight(value.unit,range.from,range.to);}
}
main.addEventListener('click',event=>{
 const clicked=event.target.closest('[data-select-kind]');if(clicked){showSelection({unit:clicked.dataset.selectUnit,kind:clicked.dataset.selectKind,id:clicked.dataset.selectId});return;}
 if(event.target.closest('[data-close-selection]')){selection=null;document.querySelector('#selection-panel').hidden=true;clearHighlight();return;}
 const ref=event.target.closest('[data-source-unit]');if(ref){const {sourceUnit:unit,sourceFrom:from,sourceTo:to}=ref.dataset;
  if(from===undefined)showSelection({unit,kind:'sentence'});
  else if(from===to)showSelection({unit,kind:'token',id:from});
  else {const source=data.units[unit];let kind='span',range=source.spans?.find(r=>r.from===from&&r.to===to);if(!range){kind='chunk';range=source.chunks?.find(r=>r.from===from&&r.to===to);}if(range)showSelection({unit,kind,id:range.id});else {selection=null;document.querySelector('#selection-panel').hidden=true;highlight(unit,from,to);}}
 }
});
main.addEventListener('keydown',event=>{if(event.key==='Escape'){selection=null;const panel=document.querySelector('#selection-panel');if(panel)panel.hidden=true;clearHighlight();}});
function changeLanguage(event){const next=nextLanguages({teachingLocale:locale,uiLocale},event.target===uiSelect?'ui':'teaching',event.target.value);locale=next.teachingLocale;uiLocale=next.uiLocale;render();const url=new URL(location.href);url.searchParams.set('lang',locale);url.searchParams.set('ui',uiLocale);history.replaceState(null,'',url);}
select.addEventListener('change',changeLanguage);uiSelect.addEventListener('change',changeLanguage);
document.querySelector('.skip').textContent=UI[uiLocale].skip;main.textContent=UI[uiLocale].loading;
try{const responses=await Promise.all(['./lesson.json','./knowledge-catalog.json'].map(url=>fetch(url)));if(responses.some(r=>!r.ok))throw new Error('Lesson files unavailable');[lesson,catalog]=await Promise.all(responses.map(r=>r.json()));data=withCatalog(lesson,catalog);render();}catch(error){main.textContent=UI[uiLocale].error;main.setAttribute('role','alert');console.error(error);}
