import {h} from './i18n.mjs';

export const LISTENING_SKIP_HINTS={
 'zh-Hant':'裝置目前沒有可用的日語語音。你可以按「略過」，繼續其他題目。',
 en:'Japanese speech is unavailable on this device. Choose “Skip” to continue to another question.',
 ja:'この端末では日本語の音声を利用できません。「スキップ」で次の問題に進めます。'
};

/** The existing audio registry owns availability and target access checks. */
export function renderListeningPrompt(item,{uiLocale,available,disabled=false,audio}){
 if(!item.listeningRef)return '';
 return `<div class="practice-listening"><fieldset${disabled?' disabled':''}>${audio()}</fieldset><p data-listening-unavailable role="status"${available?' hidden':''}>${h(LISTENING_SKIP_HINTS[uiLocale])}</p></div>`;
}

/** Voice lists can arrive or disappear without a question rerender. */
export function syncListeningGuidance(root,{available}){
 root.querySelectorAll('[data-listening-unavailable]').forEach(el=>{el.hidden=available;});
}
