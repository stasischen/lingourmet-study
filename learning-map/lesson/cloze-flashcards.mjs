import {unitText,tokensForRange} from './model.mjs';
import {FLASHCARD_LABELS,currentFlashcardId,renderFlashcardSession} from './flashcard-session.mjs';
import {h} from './i18n.mjs';
/** A bounded exact-source recall card, not a free-completion or automatic grading contract. */
export function buildSourceRecallClozeCards(data,selections){
 const seen=new Set();return (selections?.items??[]).map(item=>{
  const {document,unitId}=item.sourceUnit??{},unit=data.units?.[unitId],gap=item.gaps?.[0];
  if(!item.practiceKey||seen.has(item.practiceKey)||item.gaps?.length!==1||!unit||data.unitOwners?.[unitId]!==document||unitText(unit)!==item.sourceTextGuard||item.answerPolicy?.mode!=='source_recall_self_assessment'||item.answerPolicy.automaticGrading!==false)throw new Error('Invalid source-recall cloze selection');seen.add(item.practiceKey);
  const tokens=tokensForRange(unit,gap.fromTokenId,gap.toTokenId),surface=tokens.map(t=>t.text).join('');
  const expectedStart=unit.tokens.slice(0,unit.tokens.findIndex(t=>t.id===gap.fromTokenId)).map(t=>t.text).join('').length;
  if(gap.offsetUnit!=='UTF-16 code units'||gap.start!==expectedStart||gap.end!==gap.start+surface.length||surface!==gap.surfaceGuard||unitText(unit).slice(gap.start,gap.end)!==surface||gap.start===0&&gap.end===unitText(unit).length)throw new Error('Stale cloze gap');
  const answer=item.answer;if(answer?.target?.document!==document||answer.target.unitId!==unitId||answer.target.tokenId!==gap.fromTokenId||gap.fromTokenId!==gap.toTokenId||answer.surfaceGuard!==surface||answer.gapId!==gap.gapId)throw new Error('Stale original cloze answer');
  for(const locale of ['ja','zh-Hant','en'])if(typeof item.localizations?.[locale]?.prompt!=='string'||!item.localizations[locale].prompt.trim())throw new Error('Missing cloze label');
  return {id:`flash:cloze:${item.practiceKey}`,template:'cloze',unit:unitId,from:gap.fromTokenId,to:gap.toTokenId,sourceRefs:[{unit:unitId}],signature:JSON.stringify({practiceKey:item.practiceKey,practiceVersion:item.practiceVersion,unit:unitId,tokens:unit.tokens,gap,answer,policy:item.answerPolicy}),clozeSelection:item};
 });
}
/** Only replace the engine-owned template heading with the authored localized short label. */
export function renderSourceAwareFlashcards(state,cards,data,options){
 const html=renderFlashcardSession(state,cards,data,options),card=cards.find(c=>c.id===currentFlashcardId(state));
 if(!card?.clozeSelection||!['recall','revealed'].includes(state.phase))return html;
 const prompt=card.clozeSelection.localizations?.[state.locale]?.prompt;if(!prompt)return html;
 const heading=`<h2 data-flash-focus tabindex="-1">${h(FLASHCARD_LABELS[state.uiLocale].cloze)}</h2>`;
 if(!html.includes(heading))throw new Error('Cloze engine heading contract changed');
 return html.replace(heading,`<h2 data-flash-focus tabindex="-1" lang="${h(state.locale)}">${h(prompt)}</h2>`);
}
