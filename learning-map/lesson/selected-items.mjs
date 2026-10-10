/** Versioned local selections. This module never modifies lesson data or practice history. */
export const SELECTED_ITEMS_NAMESPACE = 'lingourmet:pilot:selected-items:v1';
const copy = value => JSON.parse(JSON.stringify(value));
const required = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`Missing selected reference ${field}`);
  return value;
};
/** Whitelist canonical source fields: UI and support language are deliberately excluded. */
export function normalizeSelectedRef(input) {
  if (!input || !['sentence', 'token', 'expression'].includes(input.kind)) throw new TypeError('Invalid selected kind');
  const ref = {};
  for (const field of ['lessonId', 'sourceRevision', 'document', 'targetLanguage', 'kind', 'unit']) ref[field] = required(input[field], field);
  if (ref.kind !== 'sentence') ref.id = required(input.id, 'id');
  if (ref.kind === 'expression') {
    ref.from = required(input.from, 'from');
    ref.to = required(input.to, 'to');
  }
  return ref;
}
export const selectedItemId = ref => `selected:v1:${JSON.stringify(normalizeSelectedRef(ref))}`;
export function selectedItemsKey(lessonId) {
  return `${SELECTED_ITEMS_NAMESPACE}:${encodeURIComponent(required(lessonId, 'lessonId'))}`;
}
function validateEnvelope(saved, lessonId) {
  if (saved?.schemaVersion !== 1 || saved.lessonId !== lessonId || !Array.isArray(saved.items)) throw new Error('Incompatible selection store');
  const ids = new Set();
  return saved.items.map(item => {
    const ref = normalizeSelectedRef(item.ref), id = selectedItemId(ref);
    if (ref.lessonId !== lessonId || id !== item.id || ids.has(id) || typeof item.addedAt !== 'string' || !Number.isFinite(Date.parse(item.addedAt))) throw new Error('Invalid saved selection');
    ids.add(id);
    return {id, ref, addedAt: item.addedAt};
  });
}
/** A failed write preserves the committed list; retrySave retries exactly the requested operation.
 * Malformed/unknown records are never overwritten. restore() retries reading the original key.
 * External-tab changes are re-read before mutations, avoiding stale in-memory list overwrites.
 */
export function createSelectedItemsStore({storage, lessonId, now = () => new Date().toISOString()}) {
  const key = selectedItemsKey(lessonId), listeners = new Set();
  let items = [], error = null, pending = null, blocked = false;
  const snapshot = () => ({schemaVersion: 1, lessonId, items: copy(items), error, pending: pending ? copy(pending) : null});
  const notify = () => { for (const listener of listeners) listener(snapshot()); };
  function read() {
    if (typeof storage?.getItem !== 'function') throw new Error('Storage unavailable');
    const raw = storage.getItem(key);
    return raw === null || raw === undefined ? [] : validateEnvelope(JSON.parse(raw), lessonId);
  }
  function restore() {
    try { items = read(); error = null; pending = null; blocked = false; }
    catch { error = 'read'; blocked = true; }
    notify(); return snapshot();
  }
  function mutate(operation, retry = false) {
    if (blocked || (pending && !retry)) return snapshot();
    try { items = read(); }
    catch { error = 'read'; blocked = true; notify(); return snapshot(); }
    const existing = items.find(item => item.id === operation.id);
    const next = operation.type === 'add' ? existing ? items : [...items, operation.item] : items.filter(item => item.id !== operation.id);
    if (JSON.stringify(next) === JSON.stringify(items)) { error = null; pending = null; notify(); return snapshot(); }
    try {
      if (typeof storage?.setItem !== 'function') throw new Error('Storage unavailable');
      storage.setItem(key, JSON.stringify({schemaVersion: 1, lessonId, items: next}));
      items = next; error = null; pending = null;
    } catch { error = 'save'; pending = copy(operation); }
    notify(); return snapshot();
  }
  function add(input) {
    const ref = normalizeSelectedRef(input);
    if (ref.lessonId !== lessonId) throw new TypeError('Selection belongs to another lesson');
    const addedAt = now();
    if (typeof addedAt !== 'string' || !Number.isFinite(Date.parse(addedAt))) throw new TypeError('Invalid selected timestamp');
    const id = selectedItemId(ref);
    return mutate({type: 'add', id, item: {id, ref, addedAt}});
  }
  function remove(input) { return mutate({type: 'remove', id: typeof input === 'string' ? input : selectedItemId(input)}); }
  restore();
  return {
    key, add, remove, restore,
    list: () => copy(items),
    has: input => items.some(item => item.id === (typeof input === 'string' ? input : selectedItemId(input))),
    retrySave: () => pending ? mutate(pending, true) : snapshot(),
    get state() { return snapshot(); },
    get canPersist() { return !blocked && typeof storage?.setItem === 'function'; },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
}
