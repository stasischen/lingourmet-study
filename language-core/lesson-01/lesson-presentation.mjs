import {LESSON_PRESENTATION_SHA256} from './lesson-presentation-lock.mjs';
import {h,UI} from './i18n.mjs';
const locales=['zh-Hant','en','ja'];
const ranges=[['T01.s1','t1','t1'],['T05.s1','t1','t2'],['T06.s1','t1','t1']];
const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
const fail=()=>{throw new Error('Invalid bounded lesson presentation');};
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
/** Admission belongs to the package boundary, never a best-effort copy fallback. */
export function validateLessonPresentation(value,{lesson,catalog,analysis}){
 if(value?.format!=='lingourmet.lesson-presentation.bounded-adapter.v1'||value.version!==2||value.ownerId!=='L'||value.groupId!=='first-meeting-routines')fail();
 const p=value.presentation,g=lesson.teachingGroups?.find(g=>g.id===value.groupId);
 if(!g||!equal(g.teachingRefIds,['E01','E02'])||p?.kind!=='ref-backed-contrast'||p.inlineExamples!==false||!equal(p.entryRefIds,g.teachingRefIds))fail();
 if(!equal(Object.keys(p.localizations).sort(),[...locales].sort())||value.targets?.length!==3)fail();
 for(const locale of locales){
  const runs=p.localizations[locale]?.runs;if(!Array.isArray(runs)||runs.length!==7)fail();
  for(let i=0;i<runs.length;i++){
   const run=runs[i];if(i%2===0){if(!equal(Object.keys(run),['text'])||typeof run.text!=='string')fail();continue;}
   const [unit,from,to]=ranges[(i-1)/2],target=value.targets[(i-1)/2];
   if(!equal(run,{ref:{sourceId:'L',unit,from,to}})||!equal(target.lookup,{kind:'expression',unit,id:`lesson:${unit}:e1`})||!equal(target.audio,{kind:'span',unit,id:'e1'})||target.sourceId!=='L'||target.unit!==unit)fail();
   const span=lesson.units[unit]?.spans?.find(s=>s.id==='e1'),expression=analysis.expressions?.[target.lookup.id];
   if(span?.from!==from||span?.to!==to||!equal(expression?.target,{document:'lesson',unitId:unit,spanId:'e1',fromTokenId:from,toTokenId:to}))fail();
  }
 }
 for(const id of p.entryRefIds){const ref=lesson.teachingRefs.find(r=>r.id===id);if(!ref||!catalog.entries[ref.entryId]?.exampleRefs?.includes('X01'))fail();}
 return value;
}
export async function loadLessonPresentation(fetcher,digest,{lesson,catalog,analysis,texts}){
 const response=await fetcher('./lesson-presentation.json');if(!response.ok)fail();const raw=await response.text();
 if(await digest(raw)!==LESSON_PRESENTATION_SHA256)fail();const value=JSON.parse(raw);
 for(const [name,text] of Object.entries(texts))if(value.sourceFiles?.[name]!==await digest(text))fail();
 return freeze(validateLessonPresentation(value,{lesson,catalog,analysis}));
}
/** Localized teaching prose remains visible, as other teaching explanations do.
 * The reading-translation toggle applies only to data-original-translation. */
export function renderLessonContrast(value,group,data,locale,uiLocale,ctx){
 if(!locales.includes(locale)||!locales.includes(uiLocale)||value?.groupId!==group.id)fail();
 const p=value.presentation,copy=p.localizations[locale];if(!copy)fail();
 let index=0;const body=copy.runs.map(run=>{
  if(Object.hasOwn(run,'text'))return h(run.text);
  const target=value.targets[index++],ref=run.ref,[unit,from,to]=ranges[index-1];
  if(!equal(ref,{sourceId:'L',unit,from,to}))fail();
  const tokens=data.units[unit].tokens,start=tokens.findIndex(t=>t.id===from),end=tokens.findIndex(t=>t.id===to);if(start<0||end<start)fail();
  const text=tokens.slice(start,end+1).map(t=>t.text).join('');
  return `<span class="contrast-target" data-contrast-ref="${h(unit)}"><button type="button" class="token contrast-lookup" lang="ja" data-select-kind="expression" data-select-unit="${h(unit)}" data-select-id="${h(target.lookup.id)}">${h(text)}</button>${ctx?.audio?.(data,target.audio)??''}</span>`;
 }).join('');
 const links=p.entryRefIds.map(id=>{const entry=data.teachingRefs.find(r=>r.id===id);return `<a class="entry-link" href="./knowledge.html?entry=${encodeURIComponent(entry.entryId)}&lang=${encodeURIComponent(locale)}&ui=${encodeURIComponent(uiLocale)}">${h(group.localizations[locale].members[id].title)} · ${h(UI[uiLocale].openEntry)}</a>`;}).join(' · ');
 return `<article class="card teaching-entry teaching-group" id="teaching-${h(group.id)}" data-teaching-group="${h(group.id)}"><h3>${h(group.localizations[locale].title)}</h3><p class="lesson-contrast" lang="${h(locale)}">${body}</p><div class="contrast-entry-links">${links}</div></article>`;
}
