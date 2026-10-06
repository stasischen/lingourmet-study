import {UI,h} from './i18n.mjs';
import {getPracticeAudioAccess,currentItemId} from './practice-session.mjs';
import {FLASHCARD_LABELS,getFlashcardAudioAccess,currentFlashcardId} from './flashcard-session.mjs';
export function initialPracticeMode(params){return params.get('mode')==='cards'?'cards':'questions';}
export function modeNavigation(mode,uiLocale){return `<nav class="practice-mode-nav" aria-label="${h(UI[uiLocale].practice)}"><button type="button" data-practice-mode="questions" aria-pressed="${mode==='questions'}">${h(UI[uiLocale].practice)}</button><button type="button" data-practice-mode="cards" aria-pressed="${mode==='cards'}">${h(FLASHCARD_LABELS[uiLocale].title)}</button></nav>`;}
export function activePracticeAccess(mode,practiceState,flashState){return mode==='cards'?getFlashcardAudioAccess(flashState):getPracticeAudioAccess(practiceState);}
export function activePracticeView({mode,practiceState,flashState,lesson,cards,showLesson=false}){
 const state=mode==='cards'?flashState:practiceState;
 const materialRefs=mode==='cards'?cards.find(c=>c.id===currentFlashcardId(state))?.sourceRefs:lesson.practice.items.find(q=>q.id===currentItemId(state))?.sourceRefs;
 let phase=state.phase;
 if(showLesson)phase='ready';
 else if(phase==='ready')phase='mode-ready';
 return {phase,materialRefs,canReturnToContent:!showLesson&&['ready','complete','ended'].includes(state.phase)};
}
