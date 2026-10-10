import {resolveUnitTarget} from './pronunciation.mjs';
/** Explicit author-owned source/field targets only. Parts retain exact UTF-16 source guards. */
export function resolveLexicalAudioTarget(documents,target){
 if(target?.targetLanguage!=='ja')return null;
 if(target.source){const ref=target.source,document=documents[ref.document];if(!document)throw new Error('Unknown lexical audio owner');
  const resolved=resolveUnitTarget(document,{unit:ref.unitId,from:ref.tokenId??ref.fromTokenId,to:ref.tokenId??ref.toTokenId});
  if(target.start!==undefined||target.end!==undefined){const {start,end}=target;if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||end>resolved.text.length||resolved.text.slice(start,end)!==target.surface||target.text!==target.surface)throw new Error('Stale lexical part audio');return {text:target.surface,speech:target.reading??target.surface,lang:'ja-JP'};}
  return resolved;
 }
 if(typeof target.text==='string'&&target.text)return {text:target.text,speech:target.reading??target.text,lang:'ja-JP'};
 return null;
}
