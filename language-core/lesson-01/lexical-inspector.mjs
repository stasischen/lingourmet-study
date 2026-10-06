import {h,UI} from './i18n.mjs';
import {resolveLexicalSelection} from './model.mjs';
const present=value=>typeof value==='string'&&value.length>0;
/** This renderer only displays authored fields; IDs, reason codes and evidence stay private. */
export function lexicalInspectorHTML(data,analysis,locale,selection,uiLocale,ctx={}){
 const view=resolveLexicalSelection(data,analysis,locale,selection,{dictionaryResolver:ctx.dictionaryResolver});
 if(!view)return analysis&&selection.kind==='token'?`<div class="lexical-inspector"><p class="lexical-meaning" lang="${h(locale)}">${h(UI[uiLocale].missing)}</p></div>`:null;
 const u=UI[uiLocale],renderCopy=(value,field)=>ctx.renderField?ctx.renderField(value,'lexical',['localizations',locale,selection.kind==='expression'?'expressions':'annotations',view.id,field]):h(value),renderTarget=(text,target)=>`${h(text)}${target?ctx.lexicalAudio?.(target)??'':''}`;
 const meaning=`<p class="lexical-meaning" lang="${h(locale)}">${view.meaning?renderCopy(view.meaning,selection.kind==='expression'?'meaning':'contextMeaning'):h(u.missing)}</p>`;
 const rows=[];
 if(present(view.lemma)&&view.lemma!==view.text)rows.push([u.lemma,renderTarget(view.lemma,view.audioTargets.lemma)]);
 if(view.pos)rows.push([u.pos,h(view.pos)]);
 const features=view.features.map(f=>f.label).filter(present);if(features.length)rows.push([u.grammar,features.map(h).join(' · ')]);
 if(view.parts.length){const parts=view.parts.map((part,index)=>{const id=part.id??part.partId??String(index),copy=view.localizedParts?.[id];return present(part.surface)?`<li><span lang="ja">${renderTarget(part.surface,view.audioTargets.parts?.[id])}${part.lemma?.text&&part.lemma.text!==part.surface?` (${renderTarget(part.lemma.text,view.audioTargets.parts?.[id]?.lemma)})`:''}</span>${view.partLabels?.[part.pos]?` · ${h(view.partLabels[part.pos])}`:''}${present(copy)?` · ${h(copy)}`:present(copy?.explanation)?` · ${h(copy.explanation)}`:''}</li>`:'';}).join('');if(parts)rows.push([u.parts,`<ul class="lexical-parts">${parts}</ul>`]);}
 const fields=rows.length?`<dl class="lexical-fields">${rows.map(([label,value])=>`<div><dt>${h(label)}</dt><dd lang="${h(locale)}">${value}</dd></div>`).join('')}</dl>`:'';
 const usage=view.usage?`<details class="lexical-usage"><summary>${h(u.usage)}</summary><p lang="${h(locale)}">${renderCopy(view.usage,'usage')}</p></details>`:'';
 const dictionary=view.dictionary?.showAffordance?ctx.renderDictionary?.(view.dictionary,locale,uiLocale)??'':'';
 return `<div class="lexical-inspector">${meaning}${fields}${usage}${dictionary}</div>`;
}
