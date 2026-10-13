import {loadCandidate, LANGUAGES} from './package-loader.mjs';
import {unitText} from './model.mjs';
const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
const button=(text,action,cls='')=>{const b=el('button',text,cls);b.type='button';b.addEventListener('click',action);return b;};
export function restoreProgress(raw,data) {
 let parsed;try{parsed=JSON.parse(raw);}catch{return {answers:{},drafts:{}};}
 const answers={},drafts={};
 for(const q of data.practice.items) if(q.options.some(o=>o.id===parsed?.answers?.[q.id])) answers[q.id]=parsed.answers[q.id];
 for(const r of data.rehearsals) if(typeof parsed?.drafts?.[r.id]==='string') drafts[r.id]=parsed.drafts[r.id].slice(0,3000);
 return {answers,drafts};
}
export function mount(pkg,root=document.querySelector('#app'),storage=undefined) {
 const {data,language,locale,storageKey}=pkg,loc=data.localizations[locale],questions=data.practice.items;
 let saved={answers:{},drafts:{}},persistent=true,showMeanings=true;
 try{storage??=window.localStorage;saved=restoreProgress(storage.getItem(storageKey),data);}catch{persistent=false;}
 function save(){try{storage.setItem(storageKey,JSON.stringify(saved));}catch{persistent=false;}}
 function route(){const p=new URL(location.href).searchParams;const view=['read','teach','practice'].includes(p.get('view'))?p.get('view'):'read';const q=Math.max(0,Math.min(questions.length-1,Math.trunc(Number(p.get('q')))||0));return {view,q,unit:p.get('unit'),returnTo:p.get('return')==='practice'};}
 function go(patch){const old=route(),s={...old,...patch},url=new URL(location.href);url.search='';url.searchParams.set('lang',language);url.searchParams.set('view',s.view);url.searchParams.set('q',s.q);if(s.unit)url.searchParams.set('unit',s.unit);if(s.returnTo)url.searchParams.set('return','practice');history.pushState(null,'',url);render();root.focus({preventScroll:true});const anchor=s.unit?document.getElementById('unit-'+s.unit):null;if(anchor)anchor.scrollIntoView?.({block:'center'});else window.scrollTo?.(0,0);}
 function speak(unit,status){
  const synth=window.speechSynthesis;
  const voice=synth?.getVoices().find(v=>v.lang.toLowerCase().split(/[-_]/)[0]===language);
  if(!voice || !window.SpeechSynthesisUtterance){status.textContent='這部裝置目前沒有可用的'+LANGUAGES[language].split(' · ')[0]+'朗讀聲音。可以繼續閱讀。';return;}
  synth.cancel();const utterance=new window.SpeechSynthesisUtterance(unitText(unit));utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.85;
  status.textContent='裝置合成朗讀中…';utterance.onend=()=>{status.textContent='朗讀結束。';};utterance.onerror=()=>{status.textContent='這次朗讀未完成，可以繼續閱讀。';};synth.speak(utterance);
 }
 function unit(uid,who,anchor=true){const u=data.units[uid],wrap=el('div',undefined,'dialogue');if(anchor)wrap.id='unit-'+uid;
  if(route().unit===uid)wrap.classList.add('highlight');
  if(who)wrap.append(el('div',who,'speaker'));
  const line=el('p',unitText(u),'target');line.lang=language;wrap.append(line);
  const reading=u.tokens.map(t=>t.reading??'').join(' ').trim();if(reading)wrap.append(el('p',reading,'reading'));
  if(showMeanings)wrap.append(el('p',loc.units[uid].meaning,'meaning'));
  const tools=el('div',undefined,'unit-tools'),status=el('span','','small');status.setAttribute('role','status');
  const say=button('裝置朗讀',()=>speak(u,status));say.setAttribute('aria-label','朗讀：'+unitText(u));tools.append(say,status);wrap.append(tools);return wrap;
 }
 function related(q){const box=el('div',undefined,'actions');box.append(button('回看本題課文',()=>go({view:'read',unit:q.sourceRefs[0].unit,returnTo:true})),button('回看相關教學',()=>go({view:'teach',unit:null,returnTo:true})));return box;}
 function render(){const s=route();root.replaceChildren();root.tabIndex=-1;root.setAttribute('aria-busy','false');
  const tools=el('div',undefined,'toolbar'),label=el('label','學習語言　'),select=el('select');select.setAttribute('aria-label','學習語言');for(const [code,name]of Object.entries(LANGUAGES)){const option=el('option',name);option.value=code;option.selected=language===code;select.append(option);}select.onchange=()=>{window.speechSynthesis?.cancel();const url=new URL(location.href);url.search='';url.searchParams.set('lang',select.value);url.searchParams.set('view',s.view);location.assign(url.href);};label.append(select);tools.append(label,el('span','A1 · 第一課','eyebrow'));root.append(tools,el('h1',loc.title),el('p',loc.intro,'intro'));
  const tabs=el('nav',undefined,'tabs');tabs.setAttribute('aria-label','課程區域');for(const [view,title] of [['read','課文'],['teach','教學'],['practice','練習']]){const b=button(title,()=>go({view,unit:null,returnTo:false}));b.setAttribute('aria-pressed',String(s.view===view));tabs.append(b);}root.append(tabs);
  if(s.returnTo && s.view!=='practice') root.append(button(`← 回到第 ${s.q+1} 題`,()=>go({view:'practice',unit:null,returnTo:false}),'primary'));
  if(s.view==='read'){
   const goals=el('details');goals.append(el('summary','這課要會什麼？'));const list=el('ul',undefined,'goal-list');for(const g of data.goalOrder)list.append(el('li',loc.goals[g]));goals.append(list);root.append(goals);
   const toggle=el('label'),check=el('input');check.type='checkbox';check.checked=showMeanings;check.onchange=()=>{showMeanings=check.checked;render();};toggle.append(check,document.createTextNode(' 顯示中文意思'));root.append(toggle);
   const rendered=new Set();for(const sid of data.sourceOrder){const scene=data.sources[sid],card=el('section',undefined,'card');card.append(el('h2',loc.sources[sid].title),el('p',loc.sources[sid].summary,'context'));for(const turn of scene.turns){for(const uid of turn.unitRefs){card.append(unit(uid,data.speakers[turn.speakerId].name,!rendered.has(uid)));rendered.add(uid);}}root.append(card);}
   root.append(el('p','讀音提示與裝置合成朗讀可輔助練習；這課不自動評分口說。','notice'),button('接著看教學 →',()=>go({view:'teach',unit:null}),'primary'));
  } else if(s.view==='teach'){
   const refs=s.returnTo?data.teachingRefs.filter(r=>questions[s.q].entryRefs.includes(r.entryId)):data.teachingRefs;
   for(const ref of refs){const entry=data.entries[ref.entryId],copy=entry.localizations[locale],card=el('section',undefined,'card');card.append(el('h2',copy.title),el('p',copy.explanation),el('p',copy.usage));for(const exid of entry.exampleRefs){const ex=data.examples[exid];card.append(el('p',loc.examples[exid].context,'context'));for(const uid of ex.unitRefs)card.append(unit(uid,null,false));}const note=el('details');note.append(el('summary','再多懂一點'),el('p',copy.limits));card.append(note);root.append(card);}
   root.append(button(s.returnTo?'回到這一題 →':'開始練習 →',()=>go({view:'practice',unit:null,returnTo:false}),'primary'));
  } else {
   const correct=questions.filter(q=>saved.answers[q.id]===q.answer).length,attempted=Object.keys(saved.answers).length;
   root.append(el('p',`已核對 ${attempted} / ${questions.length} 題 · 目前答對 ${correct} 題。還有下方角色練習，讓你自己說一次。`,'progress'));
   if(!persistent)root.append(el('p','練習紀錄目前只保留在這個頁面，關閉後可能無法恢復。','notice'));
   const toc=el('nav',undefined,'toc');toc.setAttribute('aria-label','選擇題目');questions.forEach((q,i)=>{const b=button(`${i+1}${saved.answers[q.id]===q.answer?' ✓':saved.answers[q.id]?' · 已答':''}`,()=>go({q:i,unit:null,returnTo:false}));if(i===s.q)b.setAttribute('aria-current','step');toc.append(b);});root.append(toc);
   const q=questions[s.q],card=el('section',undefined,'card');card.append(el('p',`第 ${s.q+1} / ${questions.length} 題 · ${q.title[locale]}`,'eyebrow'));
   const form=el('form'),fieldset=el('fieldset',undefined,'question');fieldset.append(el('legend',q.prompt[locale]));
   for(const option of q.options){const row=el('label',undefined,'option'),input=el('input');input.type='radio';input.name='answer';input.value=option.id;input.required=true;input.checked=saved.answers[q.id]===option.id;const text=el('span',option.text[locale],'target');text.lang=option.displayLanguage??language;row.append(input,text);fieldset.append(row);}form.append(fieldset);const submit=el('button','核對答案','primary');submit.type='submit';form.append(submit);
   form.onsubmit=event=>{event.preventDefault();const answer=form.querySelector('input:checked')?.value;if(!answer)return;saved.answers[q.id]=answer;save();render();document.getElementById('feedback')?.focus({preventScroll:true});};card.append(form);
   if(saved.answers[q.id]){const chosen=saved.answers[q.id],ok=chosen===q.answer,feedback=el('div',undefined,'feedback'+(ok?' correct':''));feedback.id='feedback';feedback.tabIndex=-1;feedback.setAttribute('role','status');feedback.append(el('h3',ok?'答對了':'再看看這個情境'),el('p',q.choiceAssessment.feedbackByOption[chosen][locale]));if(!ok)feedback.append(el('p','參考答案：'+q.options.find(o=>o.id===q.answer).text[locale]));feedback.append(el('p',q.explanation[locale]));card.append(feedback);}
   card.append(related(q));const pager=el('nav',undefined,'pager');pager.setAttribute('aria-label','練習分頁');const prev=button('← 上一題',()=>go({q:s.q-1})),next=button('下一題 →',()=>go({q:s.q+1}));prev.disabled=s.q===0;next.disabled=s.q===questions.length-1;pager.append(prev,el('span',`${s.q+1} / ${questions.length}`),next);card.append(pager);root.append(card);
   root.append(el('h2','把句子變成自己的話'),el('p','可以和夥伴輪流說，也可以自己扮演兩個角色。參考回答只是例子，請用自己想使用的名字。'));
   for(const task of data.rehearsals){const section=el('section',undefined,'card');section.append(el('h3',task.title),el('p',task.prompt));const label=el('label','先試一次，再看參考：'),draft=el('textarea');draft.maxLength=3000;draft.setAttribute('aria-label',task.title+' · 我的草稿');draft.value=saved.drafts[task.id]??'';draft.oninput=()=>{saved.drafts[task.id]=draft.value;save();};label.append(draft);section.append(label);const details=el('details');details.append(el('summary','看參考回答與自評'));const sample=el('p',task.sample.join('\n'),'rehearsal-sample target');sample.lang=language;details.append(sample);const checks=el('div',undefined,'self-check');for(const text of task.checklist){const l=el('label'),c=el('input');c.type='checkbox';l.append(c,document.createTextNode(text));checks.append(l);}details.append(checks,el('p',task.feedback));section.append(details,button('回課文練這段',()=>go({view:'read',unit:task.sourceRefs[0].unit,returnTo:false})));root.append(section);}
   root.append(button('回課文再讀一次',()=>go({view:'read',unit:null,returnTo:false})));
  }
 }
 const pop=()=>render();window.addEventListener('popstate',pop);render();return {render,destroy:()=>window.removeEventListener('popstate',pop)};
}
if(typeof document!=='undefined' && document.querySelector('#app') && !globalThis.__LINGO_TEST__) {
 const language=new URL(location.href).searchParams.get('lang')||'ja';
 loadCandidate(language).then(pkg=>mount(pkg)).catch(error=>{const root=document.querySelector('#app');root.setAttribute('aria-busy','false');root.replaceChildren(el('h1','課程尚未載入'),el('p',error.message,'error'));const link=el('a','回學習地圖');link.href='/lingourmet-study/learning-map/';root.append(link);});
}
