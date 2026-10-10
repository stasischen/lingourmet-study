/** Literal authored fragment ordering. No semantic scoring, text generation or I/O. */
export function assemblySpec(item){
 if(!Array.isArray(item?.machineAnswerTokenOrder)){if(item&&Object.hasOwn(item,'assemblyDistractors'))throw new Error('Invalid authored assembly distractors');return null;}
 const options=item.options??[],ids=options.map(x=>x.id),answerOrder=item.machineAnswerTokenOrder,hasDistractors=Object.hasOwn(item,'assemblyDistractors');
 if(!ids.length||new Set(ids).size!==ids.length||options.some(x=>typeof x.id!=='string'||!x.id||typeof x.text!=='string')||(!hasDistractors&&answerOrder.length!==ids.length)||new Set(answerOrder).size!==answerOrder.length||answerOrder.some(x=>!ids.includes(x)))throw new Error('Invalid authored assembly inventory');
 const byId=Object.fromEntries(options.map(x=>[x.id,x.text]));
 let distractorIds=[];
 if(hasDistractors){
  const feedback=item.assemblyDistractors;distractorIds=ids.filter(id=>!answerOrder.includes(id));
  if(!feedback||typeof feedback!=='object'||Array.isArray(feedback)||!distractorIds.length||Object.keys(feedback).length!==distractorIds.length||Object.keys(feedback).some(id=>!distractorIds.includes(id))||distractorIds.some(id=>/^\p{P}+$/u.test(byId[id])||!byId[id].trim()||!feedback[id]||typeof feedback[id]!=='object'||Array.isArray(feedback[id])||Object.keys(feedback[id]).length!==3||['ja','zh-Hant','en'].some(locale=>!Object.hasOwn(feedback[id],locale)||typeof feedback[id][locale]!=='string'||!feedback[id][locale].trim())))throw new Error('Invalid authored assembly distractors');
 }

 if(typeof item.answer!=='string'||answerOrder.map(id=>byId[id]).join('')!==item.answer)throw new Error('Assembly does not reconstruct authored answer');
 const selectable=ids.filter(id=>!/^\p{P}+$/u.test(byId[id]));if(!selectable.length)throw new Error('Assembly needs word pieces');
 const wordOrder=answerOrder.filter(id=>selectable.includes(id)),fixed=[];if(!wordOrder.length)throw new Error('Assembly needs answer word pieces');let after=0;for(const id of answerOrder){if(selectable.includes(id))after++;else fixed.push({id,after,text:byId[id]});}
 const bank=[...selectable];if(JSON.stringify(bank)===JSON.stringify(wordOrder)&&bank.length>1)bank.push(bank.shift());
 return {ids:selectable,originalIds:ids,bank,answerOrder:wordOrder,fullAnswerOrder:answerOrder,fixed,byId,...(hasDistractors?{distractorIds}: {})};
}
/** Presentation state only: token IDs, never answer text or progress identity. */
export function validAssemblyBank(spec,bank){return Array.isArray(bank)&&bank.length===spec.ids.length&&new Set(bank).size===spec.ids.length&&bank.every(id=>spec.ids.includes(id));}
export function shuffleAssemblyBank(spec,{rng=Math.random,previous}={}){
 const canonical=spec.distractorIds?spec.ids:spec.answerOrder,same=(a,b)=>Array.isArray(b)&&a.every((id,i)=>id===b[i]);
 if(canonical.length<2)return [...canonical];
 const acceptable=bank=>!same(bank,canonical)&&(canonical.length===2||!same(bank,previous));
 // Rejection sampling preserves Fisher–Yates uniformity over permitted orders.
 // Bound retries for injected/pathological RNGs, rather than hanging the UI.
 for(let attempt=0;attempt<32;attempt++){
  const bank=[...canonical];
  for(let i=bank.length-1;i>0;i--){const value=rng();if(!Number.isFinite(value)||value<0||value>=1)throw new RangeError('RNG must return a number in [0, 1)');const j=Math.floor(value*(i+1));[bank[i],bank[j]]=[bank[j],bank[i]];}
  if(acceptable(bank))return bank;
 }
 for(let i=0;i<canonical.length-1;i++){const bank=[...canonical];[bank[i],bank[i+1]]=[bank[i+1],bank[i]];if(acceptable(bank))return bank;}
 throw new Error('No assembly bank permutation');
}
export function validAssemblyOrder(spec,order){return Array.isArray(order)&&order.every(id=>typeof id==='string'&&(spec.originalIds??spec.ids).includes(id))&&new Set(order).size===order.length;}
export function assemblyResult(spec,order){if(!validAssemblyOrder(spec,order))return 'incomplete';const words=order.filter(id=>spec.ids.includes(id));if(spec.distractorIds){if(!words.length)return 'incomplete';return words.length===spec.answerOrder.length&&words.every((id,i)=>id===spec.answerOrder[i])?'match':'mismatch';}if(words.length!==spec.ids.length)return 'incomplete';return words.every((id,i)=>id===spec.answerOrder[i])?'match':'mismatch';}
export function changeAssembly(spec,draft={},action,id){
 const savedOrder=draft.order??[];if(!validAssemblyOrder(spec,savedOrder))return draft;const order=savedOrder.filter(id=>spec.ids.includes(id));
 let next;
 if(action==='assembly-add'){if(!spec.ids.includes(id)||order.includes(id))return draft;next=[...order,id];}
 else if(action==='assembly-remove'){if(!order.includes(id))return draft;next=order.filter(x=>x!==id);}
 else if(action==='assembly-reset'){if(!order.length)return draft;next=[];}
 else return draft;
 return {...draft,order:next,assemblyRevision:(draft.assemblyRevision??0)+1,assemblyResult:null};
}
export const ASSEMBLY_LABELS={
 'zh-Hant':{bank:'詞語',assembled:'已組好的句子',add:'加入',remove:'移回',reset:'重新排列',check:'核對組句',match:'順序與原句一致。',mismatch:'順序與原句不同，可以再排一次。',empty:'點選詞語，排成句子。',scope:'核對片段順序，不評分自由作答。'},
 en:{bank:'Words',assembled:'Your sentence',add:'Add',remove:'Return',reset:'Reset order',check:'Check order',match:'The order matches the source sentence.',mismatch:'The order differs from the source sentence. Try rearranging it.',empty:'Choose words to build the sentence.',scope:'This checks fragment order, not free-form language quality.'},
 ja:{bank:'ことば',assembled:'組み立てた文',add:'追加',remove:'戻す',reset:'並べ直す',check:'並び順を確認',match:'元の文と同じ順番です。',mismatch:'元の文と順番が違います。もう一度並べてみましょう。',empty:'ことばを選んで文を作りましょう。',scope:'部分の並び順を確認します。自由な回答の評価ではありません。'}
};
export const ASSEMBLY_SUBSET_FEEDBACK={
 'zh-Hant':'選出句子需要的詞語，各用一次；移回多餘的詞語，再檢查是否有遺漏或順序錯誤。',
 en:'Use each word needed for the sentence once. Return any extra words, then check for missing words or the wrong order.',
 ja:'文に必要なことばを一回ずつ使いましょう。余分なことばを戻し、足りないことばや順番を確認してください。'
};
export function assemblyFeedback(item,order,result,uiLocale='en'){
 const spec=assemblySpec(item),locale=Object.hasOwn(ASSEMBLY_LABELS,uiLocale)?uiLocale:'en';
 if(!result)return '';
 if(result==='mismatch'&&spec?.distractorIds){const selected=spec.distractorIds.filter(id=>order.includes(id));return selected.length?selected.map(id=>item.assemblyDistractors[id][locale]).join(' '):ASSEMBLY_SUBSET_FEEDBACK[locale];}
 return ASSEMBLY_LABELS[locale][result]??'';
}
export function renderAssembly(item,draft,{uiLocale='en',disabled=false,revealed=false,bank,field,escape}){
 const spec=assemblySpec(item);if(!spec)return '';const u=ASSEMBLY_LABELS[uiLocale]??ASSEMBLY_LABELS.en,order=(draft.order??[]).filter(id=>spec.ids.includes(id));
 const displayFixed=(spec.fixed??[]).map(piece=>spec.distractorIds&&piece.after===spec.answerOrder.length?{...piece,after:order.length}:piece);
 const selectedDistractors=draft.assemblyResult==='mismatch'?(spec.distractorIds??[]).filter(id=>order.includes(id)):[];
 const feedback=selectedDistractors.length?selectedDistractors.map(id=>field(item.assemblyDistractors[id],['assemblyDistractors',id],false)).join(' '):escape(assemblyFeedback(item,order,draft.assemblyResult,uiLocale));
 const button=(action,label,id,off=false)=>`<button type="button" data-practice-action="${action}"${id?` data-piece-id="${escape(id)}" aria-label="${escape(label)} · ${escape(spec.byId[id])}"`:''}${disabled||revealed||off?' disabled':''}>${escape(label)}</button>`;
 const piece=(id,chosen)=>{const index=item.options.findIndex(x=>x.id===id),action=chosen?'assembly-remove':'assembly-add',label=chosen?u.remove:u.add;return `<div class="assembly-piece" data-assembly-piece="${escape(id)}"><button type="button" data-practice-action="${action}" data-piece-id="${escape(id)}" aria-label="${escape(label)} · ${escape(spec.byId[id])}"${disabled||revealed?' disabled':''}>${escape(spec.byId[id])}</button>${field(item.options[index].text,['options',index,'text'],false,{audioOnly:true})}</div>`;};
 return `<section class="sentence-assembly" aria-label="${escape(u.assembled)}"><h3>${escape(u.assembled)}</h3><div class="sentence-answer" data-assembly-answer>${order.length?displayFixed.filter(p=>p.after===0).map(p=>`<span class="assembly-punctuation">${escape(p.text)}</span>`).join('')+order.map((id,index)=>piece(id,true)+displayFixed.filter(p=>p.after===index+1).map(p=>`<span class="assembly-punctuation">${escape(p.text)}</span>`).join('')).join(''):`<p>${escape(u.empty)}</p>`}</div><h3>${escape(u.bank)}</h3><div class="word-bank">${(validAssemblyBank(spec,bank)?bank:spec.bank).filter(id=>!order.includes(id)).map(id=>piece(id,false)).join('')}</div><p role="status" data-assembly-feedback>${feedback}</p>${button('assembly-reset',u.reset,null,!order.length)} ${button('assembly-check',u.check,null,spec.distractorIds?!order.length:order.length!==spec.ids.length)}</section>`;
}
