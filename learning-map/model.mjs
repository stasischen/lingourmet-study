/** Shared read model for this bounded preview; never a Language Core registry. */
export const FORMAT = 'lingourmet.learning-map.preview.v1';
export const LESSON_PATH = '/lingourmet-study/learning-map/lesson/index.html';
export async function digest(text) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(x => x.toString(16).padStart(2, '0')).join('');
}
export async function loadMap(fetcher, expectedHash) {
  const response = await fetcher('./map.json');
  if (!response.ok) throw Error('學習地圖資料無法載入');
  const text = await response.text();
  if (await digest(text) !== expectedHash) throw Error('學習地圖版本不符，停止顯示');
  const data = JSON.parse(text);
  if (data.format !== FORMAT || data.status !== 'proposal' || !Array.isArray(data.goal?.languagePlans) || !Array.isArray(data.sources) || !Array.isArray(data.externalRecords) || !Array.isArray(data.materials)) throw Error('學習地圖格式不符');
  if (data.scope?.level !== 'A1' || data.scope?.theme !== 'Theme01' || typeof data.goal.canDo !== 'string' || !data.pins?.['baseline.tsv'] || !data.pins?.['review.json']) throw Error('學習地圖範圍或來源版本不完整');
  for (const p of data.goal.languagePlans) {
    if (typeof p.id !== 'string' || typeof p.goal !== 'string' || !['prerequisites','inLessonSupport','placementRefs','grammarRefs','vocabularyRefs'].every(k=>Array.isArray(p[k]))) throw Error('本語課綱格式不符');
  }
  const languages = data.goal.languagePlans.map(p => p.language);
  if (languages.length !== 4 || new Set(languages).size !== 4 || !['ja','ko','th','en'].every(x => languages.includes(x))) throw Error('語言資料不完整');
  if (new Set(data.sources.map(s => s.id)).size !== data.sources.length) throw Error('來源 ID 重複');
  return data;
}

export function selectPlan(data, language, level, theme) {
  if (level !== data.scope.level || theme !== data.scope.theme) return null;
  return data.goal.languagePlans.find(p => p.language === language) ?? null;
}

export function resolveRef(data, ref, language) {
  const missing = reason => ({status:'missing', reason, ref});
  if (!ref || ref.kind !== 'external') return missing('本片沒有此 item／sense／form 的版本資料；無法解析');
  const source = data.sources.find(s => s.id === ref.sourceId);
  if (!source) return missing('找不到引用來源：' + ref.sourceId);
  // Only this explicitly scoped baseline locator is supported. Never infer
  // identity from Chinese gloss, family, comparison group, or nearby records.
  const grammar = `row #2; ${language}_表達及${language}_先修`;
  const vocabulary = `row #2; ${language}_表達：姓名槽與角色人稱`;
  if (ref.sourceId !== 'baseline' || ![grammar, vocabulary].includes(ref.locator)) return missing('來源定位尚未實作解析：' + ref.locator);
  const record = data.externalRecords.find(r => r.sourceId === source.id && r.row === '2' && r.version === source.version && r.sha256 === data.pins['baseline.tsv'].sha256);
  if (!record || ref.mappingStatus !== 'unmapped') return missing('來源版本不符或映射狀態不明');
  const expression = record.columns[`${language}_表達`], support = record.columns[`${language}_先修`];
  if (!expression || !support) return missing('缺少本語欄位，不使用其他語言替代');
  return {status:'unmapped', ref, source, expression, support,
    sourceStatus:record.columns[`${language}_來源狀態`], version:record.version,
    sha256:record.sha256, itemId:null, senseId:null, formId:null};
}

export function planView(data, language, level, theme) {
  const plan = selectPlan(data, language, level, theme);
  if (!plan) return null;
  return {plan,
    grammar:(plan.grammarRefs ?? []).map(r => resolveRef(data,r,language)),
    vocabulary:(plan.vocabularyRefs ?? []).map(r => resolveRef(data,r,language)),
    material: data.materials.find(m => m.planId === plan.id && m.language === language) ?? null};
}

/** A course link requires both explicit mapping and all exact built files.
 * Its review status remains a private candidate, separate from outline review. */
export async function admitMaterial(view, fetcher) {
  if (!view?.material) return {status:'absent', reason:'本片未連結此語言的完整教材'};
  if (view.plan.outlineReview !== 'accepted-outline') return {status:'pending',reason:'課綱待審，暫不開啟學習入口'};
  if ([...view.grammar,...view.vocabulary].some(r => r.status === 'missing')) return {status:'missing',reason:'引用缺失，暫不開啟學習入口'};
  const material = view.material;
  if (material.path !== LESSON_PATH || material.language !== 'ja' || material.status !== 'private-candidate') return {status:'missing',reason:'教材映射不在本片範圍'};
  try {
    const entries = Object.entries(material.runtimeFiles);
    for (const name of ['index.html','teaching.html','practice.html','lesson.json','knowledge-catalog.json','app.mjs','package-loader.mjs']) {
      if (!material.runtimeFiles[name]) throw Error('Missing file');
    }
    const docs = {};
    await Promise.all(entries.map(async ([file, hash]) => {
      if (!/^[a-zA-Z0-9_.-]+$/.test(file) || !/^[a-f0-9]{64}$/.test(hash)) throw Error('Invalid file');
      const response = await fetcher(material.path.replace('index.html',file));
      if (!response.ok) throw Error('Missing runtime');
      const text = await response.text();
      if (await digest(text) !== hash) throw Error('Stale runtime');
      if (['lesson.json','knowledge-catalog.json'].includes(file)) docs[file] = JSON.parse(text);
    }));
    const lesson = docs['lesson.json'], catalog = docs['knowledge-catalog.json'];
    for (const id of material.evidence.teachingRefs) {
      const ref = lesson.teachingRefs.find(r => r.id === id);
      if (!ref || !catalog.entries[ref.entryId]) throw Error('Missing teaching ref');
    }
    if (!material.evidence.practiceRefs.every(id => lesson.practice.items.some(q => q.id === id))) throw Error('Missing practice');
    return {status:'available', path:material.path, reason:'既有完整 L1 教材 · 審閱候選；非正式發布'};
  } catch {
    return {status:'missing',reason:'教材檔案缺失或版本不符，學習入口已停用'};
  }
}
