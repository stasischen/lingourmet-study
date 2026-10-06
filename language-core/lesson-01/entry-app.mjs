import {UI} from './i18n.mjs';
import {initialLanguages,nextLanguages,syncTeachingSelector} from './language-state.mjs';
import {renderEntry} from './renderer.mjs';
const main=document.querySelector('#main'),select=document.querySelector('#teaching-language'),uiSelect=document.querySelector('#ui-language'),url=new URL(location.href);
const initial=initialLanguages(url.searchParams);let locale=initial.teachingLocale,uiLocale=initial.uiLocale;
const id=url.searchParams.get('entry');let catalog;
function render(){document.documentElement.lang=uiLocale;document.querySelector('.skip').textContent=UI[uiLocale].skip;syncTeachingSelector(select,locale,uiLocale);uiSelect.value=uiLocale;main.dataset.teachingLocale=locale;document.querySelector('#language-label').textContent=UI[uiLocale].language;document.querySelector('#ui-language-label').textContent=UI[uiLocale].interfaceLanguage;main.innerHTML=renderEntry(catalog,id,locale,uiLocale);document.title=`${catalog.entries?.[id]?.localizations?.[locale]?.title??'Knowledge'} · Lingourmet`;}
function changeLanguage(event){const nextState=nextLanguages({teachingLocale:locale,uiLocale},event.target===uiSelect?'ui':'teaching',event.target.value);locale=nextState.teachingLocale;uiLocale=nextState.uiLocale;render();const next=new URL(location.href);next.searchParams.set('lang',locale);next.searchParams.set('ui',uiLocale);history.replaceState(null,'',next);}
select.addEventListener('change',changeLanguage);uiSelect.addEventListener('change',changeLanguage);
document.querySelector('.skip').textContent=UI[uiLocale].skip;main.textContent=UI[uiLocale].loading;
try{const response=await fetch('./knowledge-catalog.json');if(!response.ok)throw new Error('Catalog unavailable');catalog=await response.json();render();}catch(error){main.textContent=UI[uiLocale].error;main.setAttribute('role','alert');console.error(error);}
