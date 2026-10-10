import {admitChoiceAssessments} from './choice-assessment.mjs';
import {fieldMappingFor,resolveFieldTargets} from './pronunciation.mjs';
import {CHOICE_ASSESSMENTS_SHA256} from './choice-assessments-lock.mjs';
import {loadLessonPresentation} from './lesson-presentation.mjs';
import {createDictionaryResolver} from './dictionary-resolver.mjs';
const unavailableDictionary={format:'lingourmet.dictionary-lookup.v1',availability:'unavailable',snapshot:'runtime-index-unavailable',clusters:[]};
const files=['lesson.json','knowledge-catalog.json','target-mapping.json','lexical-analysis.json','lexical-practice-selections.json','cloze-practice-selections.json'];
export async function rawSHA256(text){const bytes=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
/** Admit exact source pins before any annotated UI is mounted. Fail closed on stale data. */
export async function loadLearningPackage(fetcher=globalThis.fetch,digest=rawSHA256){
 const dictionaryPromise=(async()=>{try{const response=await fetcher('./candidate-dictionary-index.json');if(!response.ok)return unavailableDictionary;const index=JSON.parse(await response.text());createDictionaryResolver({index,allowCandidate:true});return index;}catch{return unavailableDictionary;}})();
 const responses=await Promise.all(files.map(file=>fetcher('./'+file)));if(responses.some(r=>!r.ok))throw new Error('Lesson files unavailable');
 const texts=await Promise.all(responses.map(r=>r.text()));const [lesson,catalog,mapping,lexicalAnalysis,lexicalPracticeSelections,clozePracticeSelections]=texts.map(JSON.parse);const dictionaryIndex=await dictionaryPromise;
 for(const [name,index] of [['lesson',0],['catalog',1]]){const expected=lexicalAnalysis.sourceFiles?.[name];if(typeof expected!=='string'||!expected.match(/^[a-f0-9]{64}$/)||await digest(texts[index])!==expected)throw new Error('Stale lexical source pin: '+name);}
 if(lexicalPracticeSelections.lexicalProjectionSHA256!==await digest(texts[3]))throw new Error('Stale lexical practice analysis pin');
 for(const name of ['lesson','catalog'])if(lexicalPracticeSelections.sourceFiles?.[name]!==lexicalAnalysis.sourceFiles[name])throw new Error('Stale lexical practice source pin');
 for(const name of ['lesson','catalog'])if(clozePracticeSelections.sourceFiles?.[name]!==lexicalAnalysis.sourceFiles[name])throw new Error('Stale cloze source pin');
 const lessonPresentation=await loadLessonPresentation(fetcher,digest,{lesson,catalog,analysis:lexicalAnalysis,texts:{'lesson.json':texts[0],'knowledge-catalog.json':texts[1],'lexical-analysis.json':texts[3]}});
 const assessmentResponse=await fetcher('./choice-assessments.json');if(!assessmentResponse.ok)throw new Error('Choice assessments unavailable');
 const assessmentText=await assessmentResponse.text();if(await digest(assessmentText)!==CHOICE_ASSESSMENTS_SHA256)throw new Error('Stale choice assessment pin');
 const assessments=JSON.parse(assessmentText);if(assessments.sourceLessonSHA256!==lexicalAnalysis.sourceFiles.lesson)throw new Error('Stale choice assessment lesson');
 const admittedLesson=admitChoiceAssessments(lesson,assessments);
 if(admittedLesson.practice.choiceFeedbackRendering==='explicit-field-targets-v1')for(const [index,item]of admittedLesson.practice.items.entries()){
  if(!item.choiceAssessment)continue;
  for(const option of item.options)for(const locale of ['ja','zh-Hant','en']){
   const path=['practice','items',index,'choiceAssessment','feedbackByOption',option.id,locale],matches=mapping.fields.filter(f=>f.document==='lesson'&&JSON.stringify(f.path)===JSON.stringify(path));
   if(matches.length!==1||!matches[0].segments.every(s=>s.targetRef?.unit||['Q09','Q10','Q11','Q12'].includes(item.id)&&typeof s.reading==='string'&&s.reading.trim()&&s.provenanceTargetRef?.unit&&(lesson.units[s.provenanceTargetRef.unit]||catalog.units[s.provenanceTargetRef.unit])))throw Error('Missing explicit feedback targets: '+item.id+'/'+option.id+'/'+locale);
   resolveFieldTargets({lesson:admittedLesson,catalog},matches[0]);
  }
 }
 return {lessonPresentation,lesson:admittedLesson,catalog,lexicalPracticeSelections,clozePracticeSelections,mapping:{...mapping,fields:[...mapping.fields,...lexicalAnalysis.fieldTargets??[]]},lexicalAnalysis,dictionaryIndex};
}

/** Knowledge pages resolve their own catalog source; they do not fetch or depend on a lesson. */
export async function loadEntryPackage(fetcher=globalThis.fetch,digest=rawSHA256){
 const names=['knowledge-catalog.json','target-mapping.json','lexical-analysis.json'];
 const responses=await Promise.all(names.map(file=>fetcher('./'+file)));if(responses.some(r=>!r.ok))throw new Error('Catalog files unavailable');
 const texts=await Promise.all(responses.map(r=>r.text()));const [catalog,mapping,lexicalAnalysis]=texts.map(JSON.parse);
 if(await digest(texts[0])!==lexicalAnalysis.sourceFiles?.catalog)throw new Error('Stale lexical catalog pin');
 let dictionaryIndex=unavailableDictionary;try{const response=await fetcher('./candidate-dictionary-index.json');if(response.ok){const value=JSON.parse(await response.text());createDictionaryResolver({index:value,allowCandidate:true});dictionaryIndex=value;}}catch{}
 return {catalog,mapping:{...mapping,fields:[...mapping.fields,...lexicalAnalysis.fieldTargets??[]]},lexicalAnalysis,dictionaryIndex};
}
