import {RESOURCE_PACK_SHA256} from './resource-lock.mjs';
import {rawSHA256} from './package-loader.mjs';
import {tokenSpeech} from './pronunciation.mjs';
const own=(x,k)=>x&&Object.hasOwn(x,k)?x[k]:undefined;
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const locales=['ja','zh-Hant','en'];
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
/** Only exact reviewed projections are admitted. External source revisions and transport hashes are distinct. */
export async function loadCompleteResources({sourceFiles,fetcher=globalThis.fetch,digest=rawSHA256}={}){
 const response=await fetcher('./knowledge-resources.json');assert(response.ok,'Resource package unavailable');const raw=await response.text();assert(await digest(raw)===RESOURCE_PACK_SHA256,'Resource package hash mismatch');const pack=JSON.parse(raw);
 assert(pack.format==='lingourmet.complete-resource.v1'&&record(pack.resources)&&record(pack.entryLinks)&&record(pack.sourceOwners)&&Array.isArray(pack.lessonBindings),'Invalid resource package');
 const sources=Object.create(null);const ownerNames={C:'catalog',L:'lesson'};
 for(const [id,owner]of Object.entries(pack.sourceOwners)){
  assert(Object.hasOwn(ownerNames,id)&&owner.id===id&&owner.sourceRevision?.kind==='sha256','Unknown resource source owner');
  assert(owner.sourceRevision.value===own(sourceFiles,ownerNames[id]),'Resource source revision mismatch');assert(owner.url===`./resource-owner-${id}.json`,'Invalid source transport route');
  const result=await fetcher(owner.url);assert(result.ok,'Resource source unavailable');const text=await result.text();assert(await digest(text)===owner.payloadSha256,'Resource source payload hash mismatch');const payload=JSON.parse(text);
  assert(payload.format==='lingourmet.source-owner-slice.v1'&&payload.ownerId===id&&payload.sourceRevision?.value===owner.sourceRevision.value&&record(payload.units),'Invalid resource source payload');sources[id]=payload;
 }
 function resolveTarget(ref){
  assert(record(ref)&&typeof ref.unit==='string','Invalid target reference');const isResource=Object.hasOwn(ref,'resourceId'),isSource=Object.hasOwn(ref,'sourceId');assert(isResource!==isSource,'Ambiguous target owner');
  const owner=isResource?own(pack.resources,ref.resourceId):own(sources,ref.sourceId);assert(owner,'Missing target owner');const unit=own(owner.units,ref.unit);assert(unit&&Array.isArray(unit.tokens)&&unit.tokens.length,'Missing target unit');
  assert(new Set(unit.tokens.map(t=>t.id)).size===unit.tokens.length&&unit.tokens.every(t=>typeof t.id==='string'&&typeof t.text==='string'),'Invalid target tokens');
  const start=unit.tokens.findIndex(t=>t.id===ref.from),end=unit.tokens.findIndex(t=>t.id===ref.to);assert(start>=0&&end>=start,'Invalid target range');const tokens=unit.tokens.slice(start,end+1);
  return {text:tokens.map(t=>t.text).join(''),speech:tokens.map(tokenSpeech).join(''),lang:'ja-JP',tokens,ref};
 }
 function inspect(value){
  if(Array.isArray(value)){value.forEach(inspect);return;}if(!record(value))return;
  if(Object.hasOwn(value,'ref')){const target=resolveTarget(value.ref);if(value.speech)assert(value.speech.lang===target.lang&&value.speech.text===target.text&&value.speech.reading===target.speech,'Stale cached target speech');}
  else if(Object.hasOwn(value,'unit')&&(Object.hasOwn(value,'resourceId')||Object.hasOwn(value,'sourceId')))resolveTarget(value);
  Object.values(value).forEach(inspect);
 }
 for(const [id,resource]of Object.entries(pack.resources)){
  assert(record(resource.units)&&record(resource.localizations)&&Array.isArray(resource.sectionOrder)&&resource.sectionOrder.length&&new Set(resource.sectionOrder).size===resource.sectionOrder.length,'Invalid resource structure');
  for(const [locale,copy]of Object.entries(resource.localizations)){assert(locales.includes(locale)&&typeof copy.title==='string'&&record(copy.sections),'Invalid resource locale');for(const sectionId of resource.sectionOrder){const section=own(copy.sections,sectionId);assert(section&&Array.isArray(section.runs),'Missing resource section');for(const run of section.runs)assert(record(run)&&((typeof run.text==='string')!==Object.hasOwn(run,'ref')),'Invalid resource run');}}
 }
 for(const link of Object.values(pack.entryLinks)){const resource=own(pack.resources,link.resourceId);assert(resource&&link.opensFullResource===true&&Array.isArray(link.sectionIds)&&link.sectionIds.every(id=>resource.sectionOrder.includes(id)),'Invalid detail link');}
 for(const binding of pack.lessonBindings)assert(typeof binding.teachingRefId==='string'&&own(pack.entryLinks,binding.entryId)&&JSON.stringify(binding.detailLink)===JSON.stringify(pack.entryLinks[binding.entryId]),'Invalid lesson detail binding');
 inspect(pack);freeze(pack);freeze(sources);
 return Object.freeze({
  getDetailLink:entryId=>own(pack.entryLinks,entryId)??null,
  getLessonBindings:teachingRefId=>pack.lessonBindings.find(x=>x.teachingRefId===teachingRefId)??null,
  getDetail(resourceId,teachingLocale){const resource=own(pack.resources,resourceId);if(!resource)return {status:'missing-resource'};const copy=locales.includes(teachingLocale)?own(resource.localizations,teachingLocale):null;if(!copy)return {status:'missing-locale'};return {status:'resolved',resourceId,title:copy.title,sections:resource.sectionOrder.map(id=>({id,runs:copy.sections[id].runs})),examples:resource.examples??[]};},
  resolveTarget
 });
}
