/** Three physical documents; only same-directory, enumerated destinations are constructed. */
export const PAGE_FILES={content:'index.html',teaching:'teaching.html',practice:'practice.html'};
export function pageFromURL(value){const u=new URL(value);return u.pathname.endsWith('/teaching.html')?'teaching':u.pathname.endsWith('/practice.html')?'practice':'content';}
export function pageURL(value,page,updates={}){if(page!=='knowledge'&&!Object.hasOwn(PAGE_FILES,page))throw Error('Unknown lesson page');const u=new URL(value);u.pathname=u.pathname.replace(/[^/]*$/,(page==='knowledge'?'knowledge.html':PAGE_FILES[page]));u.hash='';u.searchParams.set('page',page);for(const [key,val] of Object.entries(updates)){if(val===null)u.searchParams.delete(key);else u.searchParams.set(key,String(val));}return u;}
export function legacyDestination(value){const u=new URL(value);if(pageFromURL(u)!=='content'||u.searchParams.get('page')==='content')return null;const view=u.searchParams.get('view');let page=view==='teaching'?'teaching':['practice','selected','cards'].includes(view)||u.searchParams.has('mode')||u.searchParams.has('deck')||u.searchParams.has('questionDeck')?'practice':null;if(u.searchParams.has('sourceUnit')||u.searchParams.get('return')==='practice')return null;if(!page&&u.hash==='#teaching')page='teaching';if(!page&&u.hash==='#practice')page='practice';if(!page)return null;const out=pageURL(u,page,{view:view==='selected'?'selected':null,...(view==='cards'?{mode:'cards'}:{})});out.hash=u.hash;return out;}
export function sourcePage(lesson,catalog,unit){if(!unit||!Object.hasOwn({...lesson.units,...catalog.units},unit))return null;for(const id of lesson.sourceOrder??[]){const src=lesson.sources[id];if((src.turns??src.paragraphs??[]).some(g=>g.unitRefs?.includes(unit)))return 'content';}for(const entry of Object.values(catalog.entries??{})){for(const id of entry?.exampleRefs??[]){const ex=catalog.examples[id];if((ex?.turns??[{unitRefs:ex?.unitRefs??[]}]).some(g=>g.unitRefs.includes(unit)))return 'knowledge';}}return null;}
export function returnPracticeURL(value){const u=new URL(value);if(u.searchParams.get('return')!=='practice')return null;const out=pageURL(u,'practice',{view:u.searchParams.get('returnView')==='selected'?'selected':null});const focus=u.searchParams.get('returnFocus');if(['question-material','card-material','selected-source'].includes(focus))out.searchParams.set('resumeFocus',focus);const item=u.searchParams.get('returnItem');if(focus==='selected-source'&&item&&item.length<=2048)out.searchParams.set('resumeItem',item);for(const key of ['returnFocus','returnItem','sourceUnit','sourceDocument','sourceRevision','sourceKind','sourceId','return','returnView','returnScroll','entry','q'])out.searchParams.delete(key);return out;}
export function boundedScroll(value){const n=Number(value);return Number.isFinite(n)&&n>=0&&n<=1000000?n:0;}

export function sourceEntry(catalog,unit){return Object.entries(catalog.entries??{}).find(([,entry])=>(entry.exampleRefs??[]).some(id=>(catalog.examples[id]?.turns??[{unitRefs:catalog.examples[id]?.unitRefs??[]}]).some(g=>g.unitRefs.includes(unit))))?.[0]??null;}

/** Native new-tab/window/download actions do not leave this document or discard its draft. */
export function sameTabClick(event,anchor){return (event.button??0)===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&(!anchor?.target||anchor.target.toLowerCase()==='_self')&&!anchor?.hasAttribute('download');}
export function leavesDocument(anchor,href){if(!anchor?.hasAttribute('href'))return false;try{const a=new URL(anchor.href,href),b=new URL(href);return a.origin!==b.origin||a.pathname!==b.pathname||a.search!==b.search||(!a.hash&&!anchor.getAttribute('href').startsWith('#'));}catch{return false;}}

/** Minimum viewport-relative correction after restoring a material-return scroll. */
export function returnFocusScrollDelta(rect,viewport,{navBottom=viewport.top,margin=8}={}){
 const values=[rect?.top,rect?.bottom,rect?.left,rect?.right,viewport?.top,viewport?.bottom,viewport?.left,viewport?.right,navBottom,margin];
 if(values.some(value=>!Number.isFinite(value))||rect.bottom<=rect.top||rect.right<=rect.left||viewport.bottom<=viewport.top||viewport.right<=viewport.left)return {x:0,y:0};
 const gap=Math.max(0,Math.min(margin,Math.min(viewport.bottom-viewport.top,viewport.right-viewport.left)/4));
 const top=Math.min(viewport.bottom-gap,Math.max(viewport.top,navBottom)+gap),bottom=viewport.bottom-gap,left=viewport.left+gap,right=viewport.right-gap;
 const shift=(start,end,min,max)=>end-start>max-min?start-min:start<min?start-min:end>max?end-max:0;
 return {x:shift(rect.left,rect.right,left,right),y:shift(rect.top,rect.bottom,top,bottom)};
}
