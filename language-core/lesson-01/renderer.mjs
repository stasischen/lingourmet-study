import {h,t,localize,UI,LOCALES} from './i18n.mjs';
import {unitText,sourceGroups,tokensForRange,withCatalog,validateLesson,resolveMeaning} from './model.mjs';
const list=(values,locale,cls='')=>values?.length?`<ul class="${cls}">${values.map(v=>`<li>${t(v,locale)}</li>`).join('')}</ul>`:'';
const field=(value,document,path,ctx)=>ctx?.renderField?ctx.renderField(value,document,path):h(value).replace(/\n/g,'<br>');
const audio=(data,selection,ctx)=>ctx?.audio?.(data,selection)??'';
const entryURL=(id,locale,uiLocale)=>`./knowledge.html?entry=${encodeURIComponent(id)}&lang=${encodeURIComponent(locale)}&ui=${encodeURIComponent(uiLocale)}`;
function tokenText(token){
 if(token.ruby?.length)return token.ruby.map(r=>r.reading?`<ruby>${h(r.text)}<rp>（</rp><rt>${h(r.reading)}</rt><rp>）</rp></ruby>`:h(r.text)).join('');
 if(token.reading&&/[一-龯]/u.test(token.text))return `<ruby>${h(token.text)}<rp>（</rp><rt>${h(token.reading)}</rt><rp>）</rp></ruby>`;
 return h(token.text);
}
export function unitHTML(id,data,{interactive=true,ctx}={}){
 const unit=data.units[id],chunks=interactive&&unit.chunks?.length>1?unit.chunks:[];
 const markup=unit.tokens.map(tok=>{
  const open=chunks.some(range=>range.from===tok.id)?'<span class="reading-chunk">':'';
  const close=chunks.some(range=>range.to===tok.id)?'</span>':'';
  const token=interactive&&!/^[。！？!?、\s]+$/u.test(tok.text)?`<button class="token" type="button" data-select-kind="token" data-select-unit="${h(id)}" data-select-id="${h(tok.id)}">${tokenText(tok)}</button>`:`<span>${tokenText(tok)}</span>`;
  return open+token+close;
 }).join('');
 return `<span class="unit" ${interactive?`id="unit-${h(id)}" data-unit="${h(id)}"`:""} lang="ja">${markup}</span>${audio(data,{unit:id,kind:'sentence'},ctx)}`;
}
function unitSupport(uid,data,locale,uiLocale,ctx){const loc=data.localizations[locale]?.units?.[uid];return `<div class="sentence-pair" data-sentence="${h(uid)}"><div class="source passage">${unitHTML(uid,data,{ctx})}</div><p class="translation">${h(loc?.meaning??loc?.translation??UI[uiLocale].missing)}</p></div>`;}
function speakerName(speakerId,data){const speaker=data.speakers?.[speakerId];if(speaker?.nameRef){const ref=speaker.nameRef;return tokensForRange(data.units[ref.unit],ref.from,ref.to).map(t=>t.text).join('');}return speaker?.name??speaker??speakerId;}
function renderSource(id,data,locale,uiLocale,ctx){
 const source=data.sources[id],loc=data.localizations[locale]?.sources?.[id],groups=sourceGroups(source),u=UI[uiLocale];
 return `<article class="material" id="source-${h(id)}" data-source-type="${h(source.type)}"><h3>${field(loc?.title??u.missing,'lesson',['localizations',locale,'sources',id,'title'],ctx)}</h3>${loc?.summary?`<p class="context">${field(loc.summary,'lesson',['localizations',locale,'sources',id,'summary'],ctx)}</p>`:''}<div class="dialogue ${source.type==='dialogue'?'':'prose'}">${groups.map(group=>`<div class="line" id="group-${h(group.id)}">${group.speakerId?`<p class="speaker">${h(speakerName(group.speakerId,data))}${data.speakers?.[group.speakerId]?.nameRef?audio(data,data.speakers[group.speakerId].nameRef,ctx):''}</p>`:''}${group.unitRefs.map(uid=>unitSupport(uid,data,locale,uiLocale,ctx)).join('')}</div>`).join('')}</div></article>`;
}
export function sourceRefs(refs,data,locale,uiLocale,ctx){
 const grouped=new Map();
 for(const ref of refs??[]){const text=tokensForRange(data.units[ref.unit],ref.from,ref.to).map(t=>t.text).join('');if(!grouped.has(text))grouped.set(text,[]);grouped.get(text).push(ref);}
 return [...grouped].map(([text,items])=>{
  const links=items.map(ref=>{
   let context='';
   for(const sid of data.sourceOrder??[]){const group=sourceGroups(data.sources[sid]).find(g=>g.unitRefs.includes(ref.unit));if(group){context=data.localizations[locale]?.sources?.[sid]?.title??UI[uiLocale].missing;if(group.speakerId)context+=` · ${speakerName(group.speakerId,data)}`;break;}}
   return `<a class="source-link" href="#unit-${h(ref.unit)}" data-source-unit="${h(ref.unit)}"${ref.from!==undefined?` data-source-from="${h(ref.from)}" data-source-to="${h(ref.to)}"`:''}>${h(context||UI[uiLocale].source)}</a>`;
  }).join('');
  return `<div class="source-reference"><span lang="ja">${h(text)}</span>${audio(data,items[0],ctx)}<div class="source-destinations">${links}</div></div>`;
 }).join('');
}
function renderExamples(refs,data,locale,uiLocale,ctx){return (refs??[]).map((id,index)=>{const example=data.examples?.[id];if(!example)return '';const loc=data.localizations[locale]?.examples?.[id];const groups=example.turns??[{unitRefs:example.unitRefs}];return `<div class="entry-example"><p class="example-label">${h(UI[uiLocale].examples)} ${index+1}</p>${groups.map(group=>`<div class="example-turn">${group.speakerId?`<p class="speaker">${t(example.roleLabels?.[group.speakerId]??group.speakerId,locale)}</p>`:''}<div class="source" lang="ja">${group.unitRefs.map(uid=>unitHTML(uid,data,{interactive:false,ctx})).join('')}</div>${group.unitRefs.map(uid=>`<p class="translation">${h(data.localizations[locale]?.units?.[uid]?.meaning??UI[uiLocale].missing)}</p>`).join('')}</div>`).join('')}</div>`;}).join('');}

function entryBody(entry,data,locale,uiLocale,ctx,id){const loc=entry.localizations?.[locale],u=UI[uiLocale];return `${loc?.explanation?`<p class="entry-explanation">${field(loc.explanation,'catalog',['entries',id,'localizations',locale,'explanation'],ctx)}</p>`:`<p class="missing">${h(u.missing)}</p>`}${loc?.usage?`<p>${field(loc.usage,'catalog',['entries',id,'localizations',locale,'usage'],ctx)}</p>`:''}${loc?.limits?`<p>${field(loc.limits,'catalog',['entries',id,'localizations',locale,'limits'],ctx)}</p>`:''}${renderExamples(entry.exampleRefs,data,locale,uiLocale,ctx)}`;}
function renderTeaching(data,catalog,locale,uiLocale,ctx){const u=UI[uiLocale];return(data.teachingRefs??[]).map((item,index)=>{const entry=catalog.entries[item.entryId];const loc=entry.localizations?.[locale];return `<article class="card teaching-entry" id="teaching-${h(item.id??index)}"><h3>${field(loc?.title??u.missing,'catalog',['entries',item.entryId,'localizations',locale,'title'],ctx)}</h3>${sourceRefs(item.sourceRefs,data,locale,uiLocale,ctx)}${item.context?`<p class="lesson-context"><strong>${h(u.context)}</strong> · ${field(localize(item.context,locale),'lesson',['teachingRefs',index,'context',locale],ctx)}</p>`:''}${entryBody(entry,data,locale,uiLocale,ctx,item.entryId)}<a class="entry-link" href="${entryURL(item.entryId,locale,uiLocale)}">${h(u.openEntry)} →</a></article>`;}).join('');}
export function selectionChoices(data,selection,locale){
 const unit=data.units[selection.unit];
 const range=selection.kind==='chunk'?unit.chunks.find(r=>r.id===selection.id):selection.kind==='span'?unit.spans.find(r=>r.id===selection.id):null;
 const anchor=selection.anchor??(selection.kind==='token'?selection.id:range?.from??unit.tokens[0].id);
 const choices=[{kind:'token',id:anchor}];
 for(const [kind,key] of [['span','spans'],['chunk','chunks']])for(const candidate of unit[key]??[])if(tokensForRange(unit,candidate.from,candidate.to).some(t=>t.id===anchor))choices.push({kind,id:candidate.id});
 choices.push({kind:'sentence'});
 const candidates=choices.map(choice=>({...choice,unit:selection.unit,anchor}));
 const signature=choice=>{const result=resolveMeaning(data,locale,choice);return JSON.stringify([result.text,result.meaning]);};
 const current=candidates.find(choice=>choice.kind===selection.kind&&choice.id===selection.id);
 const retained=current?[current]:[],seen=new Set(retained.map(signature));
 for(const choice of candidates){const key=signature(choice);if(!seen.has(key)){retained.push(choice);seen.add(key);}}
 return candidates.filter(choice=>retained.includes(choice));
}
export function selectionHTML(data,locale,selection,uiLocale=locale,ctx){
 const result=resolveMeaning(data,locale,selection),u=UI[uiLocale];
 const choices=selectionChoices(data,selection,locale);
 return `<button class="selection-close" type="button" data-close-selection aria-label="${h(u.close)}">×</button><div class="selection-choices" role="group" aria-label="${h(u.selection)}">${choices.map(choice=>`<button type="button" class="selection-choice" data-select-kind="${choice.kind}" data-select-unit="${h(choice.unit)}" data-select-id="${h(choice.id??'')}" data-select-anchor="${h(choice.anchor)}" aria-pressed="${choice.kind===selection.kind&&choice.id===selection.id}">${h(u[choice.kind])}</button>`).join('')}</div><p class="source" lang="ja">${h(result.text)}${audio(data,selection,ctx)}</p>${result.reading&&result.reading!==result.text?`<p lang="ja">${h(result.reading)}</p>`:''}<p>${h(result.meaning??u.missing)}</p>`;
}
export function renderLesson(raw,catalog,locale='zh-Hant',uiLocale=locale,ctx={}){
 if(!LOCALES.includes(uiLocale))uiLocale='zh-Hant';const data=withCatalog(raw,catalog),errors=validateLesson(data,catalog);if(errors.length)throw new Error(errors.join('\n'));
 const u=UI[uiLocale];if(!raw.localizations?.[locale])return `<section class="missing-language" role="status"><h1>${h(u.missing)}</h1></section>`;const loc=data.localizations[locale];
 if(ctx.phase&&ctx.phase!=='ready')return `<h1 lang="${h(locale)}">${h(loc.title)}</h1><section id="practice" class="stage"><div id="practice-root">${ctx.practiceHTML??''}</div></section>${ctx.phase==='material'?`<section id="material-view">${[...new Set((ctx.materialRefs??[]).map(ref=>ref.unit))].map(uid=>unitSupport(uid,data,locale,uiLocale,ctx)).join('')}</section>`:''}<aside id="selection-panel" class="selection-panel" role="region" aria-label="${h(u.selection)}" aria-live="polite" hidden></aside><p id="audio-status" role="status"></p>`;
 return `<div class="eyebrow">${h(u.draft)}</div><h1 lang="${h(locale)}">${h(loc.title??u.missing)}</h1><p class="context">${field(loc.intro??'','lesson',['localizations',locale,'intro'],ctx)}</p>${data.goalOrder?.length?`<h2>${h(u.goals)}</h2>${list(data.goalOrder.map(id=>loc.goals?.[id]??u.missing),locale)}`:''}<nav class="stage-nav" aria-label="${h(u.draft)}"><a href="#content">1 ${h(u.content)}</a><a href="#teaching">2 ${h(u.teaching)}</a><a href="#practice">3 ${h(u.practice)}</a></nav><section class="stage" id="content"><h2>1 · ${h(u.content)}</h2>${data.sourceOrder.map(id=>renderSource(id,data,locale,uiLocale,ctx)).join('')}${loc.readingNotes?`<details class="reading-notes"><summary>${h(u.readingNotes)}</summary><p>${h(loc.readingNotes)}</p></details>`:''}<a class="go-next" href="#teaching">${h(u.nextTeaching)}</a></section><section class="stage" id="teaching"><h2>2 · ${h(u.teaching)}</h2>${renderTeaching(data,catalog,locale,uiLocale,ctx)}<a class="go-next" href="#practice">${h(u.nextPractice)}</a></section><section class="stage" id="practice"><h2>3 · ${h(u.practice)}</h2><div id="practice-root">${ctx.practiceHTML??''}</div><a class="go-next" href="#content">${h(u.top)}</a></section><aside id="selection-panel" class="selection-panel" role="region" aria-label="${h(u.selection)}" aria-live="polite" hidden></aside><p id="audio-status" role="status"></p><footer>${h(u.footer)}</footer>`;
}
export function renderEntry(catalog,id,locale='zh-Hant',uiLocale=locale,ctx={}){
 const u=UI[uiLocale],entry=catalog.entries?.[id];if(!entry)return `<h1>${h(u.entryMissing)}</h1><a href="./?lang=${encodeURIComponent(locale)}&ui=${encodeURIComponent(uiLocale)}">${h(u.back)}</a>`;
 if(!catalog.localizations?.[locale]||!entry.localizations?.[locale])return `<section class="missing-language" role="status"><h1>${h(u.missing)}</h1></section>`;
 const loc=entry.localizations[locale],data={...catalog};
 return `<a href="./?lang=${encodeURIComponent(locale)}&ui=${encodeURIComponent(uiLocale)}">${h(u.back)}</a><p class="eyebrow">${h(u.entryDraft)}</p><h1 lang="${h(locale)}">${field(loc?.title??u.missing,'catalog',['entries',id,'localizations',locale,'title'],ctx)}</h1>${entryBody(entry,data,locale,uiLocale,ctx,id)}${entry.relatedRefs?.length?`<h2>${h(u.related)}</h2><ul>${entry.relatedRefs.map(ref=>`<li>${field(catalog.entries[ref]?.localizations?.[locale]?.title??u.missing,'catalog',['entries',ref,'localizations',locale,'title'],ctx)} · <a href="${entryURL(ref,locale,uiLocale)}">${h(u.openEntry)}</a></li>`).join('')}</ul>`:''}<p id="audio-status" role="status"></p>`;
}
