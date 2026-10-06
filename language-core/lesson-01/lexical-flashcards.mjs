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
 return {cards,data:{...data,units:{...data.units,...units},localizations:Object.fromEntries(Object.entries(localizations).map(([locale,loc])=>[locale,{...data.localizations?.[locale],units:{...data.localizations?.[locale]?.units,...loc.units}}]))}};
}
