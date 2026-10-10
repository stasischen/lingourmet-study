import {acceptsPriorSelectedRevision} from './selected-source-compatibility.mjs';
import {normalizeSelectedRef, selectedItemId} from './selected-items.mjs';
const clone = value => JSON.parse(JSON.stringify(value));
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const own = (object, key) => object && Object.hasOwn(object, key) ? object[key] : undefined;
const localeKey = key => typeof key === 'string' && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(key);
const textOf = tokens => tokens.map(token => token.text).join('');
const unavailable = (code, ref, extra = {}) => ({status: 'unavailable', code, ref: ref ? clone(ref) : null, ...extra});
function range(unit, from, to) {
  const start = unit.tokens.findIndex(t => t.id === from), end = unit.tokens.findIndex(t => t.id === to);
  return start < 0 || end < start ? null : unit.tokens.slice(start, end + 1);
}
/** Convert the host's reading selection into an exact immutable content reference. */
export function createSelectedRef(data, selection, {lessonId, analysis, sourceRevisions = analysis?.sourceFiles, targetLanguage = 'ja'} = {}) {
  const document = data.unitOwners?.[selection.unit];
  const input = {lessonId, sourceRevision: sourceRevisions?.[document], document, targetLanguage, kind: selection.kind, unit: selection.unit};
  if (selection.kind !== 'sentence') input.id = selection.id;
  if (selection.kind === 'expression') {
    const target = analysis?.expressions?.[selection.id]?.target;
    input.from = target?.fromTokenId; input.to = target?.toTokenId;
  }
  const ref = normalizeSelectedRef(input);
  const result = resolveSelectedRef(data, ref, {analysis, sourceRevisions, lessonId});
  if (result.status !== 'available') throw new TypeError(`Cannot select source: ${result.code}`);
  return ref;
}
/** No same-text, first-occurrence, index, or current-revision fallback. */
export function resolveSelectedRef(data, input, {analysis, sourceRevisions = analysis?.sourceFiles, lessonId} = {}) {
  let ref;
  try { ref = normalizeSelectedRef(input); } catch { return unavailable('invalid_ref', null); }
  if (lessonId && ref.lessonId !== lessonId) return unavailable('lesson_mismatch', ref);
  if (!sourceRevisions?.[ref.document]) return unavailable('missing_source_revision', ref);
  const compatiblePrior=sourceRevisions[ref.document]!==ref.sourceRevision&&acceptsPriorSelectedRevision(data,analysis,ref,sourceRevisions);
  if (sourceRevisions[ref.document] !== ref.sourceRevision&&!compatiblePrior) return unavailable('stale_source_revision', ref);
  const unit = data.units?.[ref.unit];
  if (!unit || !Array.isArray(unit.tokens) || !unit.tokens.length) return unavailable('missing_unit', ref);
  if (data.unitOwners?.[ref.unit] !== ref.document) return unavailable('source_owner_mismatch', ref);
  const activeSource=(data.sourceOrder??[]).some(id=>(data.sources?.[id]?.turns??data.sources?.[id]?.paragraphs??[]).some(group=>group.unitRefs?.includes(ref.unit)));
  const activeExample=Object.values(data.entries??{}).some(entry=>(entry.exampleRefs??[]).some(id=>data.examples?.[id]?.unitRefs?.includes(ref.unit)));
  if(!activeSource&&!activeExample)return unavailable('retired_source_reference',ref);
  if (unit.tokens.some(t => !nonempty(t.id) || typeof t.text !== 'string') || new Set(unit.tokens.map(t => t.id)).size !== unit.tokens.length) return unavailable('invalid_source_tokens', ref);
  let tokens = unit.tokens, entry = null, lexicalId = null;
  if (ref.kind === 'token') {
    tokens = range(unit, ref.id, ref.id);
    if (!tokens) return unavailable('missing_token', ref);
    const matches = Object.entries(analysis?.annotations ?? {}).filter(([, e]) => e.target?.document === ref.document && e.target?.unitId === ref.unit && e.target?.tokenId === ref.id);
    if (matches.length > 1) return unavailable('ambiguous_lexical_annotation', ref);
    if (matches.length) [lexicalId, entry] = matches[0];
  } else if (ref.kind === 'expression') {
    entry = analysis?.expressions?.[ref.id]; lexicalId = ref.id;
    if (!entry) return unavailable('missing_expression', ref);
    const target = entry.target, span = unit.spans?.find(s => s.id === target?.spanId);
    if (target?.document !== ref.document || target?.unitId !== ref.unit || target?.fromTokenId !== ref.from || target?.toTokenId !== ref.to || !span || span.from !== ref.from || span.to !== ref.to) return unavailable('stale_expression_range', ref);
    tokens = range(unit, ref.from, ref.to);
    if (!tokens) return unavailable('stale_expression_range', ref);
  }
  if (entry && analysis.sourceFiles?.[ref.document] !== ref.sourceRevision&&!compatiblePrior) return unavailable('stale_lexical_revision', ref);
  const text = textOf(tokens);
  if (entry && entry.surface !== text) return unavailable('stale_lexical_surface', ref);
  const meanings = Object.create(null);
  for (const locale of new Set([...Object.keys(data.localizations ?? {}), ...Object.keys(analysis?.localizations ?? {})])) {
    if (!localeKey(locale)) continue;
    const loc = own(own(data.localizations, locale)?.units, ref.unit), lex = own(analysis?.localizations, locale);
    // Only the exact reviewed occurrence owns lexical meaning. No legacy gloss or locale fallback.
    const meaning = ref.kind === 'sentence' ? own(loc, 'meaning') ?? own(loc, 'translation') : ref.kind === 'expression' ? own(own(lex?.expressions, lexicalId), 'meaning') : entry ? own(own(lex?.annotations, lexicalId), 'contextMeaning') : undefined;
    if (nonempty(meaning)) meanings[locale] = meaning;
  }
  const sourceRef = {unit: ref.unit, ...(ref.kind === 'sentence' ? {} : {from: tokens[0].id, to: tokens.at(-1).id})};
  return {status: 'available', ref, text, tokens: clone(tokens), meanings, lexicalId, sourceRef};
}
/** Stable, locale-neutral session scope; a changed selection set cannot overwrite an older round. */
export function selectedSessionIdentity(items, lessonId) {
  const ids = [...new Set(items.map(item => { try { return selectedItemId(item?.ref ?? item); } catch { return `invalid-ref:${JSON.stringify(item)}`; } }))].sort();
  return {lessonId: `${lessonId}:selected`, version: `selected-deck:v1:${JSON.stringify(ids)}`};
}
/** Reuse existing token boundaries and source order; punctuation is fixed by the assembly engine.
 * This is exact-source order checking, never semantic grading or an alternate-sentence generator.
 */
export function buildSelectedSentenceItem(resolved) {
  if (resolved?.status !== 'available' || resolved.ref.kind !== 'sentence') return unavailable('assembly_unavailable', resolved?.ref, {mode: 'assembly'});
  const {ref, tokens, text, sourceRef} = resolved;
  if (!tokens.length || tokens.some(t => !t.text || /^\s+$/u.test(t.text)) || tokens.filter(t => !/^\p{P}+$/u.test(t.text)).length < 2) return unavailable('assembly_unavailable', ref, {mode: 'assembly'});
  const selectedId = selectedItemId(ref), id = `assembly:selected:${selectedId}`;
  const item = {
    id, stage: 'controlled', responseType: 'ordering',
    title: {'zh-Hant': '句子練習', en: 'Sentence practice', ja: '文の練習'},
    prompt: {'zh-Hant': '把詞語排成你選的句子。', en: 'Arrange the words into your selected sentence.', ja: '言葉を並べて、選んだ文を作りましょう。'},
    options: tokens.map(t => ({id: t.id, text: t.text})),
    machineAnswerTokenOrder: tokens.map(t => t.id),
    answer: text,
    explanation: Object.assign(Object.create(null), resolved.meanings),
    sourceRefs: [clone(sourceRef)],
    selectedRef: clone(ref), selectedItemId: selectedId,
    sourceOrderPolicy: {mode: 'exact_source_order', semanticGrading: false, fixedPunctuationIds: tokens.filter(t => /^\p{P}+$/u.test(t.text)).map(t => t.id)}
  };
  return {status: 'available', id, selectedItemId: selectedId, selectedRef: clone(ref), sourceRefs: [clone(sourceRef)], item};
}
/** View-only projection compatible with createFlashcardController + existing flashcard renderer.
 * Source data is never rewritten. wordBank projects only selected sentences using existing
 * source token IDs and the exact source order. The host assembly engine fixes punctuation.
 */
export function buildSelectedPractice(data, items = [], {analysis, sourceRevisions = analysis?.sourceFiles, locale, lessonId, templates = ['recognition', 'production']} = {}) {
  if (!Array.isArray(items)) throw new TypeError('An explicit selected-item array is required');
  if (!nonempty(lessonId)) throw new TypeError('An explicit lessonId is required');
  if (!Array.isArray(templates) || templates.some(t => !['recognition', 'production', 'listening'].includes(t)) || new Set(templates).size !== templates.length) throw new TypeError('Unsupported selected card template');
  const cards = [], wordBank = [], issues = [], rejectedIds = [], seen = new Set(), units = {}, localizations = Object.fromEntries(Object.entries(clone(data.localizations ?? {})).filter(([language]) => localeKey(language)));
  const orderedItems = [...items].sort((a, b) => { const key = item => { try { return selectedItemId(item?.ref ?? item); } catch { return ''; } }; const left = key(a), right = key(b); return left < right ? -1 : left > right ? 1 : 0; });
  for (const item of orderedItems) {
    const result = resolveSelectedRef(data, item?.ref ?? item, {analysis, sourceRevisions, lessonId});
    if (result.status !== 'available') { issues.push(result);try{rejectedIds.push(selectedItemId(item?.ref??item));}catch{rejectedIds.push(`invalid-ref:${JSON.stringify(item)}`);}continue; }
    const {ref, tokens, meanings, sourceRef} = result, id = selectedItemId(ref);
    if (item.id && item.ref && item.id !== id) { issues.push(unavailable('invalid_selection_identity', ref)); continue; }
    if (seen.has(id)) continue;
    seen.add(id);
    if (!Object.keys(meanings).length) issues.push(unavailable('missing_meaning', ref));
    else {
      const virtualUnit = `selected-unit:${id}`;
      units[virtualUnit] = {tokens};
      for (const [language, meaning] of Object.entries(meanings)) {
        localizations[language] ??= {units: {}}; localizations[language].units ??= {};
        localizations[language].units[virtualUnit] = {meaning};
      }
      if (locale && (!localeKey(locale) || !Object.hasOwn(meanings, locale) || !nonempty(meanings[locale]))) issues.push(unavailable('missing_locale_meaning', ref, {locale}));
      for (const template of templates) cards.push({id: `flash:selected:${template}:${id}`, template, unit: virtualUnit, sourceRefs: [clone(sourceRef)], selectedItemId: id, selectedRef: clone(ref), signature: JSON.stringify({version: 1, ref, template, tokens})});
    }
    if (ref.kind === 'sentence') {
      const assembly = buildSelectedSentenceItem(result);
      if (assembly.status === 'available') wordBank.push(assembly);
      else issues.push(assembly);
    }
  }
  // Include unresolved selections in the scope too: fixing data must not silently reuse another set.
  const sessionIdentity = selectedSessionIdentity(items, lessonId);
  if(rejectedIds.length)sessionIdentity.version+=`:unavailable:${JSON.stringify([...new Set(rejectedIds)].sort())}`;
  return {status: !items.length ? 'empty' : !cards.length && !wordBank.length ? 'unavailable' : issues.length ? 'partial' : 'available', cards, wordBank, unavailable: issues, sessionIdentity, data: {...data, units: {...data.units, ...units}, localizations}};
}
