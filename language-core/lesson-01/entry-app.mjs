import {createAudioView} from './audio-view.mjs';
import {UI} from './i18n.mjs';
import {initialLanguages,nextLanguages,syncTeachingSelector} from './language-state.mjs';
import {renderEntry} from './renderer.mjs';
const main=document.querySelector('#main'),select=document.querySelector('#teaching-language'),uiSelect=document.querySelector('#ui-language'),url=new URL(location.href);
const initial=initialLanguages(url.searchParams);let locale=initial.teachingLocale,uiLocale=initial.uiLocale;
const id=url.searchParams.get('entry');let catalog,mapping,audioView;
function render(){audioView.begin();document.documentElement.lang=uiLocale;document.querySelector('.skip').textContent=UI[uiLocale].skip;syncTeachingSelector(select,locale,uiLocale);uiSelect.value=uiLocale;main.dataset.teachingLocale=locale;document.querySelector('#language-label').textContent=UI[uiLocale].language;document.querySelector('#ui-language-label').textContent=UI[uiLocale].interfaceLanguage;main.innerHTML=renderEntry(catalog,id,locale,uiLocale,audioView);audioView.bind();document.title=`${catalog.entries?.[id]?.localizations?.[locale]?.title??UI[uiLocale].entryDraft} · Lingourmet`;}
function changeLanguage(event){const nextState=nextLanguages({teachingLocale:locale,uiLocale},event.target===uiSelect?'ui':'teaching',event.target.value);locale=nextState.teachingLocale;uiLocale=nextState.uiLocale;render();const next=new URL(location.href);next.searchParams.set('lang',locale);next.searchParams.set('ui',uiLocale);history.replaceState(null,'',next);}
select.addEventListener('change',changeLanguage);uiSelect.addEventListener('change',changeLanguage);
document.querySelector('.skip').textContent=UI[uiLocale].skip;main.textContent=UI[uiLocale].loading;
try{const responses=await Promise.all(['./knowledge-catalog.json','./target-mapping.json'].map(url=>fetch(url)));if(responses.some(r=>!r.ok))throw new Error('Catalog unavailable');[catalog,mapping]=await Promise.all(responses.map(r=>r.json()));audioView=createAudioView({root:main,documents:{catalog},mapping,getUILocale:()=>uiLocale});render();window.addEventListener('pagehide',()=>audioView.dispose(),{once:true});}catch(error){main.textContent=UI[uiLocale].error;main.setAttribute('role','alert');console.error(error);}
