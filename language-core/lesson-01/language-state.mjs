import {LOCALES} from './i18n.mjs';
export function initialLanguages(params){
 return {teachingLocale:params.get('lang')??'zh-Hant',uiLocale:LOCALES.includes(params.get('ui'))?params.get('ui'):'zh-Hant'};
}
export function nextLanguages(state,field,value){
 if(field==='ui')return {...state,uiLocale:LOCALES.includes(value)?value:state.uiLocale};
 if(field==='teaching')return {...state,teachingLocale:value};
 return {...state};
}
export function syncTeachingSelector(select,teachingLocale,uiLocale){
 select.querySelectorAll('[data-unsupported]').forEach(option=>option.remove());
 if(!LOCALES.includes(teachingLocale)){
  const option=select.ownerDocument.createElement('option');option.value=teachingLocale;option.dataset.unsupported='true';
  try{option.textContent=new Intl.DisplayNames([uiLocale],{type:'language'}).of(teachingLocale)||teachingLocale;}catch{option.textContent=teachingLocale;}
  select.append(option);
 }
 select.value=teachingLocale;
}
