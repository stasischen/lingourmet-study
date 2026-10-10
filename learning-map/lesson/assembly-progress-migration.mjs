import {assemblySpec,validAssemblyOrder,assemblyResult} from './sentence-assembly.mjs';
/** Exact earlier Q03/Q07 content used only to verify saved-progress migration. */
export const ASSEMBLY_PREDECESSOR={
  "version": "2.2-first-meeting-r1:answer-review-v3:assembly",
  "items": [
    {
      "id": "Q03",
      "title": {
        "zh-Hant": "受控組句",
        "en": "Controlled sentence building",
        "ja": "文を作る"
      },
      "stage": "controlled",
      "sourceRefs": [
        {
          "unit": "T01.s2"
        },
        {
          "unit": "T02.s2"
        }
      ],
      "prompt": {
        "zh-Hant": "你扮演ナオ，用禮貌的方式介紹姓名。將下列詞語各用一次，排成一句。",
        "en": "You are Nao. Introduce your name politely. Arrange the words below into one sentence, using each once.",
        "ja": "あなたはナオです。名前を丁寧に紹介しましょう。下の言葉を一回ずつ使い、一文に並べてください。"
      },
      "options": [
        {
          "id": "S1",
          "text": "です"
        },
        {
          "id": "S2",
          "text": "。"
        },
        {
          "id": "S3",
          "text": "ナオ"
        }
      ],
      "answer": "ナオです。",
      "explanation": {
        "zh-Hant": "先放姓名，再接禮貌句尾です。",
        "en": "Put the name first, then the polite ending です.",
        "ja": "名前の後に「です」を置きます。"
      },
      "entryRefs": [
        "draft:ja:polite-noun-predicate"
      ],
      "goalRefs": [
        "L2"
      ],
      "machineAnswerTokenOrder": [
        "S3",
        "S1",
        "S2"
      ]
    },
    {
      "id": "Q07",
      "title": {
        "ja": "文を作る",
        "zh-Hant": "受控組句",
        "en": "Controlled sentence building"
      },
      "stage": "controlled",
      "sourceRefs": [
        {
          "unit": "I01.s7"
        }
      ],
      "prompt": {
        "ja": "レンが来た場所を伝える文を作りましょう。下の言葉を一回ずつ使ってください。",
        "zh-Hant": "用下列詞語各一次，組出レン介紹自己來處的句子。",
        "en": "Use each item once to form Ren’s sentence about where they are from."
      },
      "options": [
        {
          "id": "S1",
          "text": "来ました"
        },
        {
          "id": "S2",
          "text": "台湾"
        },
        {
          "id": "S3",
          "text": "。"
        },
        {
          "id": "S4",
          "text": "から"
        }
      ],
      "answer": "台湾から来ました。",
      "explanation": {
        "ja": "「台湾」の後に「から」を置き、「来ました」で結びます。",
        "zh-Hant": "地點台湾後接から，再接来ました。",
        "en": "Put から after the place, followed by 来ました."
      },
      "entryRefs": [
        "draft:ja:place-of-origin"
      ],
      "goalRefs": [
        "L2"
      ],
      "machineAnswerTokenOrder": [
        "S2",
        "S4",
        "S1",
        "S3"
      ]
    }
  ]
};
export const ASSEMBLY_ADDITIVE_VERSION=ASSEMBLY_PREDECESSOR.version+':u01-additive-v1';
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const canonical=value=>JSON.stringify(value,(_key,entry)=>object(entry)?Object.fromEntries(Object.keys(entry).sort().map(key=>[key,entry[key]])):entry);
const timestamp=value=>value===null||typeof value==='string';
const proof={version:'u01-additive-v1',fromVersion:ASSEMBLY_PREDECESSOR.version,unchanged:['Q03','Q07'],added:['Q13']};
/** Strict admission only for this bounded predecessor/new assembly scope. */
export function validateBoundedAssemblyState(saved,expected,items){
 const fail=()=>{throw Error('Unverifiable bounded assembly progress');};
 if(!object(saved)||saved.schemaVersion!==2||saved.lessonId!==expected.lessonId||saved.practiceVersion!==expected.practiceVersion||typeof saved.sessionId!=='string'||!saved.sessionId||!Number.isSafeInteger(saved.round)||saved.round<1||!Number.isSafeInteger(saved.visit)||saved.visit<0||saved.visit>=Number.MAX_SAFE_INTEGER||!Number.isSafeInteger(saved.index)||saved.index<0||saved.index>items.length||saved.error!==null||saved.pending!==null||typeof saved.revealed!=='boolean'||canonical(saved.itemIds)!==canonical(expected.itemIds)||canonical(saved.signatures)!==canonical(expected.signatures)||canonical(saved.assemblySpecs)!==canonical(expected.assemblySpecs)||saved.assemblyBanks!==undefined||saved.choiceSpecs!==undefined||saved.choiceHistory!==undefined||saved.ordinaryMigration!==undefined||!object(saved.drafts)||!Array.isArray(saved.history)||!Array.isArray(saved.orderingHistory)||!Array.isArray(saved.answerViews))fail();
 if(!['ready','recall','revealed','material','complete'].includes(saved.phase)||(saved.phase==='complete')!==(saved.index===items.length)||saved.phase==='ready'&&saved.index!==0||saved.phase==='material'&&(!['recall','revealed'].includes(saved.returnPhase)||saved.revealed!==(saved.returnPhase==='revealed'))||saved.phase!=='material'&&(saved.returnPhase!==undefined||saved.revealed!==(saved.phase==='revealed')))fail();
 if(saved.assemblyMigration!==undefined&&canonical(saved.assemblyMigration)!==canonical(proof))fail();
 const specs=expected.assemblySpecs;
 for(const [id,draft] of Object.entries(saved.drafts)){
  if(!specs[id]||!object(draft)||draft.order!==undefined&&!validAssemblyOrder(specs[id],draft.order)||draft.assemblyRevision!==undefined&&(!Number.isSafeInteger(draft.assemblyRevision)||draft.assemblyRevision<0)||draft.text!==undefined&&typeof draft.text!=='string'||draft.assemblyResult!=null&&(!['match','mismatch'].includes(draft.assemblyResult)||draft.assemblyResult!==assemblyResult(specs[id],draft.order??[])))fail();
 }
 for(const entries of [saved.history,saved.orderingHistory])if(new Set(entries.map(entry=>entry?.attemptId)).size!==entries.length)fail();
 for(const entry of saved.history)if(!object(entry)||typeof entry.attemptId!=='string'||!entry.attemptId.startsWith(saved.sessionId+':')||!specs[entry.itemId]||entry.lessonId!==saved.lessonId||![ASSEMBLY_PREDECESSOR.version,ASSEMBLY_ADDITIVE_VERSION].includes(entry.practiceVersion)||entry.sessionId!==saved.sessionId||!Number.isSafeInteger(entry.round)||entry.round<1||entry.round>saved.round||entry.answerSignature!==expected.signatures[entry.itemId]||!(entry.rating==='skipped'||entry.kind==='answer-review')||!object(entry.response)||entry.response.order!==undefined&&!validAssemblyOrder(specs[entry.itemId],entry.response.order)||!timestamp(entry.at))fail();
 for(const entry of saved.orderingHistory)if(!object(entry)||typeof entry.attemptId!=='string'||!entry.attemptId.startsWith(saved.sessionId+':')||!specs[entry.itemId]||entry.kind!=='ordering'||!validAssemblyOrder(specs[entry.itemId],entry.order)||!['match','mismatch','revealed'].includes(entry.result)||entry.result!=='revealed'&&entry.result!==assemblyResult(specs[entry.itemId],entry.order)||!timestamp(entry.at))fail();
 for(const [id,draft] of Object.entries(saved.drafts))if(draft.assemblyResult!=null&&!saved.orderingHistory.some(entry=>entry.itemId===id&&entry.result===draft.assemblyResult&&canonical(entry.order)===canonical(draft.order)&&entry.attemptId.startsWith(`${saved.sessionId}:${saved.round}:`)))fail();
 for(const id of saved.itemIds.slice(0,saved.index))if(!saved.history.some(entry=>entry.itemId===id&&entry.round===saved.round))fail();
 if(new Set(saved.answerViews.map(view=>view?.viewId)).size!==saved.answerViews.length)fail();
 for(const view of saved.answerViews)if(!object(view)||view.sessionId!==saved.sessionId||!Number.isSafeInteger(view.round)||view.round<1||view.round>saved.round||!specs[view.itemId]||view.answerSignature!==expected.signatures[view.itemId]||view.viewId!==JSON.stringify([view.sessionId,view.round,view.itemId])||!timestamp(view.at))fail();
 if(saved.revealed&&!saved.answerViews.some(view=>view.round===saved.round&&view.itemId===saved.itemIds[saved.index]))fail();
}
export function migrateBoundedAssembly({state,items,storage,storageKey,createState}){
 if(state.practiceVersion!==ASSEMBLY_ADDITIVE_VERSION)return null;
 const oldKey=storageKey(state.lessonId,ASSEMBLY_PREDECESSOR.version),raw=storage?.getItem(oldKey);
 if(raw==null)return null;
 if(canonical(items.map(item=>item.id))!==canonical(['Q03','Q07','Q13'])||items.some(item=>item.selectedRef)||ASSEMBLY_PREDECESSOR.items.some(old=>canonical(old)!==canonical(items.find(item=>item.id===old.id)))||!assemblySpec(items[2])?.distractorIds)throw Error('Unknown assembly migration content');
 const saved=JSON.parse(raw),expected=createState({lessonId:state.lessonId,practiceVersion:ASSEMBLY_PREDECESSOR.version,items:ASSEMBLY_PREDECESSOR.items});
 validateBoundedAssemblyState(saved,expected,ASSEMBLY_PREDECESSOR.items);
 if(saved.assemblyMigration!==undefined)throw Error('Unknown predecessor assembly migration');
 const ended=saved.phase==='complete',phase=ended?'recall':saved.phase==='material'?saved.returnPhase:saved.phase;
 return {...state,sessionId:saved.sessionId,round:saved.round,visit:saved.visit+(ended?1:0),index:saved.index,phase,revealed:ended?false:saved.revealed,drafts:saved.drafts,history:saved.history,orderingHistory:saved.orderingHistory,answerViews:saved.answerViews,legacyPreserved:true,assemblyMigration:proof};
}
