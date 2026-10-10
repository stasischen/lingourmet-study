export function tokensForRange(unit,from,to){
 if(!unit)throw new Error('Unknown unit');
 if(from===undefined&&to===undefined)return unit.tokens;
 if(from===undefined||to===undefined)throw new Error('Range requires both endpoints');
 const start=unit.tokens.findIndex(t=>t.id===from),end=unit.tokens.findIndex(t=>t.id===to);
 if(start<0||end<start)throw new Error(`Invalid token range ${from} → ${to}`);
 return unit.tokens.slice(start,end+1);
}
export const unitText=unit=>unit.tokens.map(t=>t.text).join('');
export function sourceGroups(source){return source.turns??source.paragraphs??[];}
export function resolveMeaning(data,locale,selection){
 const unit=data.units?.[selection.unit];if(!unit)throw new Error('Unknown selection unit');
 const loc=data.localizations?.[locale]?.units?.[selection.unit];
 if(selection.kind==='sentence')return {text:unitText(unit),meaning:loc?.meaning??loc?.translation??null};
 if(selection.kind==='token'){
  const token=unit.tokens.find(t=>t.id===selection.id);if(!token)throw new Error('Unknown token');
  return {text:token.text,meaning:loc?.tokens?.[selection.id]?.gloss??null,reading:token.reading??null};
 }
 const kind=selection.kind==='chunk'?'chunks':selection.kind==='span'?'spans':null;if(!kind)throw new Error('Unknown selection kind');
 const range=unit[kind]?.find(r=>r.id===selection.id);if(!range)throw new Error('Unknown reading range');
 return {text:tokensForRange(unit,range.from,range.to).map(t=>t.text).join(''),meaning:loc?.[kind]?.[selection.id]?.meaning??loc?.[kind]?.[selection.id]?.translation??null};
}
export function validateLesson(data,catalog){
 const errors=[];const units=data.units??{};
 for(const [id,unit] of Object.entries(units)){
  const seen=new Set();for(const token of unit.tokens??[]){if(!token.id||seen.has(token.id))errors.push(`${id}: duplicate token`);seen.add(token.id);if(typeof token.text!=='string')errors.push(`${id}: missing token text`);if(token.ruby&&token.ruby.map(r=>r.text).join('')!==token.text)errors.push(`${id}:${token.id}: ruby text differs`);}
  for(const kind of ['chunks','spans']){const ids=new Set(),covered=new Set();for(const range of unit[kind]??[]){if(range.from===undefined||range.to===undefined)errors.push(`${id}: ${kind} requires both endpoints`);if(ids.has(range.id))errors.push(`${id}: duplicate ${kind} id`);ids.add(range.id);try{const tokens=tokensForRange(unit,range.from,range.to);if(kind==='chunks'){for(const tok of tokens){if(covered.has(tok.id))errors.push(`${id}: overlapping chunks`);covered.add(tok.id);}const text=tokens.map(t=>t.text).join('');if(/[。！？!?].+/u.test(text))errors.push(`${id}: chunk crosses sentence boundary`);}}catch(e){errors.push(`${id}: ${e.message}`);}}}
 }
 for(const [locale,loc] of Object.entries(data.localizations??{}))for(const [uid,value] of Object.entries(loc.units??{})){
  const unit=units[uid];if(!unit){errors.push(`${locale}: unknown localized unit ${uid}`);continue;}
  for(const kind of ['tokens','chunks','spans']){const ids=new Set((unit[kind]??[]).map(x=>x.id));for(const id of Object.keys(value[kind]??{}))if(!ids.has(id))errors.push(`${locale}:${uid}: unknown localized ${kind} ${id}`);}
 }
 for(const sid of data.sourceOrder??[]){const source=data.sources?.[sid];if(!source){errors.push(`Missing source ${sid}`);continue;}for(const group of sourceGroups(source))for(const uid of group.unitRefs??[])if(!units[uid])errors.push(`${sid}: missing unit ${uid}`);}
 for(const item of [...data.teachingRefs??[],...data.practice?.items??[]]){
  for(const ref of item.sourceRefs??[]){try{tokensForRange(units[ref.unit],ref.from,ref.to);}catch(e){errors.push(`${item.id??item.entryId}: ${e.message}`);}}
  if(item.entryId&&!catalog?.entries?.[item.entryId])errors.push(`Missing knowledge entry ${item.entryId}`);
 }
 if(data.practice){
  const goals=data.goalOrder??[];if(!goals.length||new Set(goals).size!==goals.length)errors.push('Missing or duplicate shared goals');
  for(const loc of Object.values(data.localizations??{}))if(goals.some(id=>typeof loc.goals?.[id]!=='string'))errors.push('Missing localized goal');
  for(const item of data.practice.items??[]){
   if(!Array.isArray(item.entryRefs)||!item.entryRefs.length||item.entryRefs.some(id=>!catalog?.entries?.[id]))errors.push('Missing practice entry reference');
   if(item.responseType==='choice'){const ids=item.options?.map(o=>o.id)??[];if(!ids.length||ids.some(id=>!id)||new Set(ids).size!==ids.length||!ids.includes(item.answer))errors.push('Invalid stable choice IDs');}
  }
 }
 for(const [id,entry] of Object.entries(catalog?.entries??{})){
  for(const ref of entry.relatedRefs??[])if(!catalog.entries[ref])errors.push(`${id}: missing related entry ${ref}`);
  for(const ref of entry.exampleRefs??[])if(!data.examples?.[ref]&&!catalog.examples?.[ref])errors.push(`${id}: missing example ${ref}`);
 }
 return errors;
}

export function withCatalog(lesson,catalog){
 const result={...lesson,entries:{...catalog.entries,...lesson.entries},unitOwners:{...Object.fromEntries(Object.keys(catalog.units??{}).map(id=>[id,'catalog'])),...Object.fromEntries(Object.keys(lesson.units??{}).map(id=>[id,'lesson']))},units:{...catalog.units,...lesson.units},examples:{...catalog.examples,...lesson.examples},localizations:{}};
 for(const locale of new Set([...Object.keys(catalog.localizations??{}),...Object.keys(lesson.localizations??{})]))result.localizations[locale]={...catalog.localizations?.[locale],...lesson.localizations?.[locale],units:{...catalog.localizations?.[locale]?.units,...lesson.localizations?.[locale]?.units}};
 return result;
}

/** Resolve reviewed occurrence fields without creating lexical facts or locale fallbacks. */
export function lexicalSelectionChoices(data,analysis,selection){
 const unit=data.units?.[selection.unit];if(!unit)return [];
 const anchor=selection.anchor??(selection.kind==='token'?selection.id:null);
 return Object.entries(analysis?.expressions??{}).filter(([,entry])=>{
  if(entry.target.unitId!==selection.unit)return false;
  try{return tokensForRange(unit,entry.target.fromTokenId,entry.target.toTokenId).some(token=>token.id===anchor);}catch{return false;}
 }).map(([id])=>({kind:'expression',unit:selection.unit,id,anchor}));
}
export function resolveLexicalSelection(data,analysis,locale,selection,{dictionaryResolver}={}){
 const unit=data.units?.[selection.unit];if(!unit)throw new Error('Unknown lexical unit');
 const isExpression=selection.kind==='expression';
 const pair=isExpression?[selection.id,analysis?.expressions?.[selection.id]]:Object.entries(analysis?.annotations??{}).find(([,entry])=>entry.target?.unitId===selection.unit&&entry.target?.tokenId===selection.id);
 if(!pair?.[1])return null;
 const [id,entry]=pair,target=entry.target;
 if(data.unitOwners?.[selection.unit]&&data.unitOwners[selection.unit]!==target.document)throw new Error('Lexical source owner mismatch');
 if(isExpression){const span=unit.spans?.find(span=>span.id===target.spanId);if(!span||span.from!==target.fromTokenId||span.to!==target.toTokenId)throw new Error('Stale lexical expression range');}
 if(target.unitId!==selection.unit)throw new Error('Lexical target unit mismatch');
 const tokens=tokensForRange(unit,isExpression?target.fromTokenId:target.tokenId,isExpression?target.toTokenId:target.tokenId);
 const text=tokens.map(t=>t.text).join('');if(text!==entry.surface)throw new Error('Stale lexical surface');
 const loc=analysis.localizations?.[locale],copy=loc?.[isExpression?'expressions':'annotations']?.[id];
 const fields=entry.analysis??{};
 const pos=fields.pos?.state==='known'?loc?.labels?.pos?.[fields.pos.value]??null:null;
 const features=fields.features?.state==='known'?Object.entries(fields.features.value??{}).map(([key,value])=>({key,value,label:loc?.labels?.features?.[key]?.[value]??null})):[];
 const parts=fields.parts?.state==='known'?(Array.isArray(fields.parts.value)?fields.parts.value:[]):[];
 const lookup=entry.dictionaryLookup??(fields.lemma?.state==='known'&&fields.pos?.state==='known'?{language:'ja',lemma:fields.lemma.value.text,pos:fields.pos.value}:null);
 const dictionary=lookup&&dictionaryResolver?dictionaryResolver.lookup({...lookup,locale}):null;
 return {id,annotationId:id,surface:text,kind:isExpression?'expression':'token',target,text,reading:tokens.map(t=>t.reading??t.ruby?.map(r=>r.reading??r.text).join('')??t.text).join(''),meaning:copy?.[isExpression?'meaning':'contextMeaning']??null,usage:fields.usage?.state==='known'||isExpression?copy?.usage??null:null,analysis:fields,lemma:fields.lemma?.state==='known'?fields.lemma.value?.text??null:null,pos,features,parts,localizedParts:copy?.parts??null,partLabels:loc?.labels?.pos??{},expressionRefs:entry.expressionRefs??[],componentIds:entry.componentIds??[],audioTargets:entry.audioTargets??{},dictionary,localization:copy??null};
}
