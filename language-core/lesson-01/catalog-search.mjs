/** Read-only search over an admitted catalog. Call loadEntryPackage first: this
 * projection does not replace its raw-byte SHA-256 source-pin admission.
 * Search profile v1: NFC, trim/collapse Unicode whitespace, locale-independent
 * lowercasing. Literal substring in one field; no aliases, stemming, width or
 * diacritic folding. Catalog insertion order is the authored result order.
 */
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const refs = value => Array.isArray(value) && value.every(nonempty);
const locales = Object.freeze(['zh-Hant', 'en', 'ja']);
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
export const CATALOG_SEARCH_PROFILE = 'nfc-whitespace-lowercase-substring-v1';
export function normalizeCatalogQuery(value) {
  if (typeof value !== 'string') throw new TypeError('Expected a search string');
  return value.normalize('NFC').replace(/\s+/gu, ' ').trim().toLowerCase().normalize('NFC');
}

export function searchCatalog(catalog, options = {}) {
  const validOptions = record(options);
  const rawQuery = validOptions && own(options, 'query') ? options.query : '';
  const localeOption = validOptions && own(options, 'teachingLocale') ? options.teachingLocale : null;
  const teachingLocale = typeof localeOption === 'string' ? localeOption : null;
  const query = typeof rawQuery === 'string' ? normalizeCatalogQuery(rawQuery) : '';
  const result = (status, reason, items = [], missingLocaleIds = []) => freeze({
    status, reason, query, teachingLocale, items, total: items.length, missingLocaleIds
  });
  const unavailable = (reason, missing = []) => result('unavailable', reason, [], missing);
  if (!validOptions || typeof rawQuery !== 'string') return unavailable('invalid-query');
  if (!locales.includes(teachingLocale)) return unavailable('invalid-locale');
  if (!record(catalog) || !own(catalog, 'entries') || !record(catalog.entries) ||
      !own(catalog, 'examples') || !record(catalog.examples) ||
      !own(catalog, 'units') || !record(catalog.units)) return unavailable('invalid-catalog');
  const items = [], missingLocaleIds = [];
  for (const [id, entry] of Object.entries(catalog.entries)) {
    if (!nonempty(id) || !record(entry) || !own(entry, 'localizations') ||
        !record(entry.localizations) || !own(entry, 'exampleRefs') || !refs(entry.exampleRefs) ||
        !own(entry, 'relatedRefs') || !refs(entry.relatedRefs)) return unavailable('invalid-catalog');
    for (const ref of entry.relatedRefs) {
      if (!own(catalog.entries, ref)) return unavailable('missing-reference');
    }
    const examples = [];
    for (const ref of entry.exampleRefs) {
      if (!own(catalog.examples, ref)) return unavailable('missing-reference');
      const example = catalog.examples[ref];
      if (!record(example) || !own(example, 'unitRefs') || !refs(example.unitRefs)) return unavailable('invalid-catalog');
      const texts = [];
      for (const unitRef of example.unitRefs) {
        if (!own(catalog.units, unitRef)) return unavailable('missing-reference');
        const unit = catalog.units[unitRef];
        if (!record(unit) || !own(unit, 'tokens') || !Array.isArray(unit.tokens) ||
            unit.tokens.some(token => !record(token) || !own(token, 'text') || typeof token.text !== 'string')) {
          return unavailable('invalid-catalog');
        }
        texts.push(unit.tokens.map(token => token.text).join(''));
      }
      examples.push({id: ref, unitRefs: [...example.unitRefs], text: texts.join('')});
    }
    const localized = own(entry.localizations, teachingLocale) ? entry.localizations[teachingLocale] : null;
    if (!record(localized) || !own(localized, 'title') || !nonempty(localized.title) ||
        !own(localized, 'explanation') || !nonempty(localized.explanation)) {
      missingLocaleIds.push(id);
      continue;
    }
    const fields = [localized.title, localized.explanation, ...examples.map(example => example.text)];
    if (!query || fields.some(field => normalizeCatalogQuery(field).includes(query))) {
      items.push({id, title: localized.title, explanation: localized.explanation,
        exampleRefs: [...entry.exampleRefs], relatedRefs: [...entry.relatedRefs], examples});
    }
  }
  if (missingLocaleIds.length) return unavailable('missing-locale', missingLocaleIds);
  return result('resolved', items.length ? null : 'no-matches', items);
}
