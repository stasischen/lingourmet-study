import {DICTIONARY_PREDECESSOR} from './dictionary-progress-predecessor.mjs';
import {LEXICAL_COPY_PREDECESSOR} from './lexical-progress-predecessor.mjs';
import {tokensForRange,resolveLexicalSelection} from './model.mjs';
import {valueAt} from './pronunciation.mjs';
/** Derive a view-only deck from explicit teaching selections, without rewriting source units. */
export function buildLexicalFlashcardProjection(data,analysis,selections){
 const units={},localizations=Object.fromEntries(Object.keys(analysis.localizations??{}).map(locale=>[locale,{units:{}}])),cards=[],seen=new Set(),dedup=new Set();
 for(const item of selections?.items??[]){
  if(!item.practiceKey||seen.has(item.practiceKey)||!item.deduplication?.key||dedup.has(item.deduplication.key))throw new Error('Duplicate or missing lexical practice identity');seen.add(item.practiceKey);dedup.add(item.deduplication.key);
  const id=item.annotationId??item.expressionId,entry=analysis[item.kind==='token'?'annotations':'expressions']?.[id];if(!entry||JSON.stringify(entry.target)!==JSON.stringify(item.target))throw new Error('Stale lexical practice target');
  const target=item.target,selection={kind:item.kind,unit:target.unitId,id:item.kind==='token'?target.tokenId:id};
  // Resolving also checks source ownership, exact surface and existing expression endpoints.
  resolveLexicalSelection(data,analysis,Object.keys(localizations)[0],selection);
  const from=target.tokenId??target.fromTokenId,to=target.tokenId??target.toTokenId,tokens=tokensForRange(data.units[target.unitId],from,to);
  const unit='lexical:'+item.practiceKey;units[unit]={tokens:structuredClone(tokens)};
  for(const locale of Object.keys(localizations)){const meaning=valueAt(analysis,item.meaningRefs?.[locale]??[]);if(typeof meaning!=='string'||!meaning.trim())throw new Error('Missing lexical practice meaning: '+locale);localizations[locale].units[unit]={meaning};}
  for(const template of ['recognition','production','listening'])cards.push({id:`flash:${template}:${item.practiceKey}`,template,unit,sourceRefs:[{unit:target.unitId,from,to}],signature:JSON.stringify({practiceKey:item.practiceKey,practiceVersion:item.practiceVersion,template,target,tokens}),lexicalRef:id});
 }
 const projected={...data,units:{...data.units,...units},localizations:Object.fromEntries(Object.entries(localizations).map(([locale,loc])=>[locale,{...data.localizations?.[locale],units:{...data.localizations?.[locale]?.units,...loc.units}}]))};
 const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
 const version='source-lexical-v2-u01-copy',unchanged={},removed={},added=[];
 const previous=LEXICAL_COPY_PREDECESSOR.cards;
 if(cards.length!==27||canonical(cards.map(c=>c.id))!==canonical(previous.map(p=>p.card.id)))throw Error('Unexpected lexical copy revision scope');
 const revised=cards.map(card=>{
  const prior=previous.find(p=>p.card.id===card.id);
  if(canonical(card)!==canonical(prior.card))throw Error('Lexical practice identity changed beyond approved copy');
  const visibleFacts={unit:card.unit,tokens:projected.units[card.unit].tokens,meanings:Object.fromEntries(['zh-Hant','en','ja'].map(locale=>[locale,projected.localizations[locale]?.units[card.unit]?.meaning])),sourceRefs:card.sourceRefs,lexicalRef:card.lexicalRef};
  const expected=structuredClone(prior.visibleFacts),changed=card.id===`flash:${card.template}:lesson01.lexical.goodwill-greeting`;
  if(changed){if(expected.meanings['zh-Hant']!=='請多關照')throw Error('Unexpected lexical prior wording');expected.meanings['zh-Hant']='請多指教';}
  if(canonical(visibleFacts)!==canonical(expected))throw Error('Unexpected visible lexical copy change');
  const id=changed?card.id+':u01-copy':card.id,signature=canonical({format:'lingourmet.lexical-visible-facts.v2',practiceSignature:card.signature,...visibleFacts});
  if(changed){removed[card.id]={previousSignatures:[prior.card.signature]};added.push(id);return {...card,id,signature};}
  unchanged[id]={currentSignature:signature,previousSignatures:[prior.card.signature]};return {...card,signature,compatiblePriorSignatures:[prior.card.signature]};
 });
 if(Object.keys(unchanged).length!==24||Object.keys(removed).length!==3||added.length!==3)throw Error('Invalid lexical copy migration partition');
 return {cards:revised,data:projected,version,migration:{kind:'lexical-copy',fromVersion:LEXICAL_COPY_PREDECESSOR.version,toVersion:version,unchanged,removed,added}};
}

/** Separate recognition-only vocabulary deck. Dictionary identity is never an occurrence. */
export function buildDictionaryRecognitionProjection(data,selections,index){
 const units={},localizations=Object.fromEntries(['ja','zh-Hant','en'].map(locale=>[locale,{units:{}}])),cards=[],seen=new Set(),keys=new Set();
 for(const item of selections?.dictionarySelections??[]){
  const record=index?.entries?.find(e=>e.key===item.dictionaryKey);
  if(index?.format!=='lingourmet.dictionary-preview.v1'||index.availability!=='candidate'||index.snapshot!==item.dictionarySnapshot||!record||record.status!=='candidate'||record.language!=='ja'||JSON.stringify(record)!==JSON.stringify(item.record))throw new Error('Stale dictionary recognition identity');
  if(typeof item.practiceKey!=='string'||!item.practiceKey.trim()||seen.has(item.practiceKey)||keys.has(record.key)||!Number.isSafeInteger(item.practiceVersion)||item.practiceVersion<1)throw new Error('Invalid dictionary practice identity');
  seen.add(item.practiceKey);keys.add(record.key);
  if(Object.keys(record.definitions??{}).sort().join('|')!==['en','ja','zh-Hant'].join('|')||Object.values(record.definitions).some(v=>typeof v!=='string'||!v.trim()))throw new Error('Missing dictionary recognition locale');
  const unit='dictionary:'+item.practiceKey;units[unit]={tokens:[{id:'t1',text:record.lemma,reading:record.pronunciation?.speech??record.lemma}]};
  for(const locale of Object.keys(localizations))localizations[locale].units[unit]={meaning:record.definitions[locale]};
  cards.push({id:'flash:recognition:'+item.practiceKey,template:'recognition',unit,sourceRefs:[],signature:JSON.stringify({practiceKey:item.practiceKey,practiceVersion:item.practiceVersion,dictionarySnapshot:item.dictionarySnapshot,record})});
 }
 const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
 const previous=DICTIONARY_PREDECESSOR.map(item=>({id:'flash:recognition:'+item.practiceKey,signature:JSON.stringify({practiceKey:item.practiceKey,practiceVersion:item.practiceVersion,dictionarySnapshot:item.dictionarySnapshot,record:item.record})}));
 if(cards.length!==21||canonical(cards.map(c=>c.id))!==canonical(previous.map(c=>c.id)))throw Error('Unexpected dictionary revision scope');
 const unchanged={},removed={},added=[];
 const revised=cards.map((card,i)=>{
  const prior=DICTIONARY_PREDECESSOR[i],item=selections.dictionarySelections[i],expected=structuredClone(prior);
  expected.dictionarySnapshot=item.dictionarySnapshot;
  const changed=prior.dictionaryKey==='lp-623e0a60beca9efe';
  if(changed){if(expected.record.definitions.ja!=='この課ではアメリカ合衆国')throw Error('Unexpected dictionary prior wording');expected.record.definitions.ja='アメリカ合衆国のこと';}
  if(canonical(expected)!==canonical(item))throw Error('Unexpected dictionary visible copy change');
  if(changed){removed[card.id]={template:'recognition',previousSignatures:[previous[i].signature]};const id=card.id+':definition-v2';added.push(id);return {...card,id};}
  unchanged[card.id]={currentSignature:card.signature,previousSignatures:[previous[i].signature]};return {...card,compatiblePriorSignatures:[previous[i].signature]};
 });
 const version='dictionary-recognition-v2:'+JSON.stringify(revised.map(c=>[c.id,c.signature]));
 return {cards:revised,data:{...data,units:{...data.units,...units},localizations:Object.fromEntries(Object.entries(localizations).map(([locale,loc])=>[locale,{...data.localizations?.[locale],units:{...data.localizations?.[locale]?.units,...loc.units}}]))},version,migration:{kind:'dictionary-copy',fromVersion:'dictionary-recognition-v1:'+JSON.stringify(previous.map(c=>[c.id,c.signature])),toVersion:version,unchanged,removed,added}};
}
