export const NAMESPACE='lingourmet.language-core.private.v1';
export function loadEvents(storage){const raw=storage.getItem(NAMESPACE);if(raw===null)return [];const parsed=JSON.parse(raw);if(!Array.isArray(parsed))throw new Error('PRIVATE_STATE_INVALID');return parsed;}
export function saveSelfCheck(storage,{identity,practiceVersion,answerSignature,packageDigest,result}){
 if(!identity||!Number.isSafeInteger(practiceVersion)||!/^[a-f0-9]{64}$/.test(answerSignature)||!/^[a-f0-9]{64}$/.test(packageDigest)||!['understood','retry'].includes(result))throw new Error('PRIVATE_EVENT_INVALID');
 const events=loadEvents(storage);if(events.some(e=>e.identity===identity&&e.practiceVersion===practiceVersion&&e.answerSignature!==answerSignature))throw new Error('PRACTICE_SIGNATURE_CONFLICT');
 const event={identity,practiceVersion,answerSignature,packageDigest,result,recordedAt:new Date().toISOString()};events.push(event);storage.setItem(NAMESPACE,JSON.stringify(events));return event;
}
