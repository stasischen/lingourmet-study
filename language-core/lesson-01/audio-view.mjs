import {resolveLexicalAudioTarget} from './lexical-audio.mjs';
import {h,UI} from './i18n.mjs';
import {resolveUnitTarget,resolveFieldTargets,fieldMappingFor,fieldTargetHTML,pronunciationButtonHTML,createPronunciationController,bindPronunciation} from './pronunciation.mjs';
/** One registry per rendered view. Targets and access checks never outlive their view. */
export function createAudioView({root,documents,mapping,getAccess=()=>({}),getUILocale}){
 const registry=new Map();let binding;
 const labels=()=>UI[getUILocale()];
 const status=event=>{const el=root.querySelector('#audio-status');if(el)el.textContent=event.state==='error'?labels().audioError:event.available===false?labels().audioUnavailable:event.state==='speaking'?labels().audioSpeaking:event.state==='pending'?labels().audioPending:'';};
 const controller=createPronunciationController({getAccess,onStatus:status});
 const register=target=>{const id=`audio-${registry.size}`;registry.set(id,target);return id;};
 const renderField=(value,document,path,{gate,audioOnly=false}={})=>{
  const field=fieldMappingFor(mapping,document,path);
  if(audioOnly)return field?resolveFieldTargets(documents,gate?{...field,gate}:field).map(target=>pronunciationButtonHTML(register(target),{ariaLabel:labels().play})).join(''):'';
  return field?fieldTargetHTML(documents,gate?{...field,gate}:field,{register,ariaLabel:labels().play}).replace(/\n/g,'<br>'):h(value===''?labels().missing:value).replace(/\n/g,'<br>');
 };
 return {controller,renderField,
  resourceTarget:(target,labelHTML)=>`<button type="button" class="pronunciation-button resource-target" lang="ja" data-pronunciation-target="${h(register({text:target.text,speech:target.speech,lang:target.lang}))}" aria-label="${h(labels().play)}">${labelHTML}</button>`,
  lexicalAudio:target=>{const resolved=resolveLexicalAudioTarget(documents,target);return resolved?pronunciationButtonHTML(register(resolved),{ariaLabel:labels().play}):'';},
  audio:(data,selection,{gate}={})=>pronunciationButtonHTML(register(resolveUnitTarget(data,selection,{gate})),{ariaLabel:labels().play}),
  begin(){binding?.dispose();binding=null;registry.clear();controller.cancel();},
  bind(){binding=bindPronunciation(root,{controller,resolveTarget:id=>registry.get(id),getAccess,unavailableLabel:labels().audioUnavailable,hiddenLabel:labels().audioHidden,onError:status});status(controller.getStatus());},
  sync(){binding?.sync();},cancel(){controller.cancel();},dispose(){binding?.dispose();controller.dispose();}
 };
}
