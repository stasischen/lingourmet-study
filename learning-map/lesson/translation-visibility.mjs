/** Reading-only view state. No persistence, source mutation, answer reveal, or speech. */
export function createTranslationVisibility(initial=false){
 let visible=initial===true;
 return {get visible(){return visible;},toggle(){visible=!visible;return visible;}};
}
export function applyTranslationVisibility(root,visible,labels){
 for(const node of root.querySelectorAll('[data-original-translation]'))node.hidden=!visible;
 for(const button of root.querySelectorAll('[data-toggle-translations]')){
  button.textContent=visible?labels.hideTranslations:labels.showTranslations;
  button.setAttribute('aria-pressed',String(visible));
 }
}
export function toggleTranslationsFromClick(event,root,state,labels){
 const button=event.target.closest?.('[data-toggle-translations]');
 if(!button)return false;
 if(!root.contains(button)||button.disabled)return true;
 applyTranslationVisibility(root,state.toggle(),labels);return true;
}
