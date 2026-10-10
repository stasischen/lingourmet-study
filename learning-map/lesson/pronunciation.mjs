/** Explicit targets only: UI copy is never inferred from character ranges. */
export class PronunciationError extends Error {
 constructor(code,message){super(message);this.name='PronunciationError';this.code=code;}
}
const fail=(code,message)=>{throw new PronunciationError(code,message);};
const nonempty=value=>typeof value==='string'&&value.length>0;
export function tokenSpeech(token){
 if(nonempty(token.reading))return token.reading;
 if(token.ruby?.length){if(token.ruby.map(r=>r.text).join('')!==token.text)fail('invalid-ruby','Ruby does not match visible token');return token.ruby.map(r=>r.reading||r.text).join('');}
 return token.text;
}
export function resolveUnitTarget(data,selection,{gate}={}){
 const unit=data.units?.[selection.unit];if(!unit)fail('unknown-unit','Unknown target unit');
 let from,to;
 if(selection.kind==='sentence'||(!selection.kind&&selection.from===undefined&&selection.to===undefined)){}
 else if(selection.kind==='token'){from=selection.id;to=selection.id;}
 else if(selection.kind==='chunk'||selection.kind==='span'){
  const range=unit[selection.kind==='chunk'?'chunks':'spans']?.find(x=>x.id===selection.id);
  if(!range)fail('unknown-range','Unknown target range');({from,to}=range);
 } else if(selection.from!==undefined&&selection.to!==undefined)({from,to}=selection);
 else fail('invalid-range','An exact target range is required');
 let tokens=unit.tokens;
 if(from!==undefined){const a=tokens.findIndex(x=>x.id===from),b=tokens.findIndex(x=>x.id===to);if(a<0||b<a)fail('invalid-range','Invalid target token boundaries');tokens=tokens.slice(a,b+1);}
 return {text:tokens.map(t=>t.text).join(''),speech:tokens.map(tokenSpeech).join(''),lang:'ja-JP',...(gate?{gate}:{} )};
}
export function valueAt(document,path){return path.reduce((value,key)=>value?.[key],document);}
export function resolveFieldTargets(documents,field){
 const text=valueAt(documents[field.document],field.path);if(typeof text!=='string')fail('invalid-field','Target field is not a string');
 let last=0;return (field.segments??[]).map(segment=>{
  const {start,end}=segment;if(!Number.isInteger(start)||!Number.isInteger(end)||start<last||end<=start||end>text.length||text.slice(start,end)!==segment.text)fail('stale-mapping','Target mapping does not match current copy');
  last=end;
  let speech=segment.reading||segment.text;
  if(segment.targetRef?.unit){const target=resolveUnitTarget({units:{...documents.lesson?.units,...documents.catalog?.units}},segment.targetRef);if(target.text!==segment.text)fail('stale-reference','Target reference does not match displayed segment');speech=segment.reading||target.speech;}
  return {...segment,speech,lang:'ja-JP',...(field.gate?{gate:field.gate}:{} )};
 });
}
/** Build offsets from reviewed literal occurrences, never automatic Japanese detection. */
export function mapExplicitTargets(text,targets){
 const segments=[];
 for(const target of targets){const spec=typeof target==='string'?{text:target}:target;if(!nonempty(spec.text))fail('invalid-target','Empty target');
  const hits=[];let pos=0;while((pos=text.indexOf(spec.text,pos))>=0){hits.push(pos);pos+=spec.text.length;}
  const occurrences=spec.occurrences??hits.map((_,i)=>i);
  if(!hits.length)fail('missing-target',`Explicit target absent: ${spec.text}`);
  for(const index of occurrences){const start=hits[index];if(start===undefined)fail('missing-target','Target occurrence absent');segments.push({start,end:start+spec.text.length,text:spec.text,...(spec.reading?{reading:spec.reading}:{})});}
 }
 segments.sort((a,b)=>a.start-b.start||b.end-a.end);
 for(let i=1;i<segments.length;i++)if(segments[i].start<segments[i-1].end)fail('overlap','Explicit targets overlap; select reviewed occurrences');
 return segments;
}
export function canSpeakTarget(target,access={}){
 if(!target||target.lang!=='ja-JP'||!nonempty(target.text)||!nonempty(target.speech))return false;
 if(!target.gate)return true;
 if(target.gate.phase==='feedback')return nonempty(target.gate.visitToken)&&Array.isArray(access.checkedFeedbackTokens)&&access.checkedFeedbackTokens.includes(target.gate.visitToken);
 return target.gate.phase==='answer'&&Array.isArray(access.revealedPracticeIds)&&access.revealedPracticeIds.includes(target.gate.practiceId);
}
/** Local Japanese voices only: this feature must not send text to a cloud TTS provider. */
export function createPronunciationController({synthesis=globalThis.speechSynthesis,Utterance=globalThis.SpeechSynthesisUtterance,getAccess=()=>({}),onStatus=()=>{}}={}){
 let disposed=false,active=null,generation=0,lastStatus;
 const listeners=new Set();
 const publish=state=>{lastStatus=state;onStatus(state);for(const callback of listeners)callback(state);return state;};
 const voices=()=>{try{return synthesis?.getVoices?.()??[];}catch{return [];}};
 const chooseVoice=()=>voices().find(v=>/^ja(?:[-_]JP)?$/i.test(v.lang)&&v.localService===true);
 const availability=()=>!synthesis||typeof synthesis.speak!=='function'||typeof synthesis.cancel!=='function'||typeof Utterance!=='function'?{available:false,code:'unsupported'}:chooseVoice()?{available:true,code:'ready'}:{available:false,code:'no-local-japanese-voice'};
 const refresh=()=>{const status=availability();return publish({...status,state:status.available?'ready':'unavailable'});};
 const voiceListener=()=>{if(!availability().available){if(active)cancel();else generation++;}refresh();};synthesis?.addEventListener?.('voiceschanged',voiceListener);
 function cancel(){generation++;active=null;try{synthesis?.cancel?.();return publish({...availability(),state:'idle',code:'cancelled'});}catch(error){return publish({...availability(),state:'error',code:'cancel-failed',message:error.message});}}
 function speak(target,{userInitiated=false,onComplete=()=>{}}={}){
  if(disposed) return publish({available:false,state:'error',code:'disposed'});
  if(!userInitiated)return publish({...availability(),state:'error',code:'user-gesture-required'});
  if(!canSpeakTarget(target,getAccess()))return publish({...availability(),state:'error',code:'target-hidden-or-invalid'});
  const status=availability();if(!status.available)return publish({...status,state:'unavailable'});
  // Refresh voice at the click, not a stale cached voice from initial page load.
  const voice=chooseVoice();const cancelled=cancel();if(cancelled.code==='cancel-failed')return cancelled;const serial=generation;
  try{
   const utterance=new Utterance(target.speech);utterance.lang='ja-JP';utterance.voice=voice;
   // Consume each attempt once; callbacks cannot regain authority after failure or cancellation.
   const consume=()=>{if(serial!==generation||active!==utterance)return null;active=null;return ++generation;};
   utterance.onstart=()=>{if(serial===generation&&active===utterance)publish({available:true,state:'speaking',code:'started'});};
   utterance.onend=()=>{const completed=consume();if(completed===null)return;publish({...availability(),state:'idle',code:'ended'});if(completed===generation&&!disposed&&availability().available)onComplete();};
   utterance.onerror=event=>{if(consume()!==null)publish({...availability(),state:'error',code:event.error||'speech-error'});};
   active=utterance;synthesis.speak(utterance);return serial===generation?publish({available:true,state:'pending',code:'queued'}):lastStatus;
  }catch(error){if(serial===generation){generation++;active=null;}return publish({...availability(),state:'error',code:'speech-error',message:error.message});}
 }
 refresh();
 return {speak,cancel,refresh,availability,getStatus:()=>lastStatus,subscribe(callback){listeners.add(callback);callback(lastStatus);return()=>listeners.delete(callback);},dispose(){cancel();disposed=true;synthesis?.removeEventListener?.('voiceschanged',voiceListener);listeners.clear();}};
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/** Put this beside the target or use the target text itself as label. No nested buttons. */
export function pronunciationButtonHTML(id,{label='▶',ariaLabel='播放日語發音',className='pronunciation-button'}={}){
 return `<button type="button" class="${escape(className)}" data-pronunciation-target="${escape(id)}" aria-label="${escape(ariaLabel)}" disabled>${escape(label)}</button>`;
}
/** Call sync after rendering or reveal changes; unavailable controls always expose a reason. */
export function bindPronunciation(root,{controller,resolveTarget,getAccess=()=>({}),unavailableLabel='此裝置目前沒有可用的本機日語語音',hiddenLabel='揭曉答案後才能播放',feedbackHiddenLabel='檢查結果成功儲存後才能播放回饋發音；若儲存失敗，請重試。',onError=()=>{}}){
 const sync=()=>{const state=controller.availability();for(const button of root.querySelectorAll('[data-pronunciation-target]')){let target;try{target=resolveTarget(button.dataset.pronunciationTarget);}catch{}const allowed=canSpeakTarget(target,getAccess());button.disabled=!state.available||!allowed;button.title=!allowed?(target?.gate?.phase==='feedback'?feedbackHiddenLabel:hiddenLabel):!state.available?unavailableLabel:'';button.setAttribute('aria-disabled',String(button.disabled));}};
 const click=event=>{const button=event.target.closest?.('[data-pronunciation-target]');if(!button||!root.contains(button))return;event.preventDefault();event.stopPropagation();if(event.isTrusted!==true)return;
  try{const result=controller.speak(resolveTarget(button.dataset.pronunciationTarget),{userInitiated:true});if(result.state==='error'||result.state==='unavailable')onError(result);}catch(error){onError({state:'error',code:error.code||'invalid-target',message:error.message});}sync();};
 root.addEventListener('click',click);const unsubscribe=controller.subscribe(sync);return {sync,dispose(){root.removeEventListener('click',click);unsubscribe();controller.cancel();}};
}

/** Render only reviewed segments as buttons, with exact visible copy otherwise preserved. */
export function fieldTargetHTML(documents,field,{register,ariaLabel='播放日語發音'}={}){
 const text=valueAt(documents[field.document],field.path),targets=resolveFieldTargets(documents,field);let cursor=0,html='';
 for(const target of targets){html+=escape(text.slice(cursor,target.start));const id=register(target);html+=pronunciationButtonHTML(id,{label:target.text,ariaLabel});cursor=target.end;}
 return html+escape(text.slice(cursor));
}
export function fieldMappingFor(sidecar,document,path){return sidecar.fields.find(field=>field.document===document&&JSON.stringify(field.path)===JSON.stringify(path));}
