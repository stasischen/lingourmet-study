// Navigation is resolved only from the verified full-resource adapter, never copied by surface text.
export function entryDestination(adapter,entryId,locale){
 const link=adapter?.getDetailLink(entryId);if(!link||link.opensFullResource!==true||!Array.isArray(link.sectionIds)||!link.sectionIds.length||new Set(link.sectionIds).size!==link.sectionIds.length)return null;
 const detail=adapter.getDetail(link.resourceId,locale);
 if(detail.status!=='resolved'||link.sectionIds.some(id=>typeof id!=='string'||!detail.sections.some(section=>section.id===id)))return null;
 return `resource-${link.sectionIds[0]}`;
}
export function focusResourceDestination({root,adapter,entryId,locale,location,history,restoreFocus=true,expandExamples=true}){
 const primary=entryDestination(adapter,entryId,locale);if(!primary)return false;
 let requested;try{requested=decodeURIComponent(location.hash.slice(1));}catch{return false;}
 // Unknown explicit fragments fail closed rather than silently substituting a different topic.
 const id=requested||primary;
 const target=[...root.querySelectorAll('[data-resource-section], #resource-lesson-examples')].find(el=>el.id===id);
 if(!target)return false;
 if(!requested){const next=new URL(location.href);next.hash=primary;history.replaceState(history.state,'',next);}
 const examples=target.id==='resource-lesson-examples';if(examples&&expandExamples)target.open=true;
 if(restoreFocus)(examples?target.querySelector('summary'):target)?.focus();
 target.scrollIntoView();return true;
}
