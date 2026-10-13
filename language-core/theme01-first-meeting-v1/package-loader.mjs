import {PACKAGE_SHA256} from './package-lock.mjs';
import {validateLesson, withCatalog} from './model.mjs';
export const LANGUAGES = {ja:'日語 · 日本語',ko:'韓語 · 한국어',th:'泰語 · ภาษาไทย',en:'英語 · English'};
export const ID = 'theme01-first-meeting-v1';
const LOCALE = 'zh-Hant';
const sha = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function verified(path, expected, fetcher) {
 const response = await fetcher(path, {cache:'no-store'});
 if(!response.ok) throw Error('課程暫時無法載入，請重新整理。');
 const bytes = await response.arrayBuffer();
 if(await sha(bytes) !== expected) throw Error('課程內容已更新，請重新整理以載入同一版本。');
 return JSON.parse(new TextDecoder().decode(bytes));
}
export function validateCandidate(lesson, catalog, practice, language, expectedA) {
 const fail = message => {throw Error('課程資料不完整：'+message);};
 if(lesson.lessonId!==`${ID}:${language}` || lesson.targetLanguage!==language || JSON.stringify(lesson.teachingLocales)!=='["zh-Hant"]') fail('語言身份不符');
 if(practice.lessonId!==lesson.lessonId || practice.targetLanguage!==language) fail('練習身份不符');
 if(Object.entries(expectedA).some(([name,hash])=>practice.aSHA256?.[name]!==hash)) fail('練習與課文版本不符');
 const merged = withCatalog({...lesson, practice:{items:practice.items}}, catalog);
 const errors = validateLesson(merged,catalog);
 if(errors.length) fail(errors[0]);
 for(const [uid,unit] of Object.entries(merged.units)) if(!unit.tokens?.length || !merged.localizations[LOCALE]?.units?.[uid]?.meaning) fail('句子缺少原文或意思');
 for(const ref of lesson.teachingRefs) {const copy=catalog.entries[ref.entryId]?.localizations?.[LOCALE];if(!copy?.title||!copy.explanation||!copy.usage||!copy.limits) fail('教學缺少說明');}
 const ids = new Set(), covered = new Set();
 for(const q of practice.items??[]) {
  if(ids.has(q.id) || !q.id || q.responseType!=='choice') fail('題目身份不符');
  ids.add(q.id);
  if(!q.sourceRefs?.length || !q.goalRefs?.length || !q.prompt?.[LOCALE] || !q.title?.[LOCALE] || !q.explanation?.[LOCALE]) fail('題目缺少內容或回鏈');
  for(const goal of q.goalRefs) {if(!lesson.goalOrder.includes(goal)) fail('未知學習目標'); covered.add(goal);}
  for(const option of q.options) if(!option.text?.[LOCALE] || !q.choiceAssessment?.feedbackByOption?.[option.id]?.[LOCALE]) fail('選項缺少回饋');
 }
 if(lesson.goalOrder.some(goal=>!covered.has(goal))) fail('學習目標尚無練習');
 if(!practice.rehearsals?.length) fail('缺少表達練習');
 for(const task of practice.rehearsals) {
  if(ids.has(task.id) || !task.id || !task.title || !task.prompt || !task.feedback || !task.sample?.length || !task.checklist?.length) fail('表達練習不完整');
  ids.add(task.id);
  if(!task.sourceRefs?.length || task.sourceRefs.some(r=>!lesson.units[r.unit]) || !task.entryRefs?.length || task.entryRefs.some(r=>!catalog.entries[r]) || !task.goalRefs?.length || task.goalRefs.some(g=>!lesson.goalOrder.includes(g))) fail('表達練習回鏈不符');
 }
 return {...merged, rehearsals:practice.rehearsals};
}
export async function loadCandidate(language, fetcher=fetch) {
 if(!Object.hasOwn(LANGUAGES,language)) throw Error('請選擇日語、韓語、泰語或英語。');
 const manifest = await verified('./package.json', PACKAGE_SHA256, fetcher);
 if(manifest.lessonId!==ID) throw Error('課程身份不符。');
 const files = manifest.languages[language];
 const [lesson,catalog,practice] = await Promise.all(['lesson.json','knowledge-catalog.json','practice.json'].map(name=>verified(`./${language}/${name}`,files[name],fetcher)));
 const data = validateCandidate(lesson,catalog,practice,language,{'lesson.json':files['lesson.json'],'knowledge-catalog.json':files['knowledge-catalog.json']});
 return {data,language,locale:LOCALE,revision:PACKAGE_SHA256,storageKey:`lingourmet:${ID}:${language}:${files['practice.json']}`};
}
