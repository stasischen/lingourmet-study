import {loadEvents,saveSelfCheck} from './state.mjs';
import {uiStatusCopy} from './i18n.mjs';
const $=s=>document.querySelector(s);
let data,loadFailed=false;
try{data=await fetch('./preview-data.json').then(r=>{if(r.ok===false)throw Error('LOAD_FAILED');return r.json();});if(!data?.views||typeof data.packageDigest!=='string')throw Error('LOAD_FAILED');}catch{loadFailed=true;}
const format=(template,values)=>template.replace(/\{(\w+)\}/g,(_,key)=>String(values[key]??''));
const currentLabels=()=>uiStatusCopy.locales[$('#ui').value];
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function setText(id,text){const node=$('#'+id);if(node)node.textContent=text;}
function button(text,action,cls){const b=el('button',text,cls);b.addEventListener('click',action);return b;}
function stopSpeech(){try{window.speechSynthesis?.cancel();}catch{/* Navigation must remain available when browser speech fails. */}}
function errorText(error,L){return error.message==='PRACTICE_SIGNATURE_CONFLICT'?L.practiceSignatureConflict:error.message==='PRIVATE_EVENT_INVALID'?L.privateEventInvalid:error.message==='PRIVATE_STATE_INVALID'||error instanceof SyntaxError?L.privateStateInvalid:L.storageUnavailable;}
function renderHistory(){try{loadEvents(localStorage);$('#history').replaceChildren();}catch(error){$('#history').replaceChildren(el('p',errorText(error,currentLabels()),'error'));}}
function renderShell(L,ui){document.documentElement.lang=ui;document.title='Lingourmet';for(const [id,key]of Object.entries({eyebrow:'eyebrow','intro-title':'introTitle','teaching-label':'teachingLanguage','ui-label':'uiLanguage'}))setText(id,L[key]);for(const group of ['teaching','ui'])for(const [locale,key]of Object.entries({ja:'languageJa',en:'languageEn','zh-Hant':'languageZhHant',fr:'languageFrMissing'}))setText(group+'-'+locale,L[key]);}
function feedback(container,text){const lines=text.split('\n'),criteria=el('ol',undefined,'criteria');let appended=false;for(const line of lines){if(/^[1-3]\. /.test(line))criteria.append(el('li',line.replace(/^[1-3]\. /,'')));else{if(criteria.children.length&&!appended){container.append(criteria);appended=true;}container.append(el('p',line));}}if(criteria.children.length&&!appended)container.append(criteria);}
function render(){const locale=$('#locale').value,ui=$('#ui').value,L=currentLabels();renderShell(L,ui);$('#items').replaceChildren();if(loadFailed){$('#items').append(el('p',L.loadError,'error'));renderHistory();return;}const view=data.views[locale];
if(!view){$('#items').append(el('p',L.missing,'missing'));renderHistory();return;}
for(const [i,item]of view.items.entries()){
 const article=el('article'),head=el('div',undefined,'cardhead');head.append(el('h2',`${String(i+1).padStart(2,'0')}  ${item.knowledge.id==='ja:polite-predicate'?L.predicateTitle:L.introductionTitle}`));article.append(head);
 if(item.teaching.status==='missing'){article.append(el('div',L.missing,'missing'));$('#items').append(article);continue;}
 const t=item.teaching.record.payload,body=el('div',undefined,'content'),sections=el('div',undefined,'sections'),prerequisites=el('section',undefined,'prerequisites'),list=el('ul');
 prerequisites.append(el('h3',uiStatusCopy.prerequisitesHeading[ui]));for(const text of t.audience.prerequisites)list.append(el('li',text));prerequisites.append(list);sections.append(prerequisites);
 for(const section of item.teaching.sections){
  if(section.purpose==='practice')continue;const box=el('section');box.append(el('h3',L[section.purpose]));
  for(const block of section.blocks){
   if(block.kind!=='example-ref'){box.append(el('p',block.text));continue;}
   for(const original of block.originals){box.append(el('p',original.text,'native'));const speech=original.speech;
    if(speech.status==='available')box.append(button(L.listen,()=>{if(!('speechSynthesis'in window)){alert(currentLabels().speechUnavailable);return;}try{speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(speech.text);utterance.lang=speech.language;utterance.onerror=()=>alert(currentLabels().speechFailed);speechSynthesis.speak(utterance);}catch{alert(currentLabels().speechFailed);}},'secondary'));
   }
   if(block.meaning.status==='available')box.append(el('p',block.meaning.text,'meaning'));
  }sections.append(box);
 }body.append(sections);
 for(const ex of t.exercises){
  const p=item.practices.find(p=>p.practiceKey===ex.practiceKey),box=el('section',undefined,'practice');box.append(el('h3',L.practice),el('p',ex.instructions));
  const reveal=el('div',undefined,'answer'),exercisePanel=el('div'),resultButtons=[];let active=false,saved=false;reveal.hidden=true;exercisePanel.hidden=true;
  const start=button(L.startPractice,()=>{if(active)return;stopSpeech();active=true;saved=false;for(const b of resultButtons)b.disabled=false;reveal.hidden=true;toggle.textContent=L.showAnswer;sections.hidden=true;exercisePanel.hidden=false;start.hidden=true;});box.append(start);
  for(const answer of p.answers)for(const text of answer.texts)reveal.append(el('p',text,'native'));feedback(reveal,ex.feedback);
  for(const result of ['understood','retry']){const control=button(L[result],()=>{if(!active||reveal.hidden||saved)return;try{saveSelfCheck(localStorage,{identity:p.identity,practiceVersion:p.practiceVersion,answerSignature:p.answerSignature,packageDigest:data.packageDigest,result});saved=true;for(const b of resultButtons)b.disabled=true;renderHistory();}catch(error){$('#history').replaceChildren(el('p',errorText(error,currentLabels()),'error'));}});resultButtons.push(control);reveal.append(control);}
  const toggle=button(L.showAnswer,()=>{reveal.hidden=!reveal.hidden;toggle.textContent=reveal.hidden?L.showAnswer:L.hideAnswer;});exercisePanel.append(button(L.returnToTeaching,()=>{stopSpeech();active=false;reveal.hidden=true;toggle.textContent=L.showAnswer;exercisePanel.hidden=true;sections.hidden=false;start.hidden=false;},'secondary'),toggle,reveal);box.append(exercisePanel);body.append(box);
 }article.append(body);$('#items').append(article);
}renderHistory();}
function safeRender(){stopSpeech();try{render();}catch{const L=currentLabels();renderShell(L,$('#ui').value);$('#items').replaceChildren(el('p',L.unexpectedError,'error'));renderHistory();}}
$('#locale').addEventListener('change',safeRender);$('#ui').addEventListener('change',safeRender);safeRender();
