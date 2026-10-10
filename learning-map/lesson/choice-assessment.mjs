/** Question-owned authored feedback. No inferred answer, locale fallback or grading of prose. */
const locales=['ja','zh-Hant','en'];
const own=(x,k)=>x&&Object.hasOwn(x,k);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export const CHOICE_ASSESSMENT_VERSION='choice-feedback-v1';
export function choiceQuestionSignature(item){
 return JSON.stringify({id:item.id,responseType:item.responseType,answer:item.answer,options:item.options,sourceRefs:item.sourceRefs,prompt:item.prompt});
}
export function choiceSpec(item){
 if(!own(item,'choiceAssessment'))return null;
 const a=item.choiceAssessment,options=item.options,ids=options?.map(o=>o.id);
 if(item.responseType!=='choice'||!Array.isArray(options)||options.length<2||ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length||typeof item.answer!=='string'||!ids.includes(item.answer))throw Error('Invalid authored choice answer: '+item.id);
 if(!object(a)||a.version!==CHOICE_ASSESSMENT_VERSION||!['selection','selection-with-reason'].includes(a.responseMode)||!object(a.feedbackByOption)||Object.keys(a.feedbackByOption).length!==ids.length||Object.keys(a.feedbackByOption).some(id=>!ids.includes(id)))throw Error('Invalid authored choice assessment: '+item.id);
 for(const id of ids){const feedback=a.feedbackByOption[id];if(!object(feedback)||locales.some(locale=>!own(feedback,locale)||typeof feedback[locale]!=='string'||!feedback[locale].trim()))throw Error('Missing choice feedback locale: '+item.id+'/'+id);}
 for(const value of [item.prompt,...options.map(o=>o.text)])if(!(typeof value==='string'&&value.trim())&&(!object(value)||locales.some(locale=>typeof value[locale]!=='string'||!value[locale].trim())))throw Error('Missing authored choice text locale: '+item.id);
 return {version:a.version,responseMode:a.responseMode,optionIds:ids,answerOptionId:item.answer};
}
export function admitChoiceAssessments(lesson,pack){
 const items=lesson.practice?.items??[],choices=items.filter(item=>item.responseType==='choice'),ids=items.map(i=>i.id);
 if(new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!id)||!object(pack)||pack.format!=='lingourmet.choice-assessments.v1'||pack.version!==CHOICE_ASSESSMENT_VERSION||!object(pack.items)||Object.keys(pack.items).length!==choices.length||Object.keys(pack.items).some(id=>!choices.some(q=>q.id===id)))throw Error('Invalid choice assessment item set');
 const result=items.map(item=>{
  if(item.responseType!=='choice')return item;
  const record=pack.items[item.id];if(!object(record)||record.questionSignature!==choiceQuestionSignature(item))throw Error('Stale choice assessment question: '+item.id);
  const next={...item,choiceAssessment:record.assessment};choiceSpec(next);return next;
 });
 if(pack.presentation!==undefined){
  const p=pack.presentation,expected=items.filter(q=>!q.machineAnswerTokenOrder).map(q=>q.id);
  if(!object(p)||typeof p.version!=='string'||!/^learner-value-v[1-9][0-9]*$/.test(p.version)||!Array.isArray(p.questionOrder)||p.questionOrder.length!==expected.length||new Set(p.questionOrder).size!==expected.length||p.questionOrder.some(id=>!expected.includes(id)))throw Error('Invalid authored question presentation');
  if(p.previousVersions!==undefined&&(!Array.isArray(p.previousVersions)||new Set(p.previousVersions).size!==p.previousVersions.length||p.previousVersions.some(v=>typeof v!=='string'||!/^learner-value-v[1-9][0-9]*$/.test(v)||v===p.version)))throw Error('Invalid prior question presentation versions');
 }
 if(pack.feedbackRendering!==undefined&&pack.feedbackRendering!=='explicit-field-targets-v1')throw Error('Invalid authored feedback rendering');
 return {...lesson,practice:{...lesson.practice,items:result,...(pack.presentation?{questionOrder:[...pack.presentation.questionOrder],questionPresentationVersion:pack.presentation.version,...(pack.presentation.previousVersions?{priorQuestionPresentationVersions:[...pack.presentation.previousVersions]}:{})}:{}),...(pack.feedbackRendering?{choiceFeedbackRendering:pack.feedbackRendering}:{})}};
}
