import {loadMap, planView, admitMaterial} from './model.mjs';
import {MAP_SHA256} from './map-lock.mjs';
const escape = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const languages = {ja:'日語',ko:'韓語',th:'泰語',en:'英語'};
function referenceCard(result, vocabulary) {
  if (result.status === 'missing') return `<div class="reference missing"><strong>引用缺失</strong><p>${escape(result.reason)}</p><code>${escape(result.ref?.targetId ?? result.ref?.locator)}</code></div>`;
  return `<div class="reference"><span class="badge">已定位來源 · 尚未映射</span><p class="expression">${escape(result.expression)}</p><p>${escape(result.support)}</p>${vocabulary?'<p>此處是用句中的姓名槽與角色人稱；尚未拆成獨立詞義項，不能當成完整詞表。</p>':''}<details><summary>查看引用與版本</summary><p>${escape(result.ref.note)}</p><p>${escape(result.source.title)} · ${escape(result.ref.locator)}</p><dl><dt>來源原狀態</dt><dd>${escape(result.sourceStatus)}</dd><dt>版本</dt><dd><code>${escape(result.version)}</code></dd><dt>SHA-256</dt><dd><code>${escape(result.sha256)}</code></dd><dt>item / sense / form</dt><dd>尚未映射 / 尚未映射 / 尚未映射</dd></dl></details></div>`;
}
export function mount(document, data, fetcher) {
  const result = document.querySelector('#result');
  const language = document.querySelector('#language'), level = document.querySelector('#level'), theme = document.querySelector('#theme');
  let epoch = 0;
  async function render() {
    const token = ++epoch;
    const lang = language.value;
    result.setAttribute('aria-busy','true');
    const view = planView(data,lang,level.value,theme.value);
    if (!view) {
      result.innerHTML = '<div class="empty"><h2>這個範圍尚未接線</h2><p>目前預覽僅有 A1／Theme01 的「介紹自己的名字」。沒有使用其他級別或語言的內容替代。</p></div>';
      result.setAttribute('aria-busy','false'); return;
    }
    const {plan} = view;
    const accepted = plan.outlineReview === 'accepted-outline';
    result.innerHTML = `<article><div class="section-head"><span class="eyebrow">CAN-DO / ${escape(languages[lang])}</span><span class="badge ${accepted?'accepted':'pending'}">${accepted?'綱要已審 · accepted-outline':'綱要待審 · '+escape(plan.outlineReview)}</span></div><h2>${escape(data.goal.canDo)}</h2><p class="goal">${escape(plan.goal)}</p><p>${escape(data.goal.scenario)}</p><details><summary>先修、支援與安排</summary><h3>先修</h3><p>${plan.prerequisites.length?plan.prerequisites.map(p=>escape(p.description)).join('；'):'本 plan 未列先修；不代表已驗證學員能力。'}</p><h3>當節支援</h3><ul>${plan.inLessonSupport.map(x=>`<li>${escape(x)}</li>`).join('')}</ul><h3>建議位置（proposal）</h3><ul>${plan.placementRefs.map(r=>`<li>${escape(r.purpose)}：${escape(r.locator)} · ${escape(r.status)}</li>`).join('')}</ul><p>${escape(plan.notes)}</p><p>plan ID：<code>${escape(plan.id)}</code></p><p>審查來源：<code>${escape(data.pins['review.json'].commit)}</code><br>SHA-256：<code>${escape(data.pins['review.json'].sha256)}</code></p></details></article><div class="columns"><article><h2>本語文法需求</h2>${view.grammar.length?view.grammar.map(r=>referenceCard(r,false)).join(''):'<p>未映射：本 plan 未提供文法引用。</p>'}</article><article><h2>本語詞彙需求</h2>${view.vocabulary.length?view.vocabulary.map(r=>referenceCard(r,true)).join(''):'<p>未映射：本 plan 未提供詞彙引用。</p>'}</article></div><article id="material"><h2>已有教材</h2><p role="status">核對教材檔案與引用…</p></article>`;
    const material = await admitMaterial(view,fetcher);
    // A slower previous language request cannot replace the current selection.
    if (token !== epoch) return;
    document.querySelector('#material').innerHTML = `<h2>已有教材</h2><p>${escape(material.reason)}</p>${material.status==='available'?`<a class="primary" href="${escape(material.path)}?page=content&amp;lang=zh-Hant&amp;ui=zh-Hant">進入日語 L1 學習預覽 →</a><p>姓名介紹對應 ${escape(view.material.evidence.teachingRefs.join('、'))}；練習 ${escape(view.material.evidence.practiceRefs.join('、'))}。這是整課入口，不表示整個 Theme01 已完成。</p><details><summary>教材版本與狀態</summary><p>原版本：<code>${escape(view.material.commit)}</code></p><p>保留原審閱候選狀態。本地預覽進度與正式路徑分開。</p></details>`:''}`;
    result.setAttribute('aria-busy','false');
  }
  document.querySelector('#filters').addEventListener('submit',e=>e.preventDefault());
  for (const select of [language,level,theme]) select.addEventListener('change',render);
  return {render,ready:render()};
}
if (typeof document !== 'undefined') {
  loadMap(globalThis.fetch.bind(globalThis),MAP_SHA256).then(async data=>await mount(document,data,globalThis.fetch.bind(globalThis)).ready).catch(error=>{
    const result = document.querySelector('#result'); result.setAttribute('aria-busy','false'); result.innerHTML = `<div class="missing" role="alert"><h2>無法顯示學習地圖</h2><p>${escape(error.message)}</p><p>沒有載入替代內容。請確認本地資料包後重新整理。</p></div>`;
  });
}
