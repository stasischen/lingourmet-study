/** Literal authored fragment ordering. No semantic scoring, text generation or I/O. */
export function assemblySpec(item){
 if(!Array.isArray(item?.machineAnswerTokenOrder))return null;
 const options=item.options??[],ids=options.map(x=>x.id),answerOrder=item.machineAnswerTokenOrder;
 if(!ids.length||new Set(ids).size!==ids.length||options.some(x=>typeof x.id!=='string'||!x.id||typeof x.text!=='string')||answerOrder.length!==ids.length||new Set(answerOrder).size!==ids.length||answerOrder.some(x=>!ids.includes(x)))throw new Error('Invalid authored assembly inventory');
 const byId=Object.fromEntries(options.map(x=>[x.id,x.text]));
 if(typeof item.answer!=='string'||answerOrder.map(id=>byId[id]).join('')!==item.answer)throw new Error('Assembly does not reconstruct authored answer');
 const selectable=ids.filter(id=>!/^\p{P}+$/u.test(byId[id]));if(!selectable.length)throw new Error('Assembly needs word pieces');
 const wordOrder=answerOrder.filter(id=>selectable.includes(id)),fixed=[];let after=0;for(const id of answerOrder){if(selectable.includes(id))after++;else fixed.push({id,after,text:byId[id]});}
 const bank=[...selectable];if(JSON.stringify(bank)===JSON.stringify(wordOrder)&&bank.length>1)bank.push(bank.shift());
 return {ids:selectable,originalIds:ids,bank,answerOrder:wordOrder,fullAnswerOrder:answerOrder,fixed,byId};
}
export function validAssemblyOrder(spec,order){return Array.isArray(order)&&order.every(id=>typeof id==='string'&&(spec.originalIds??spec.ids).includes(id))&&new Set(order).size===order.length;}
export function assemblyResult(spec,order){if(!validAssemblyOrder(spec,order))return 'incomplete';const words=order.filter(id=>spec.ids.includes(id));if(words.length!==spec.ids.length)return 'incomplete';return words.every((id,i)=>id===spec.answerOrder[i])?'match':'mismatch';}
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
 'zh-Hant':{bank:'可選片段',assembled:'已組好的句子',add:'加入',remove:'移回',reset:'重新排列',check:'核對組句',match:'順序與原句一致。',mismatch:'順序與原句不同，可以再排一次。',empty:'依序加入片段。',scope:'核對片段順序，不評分自由作答。'},
 en:{bank:'Available pieces',assembled:'Your sentence',add:'Add',remove:'Return',reset:'Reset order',check:'Check order',match:'The order matches the source sentence.',mismatch:'The order differs from the source sentence. Try rearranging it.',empty:'Add the pieces in order.',scope:'This checks fragment order, not free-form language quality.'},
 ja:{bank:'使える部分',assembled:'組み立てた文',add:'追加',remove:'戻す',reset:'並べ直す',check:'並び順を確認',match:'元の文と同じ順番です。',mismatch:'元の文と順番が違います。もう一度並べてみましょう。',empty:'部分を順番に追加してください。',scope:'部分の並び順を確認します。自由な回答の評価ではありません。'}
};
export function renderAssembly(item,draft,{uiLocale='en',disabled=false,revealed=false,field,escape}){
 const spec=assemblySpec(item);if(!spec)return '';const u=ASSEMBLY_LABELS[uiLocale]??ASSEMBLY_LABELS.en,order=(draft.order??[]).filter(id=>spec.ids.includes(id));
 const button=(action,label,id,off=false)=>`<button type="button" data-practice-action="${action}"${id?` data-piece-id="${escape(id)}" aria-label="${escape(label)} · ${escape(spec.byId[id])}"`:''}${disabled||revealed||off?' disabled':''}>${escape(label)}</button>`;
 const piece=(id,chosen)=>{const index=item.options.findIndex(x=>x.id===id);return `<div class="assembly-piece" data-assembly-piece="${escape(id)}">${button(chosen?'assembly-remove':'assembly-add',chosen?u.remove:u.add,id,!chosen&&order.includes(id))}<span>${field(item.options[index].text,['options',index,'text'])}</span></div>`;};
 return `<section class="sentence-assembly" aria-label="${escape(u.assembled)}"><h3>${escape(u.assembled)}</h3><div class="sentence-answer" data-assembly-answer>${order.length?(spec.fixed??[]).filter(p=>p.after===0).map(p=>`<span class="assembly-punctuation">${escape(p.text)}</span>`).join('')+order.map((id,index)=>piece(id,true)+(spec.fixed??[]).filter(p=>p.after===index+1).map(p=>`<span class="assembly-punctuation">${escape(p.text)}</span>`).join('')).join(''):`<p>${escape(u.empty)}</p>`}</div><h3>${escape(u.bank)}</h3><div class="word-bank">${spec.bank.filter(id=>!order.includes(id)).map(id=>piece(id,false)).join('')}</div><p role="status" data-assembly-feedback>${draft.assemblyResult?escape(u[draft.assemblyResult]??''):''}</p>${button('assembly-reset',u.reset,null,!order.length)} ${button('assembly-check',u.check,null,order.length!==spec.ids.length)}</section>`;
}
