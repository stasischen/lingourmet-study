import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { uiStatusCopy } from '../../language-core/i18n.mjs';
import { NAMESPACE } from '../../language-core/state.mjs';

// Serve only the six public runtime files, never the checkout or private files.
const root = new URL('../../language-core/', import.meta.url);
const files = new Map([
  ['index.html', 'text/html'], ['app.mjs', 'text/javascript'],
  ['i18n.mjs', 'text/javascript'], ['state.mjs', 'text/javascript'],
  ['style.css', 'text/css'], ['preview-data.json', 'application/json'],
]);
const data = JSON.parse(await readFile(new URL('preview-data.json', root), 'utf8'));
const server = createServer(async (req, res) => {
  const name = req.url === '/language-core/' ? 'index.html' : req.url?.replace(/^\/language-core\//, '');
  if (req.method !== 'GET' || !files.has(name)) { res.writeHead(404).end(); return; }
  try { res.writeHead(200, { 'Content-Type': files.get(name) }); res.end(await readFile(new URL(name, root))); }
  catch { res.writeHead(500).end(); }
});
let browser;
let phase = 'start loopback server';
const pass = name => console.log(`PASS ${name}`);
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  phase = 'launch Chromium';
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: 'block' });
  let unexpectedRequests = 0, pageErrors = 0;
  // Deny and count every outgoing request except exact public static GETs.
  // This also catches same-origin uploads/query-string exfiltration.
  await context.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    const name = url.pathname === '/language-core/' ? 'index.html' : url.pathname.replace(/^\/language-core\//, '');
    if (url.origin !== origin || !url.pathname.startsWith('/language-core/') || url.search || req.method() !== 'GET' || !files.has(name)) {
      unexpectedRequests++;
      await route.abort();
    } else await route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.on('pageerror', () => pageErrors++);
  const countEvents = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '[]').length, NAMESPACE);
  await page.goto(`${origin}/language-core/`, { waitUntil: 'networkidle' });
  await page.locator('#items article').first().waitFor();
  assert.equal(await countEvents(), 0, 'fresh context must have no events');

  phase = 'two items and independent UI/teaching language switches';
  for (const ui of ['en', 'zh-Hant', 'ja']) {
    await page.selectOption('#ui', ui);
    const labels = uiStatusCopy.locales[ui];
    assert.equal(await page.locator('html').getAttribute('lang'), ui);
    assert.equal(await page.title(), labels.pageTitle);
    assert.equal(await page.locator('#teaching-label').textContent(), labels.teachingLanguage);
    for (const locale of ['en', 'zh-Hant', 'ja']) {
      await page.selectOption('#locale', locale);
      assert.equal(await page.locator('#ui').inputValue(), ui);
      assert.equal(await page.locator('#items article').count(), 2);
      for (let i = 0; i < 2; i++) {
        const article = page.locator('#items article').nth(i);
        assert.equal(await article.locator('.practice > p').textContent(), data.views[locale].items[i].teaching.record.payload.exercises[0].instructions);
        assert.equal(await article.locator('.answer').isVisible(), false);
        assert.equal(await article.getByRole('button', { name: labels.startPractice, exact: true }).count(), 1);
      }
    }
    await page.selectOption('#locale', 'fr');
    assert.equal(await page.locator('#items article').count(), 0);
    assert.equal(await page.locator('#items .missing').textContent(), labels.missing);
  }
  assert.equal(await countEvents(), 0);
  pass('2 items, 9 independent language combinations, missing French without fallback');

  phase = 'answer visibility, return/re-entry and duplicate prevention';
  await page.selectOption('#ui', 'en');
  await page.selectOption('#locale', 'en');
  const L = uiStatusCopy.locales.en;
  for (let i = 0; i < 2; i++) {
    const article = page.locator('#items article').nth(i);
    const answer = article.locator('.answer');
    const button = name => article.getByRole('button', { name, exact: true });
    await button(L.startPractice).click();
    assert.equal(await article.locator('.sections').isVisible(), false);
    assert.equal(await answer.isVisible(), false);
    // Even a synthetic click cannot save before reveal.
    await button(L.understood).evaluate(el => el.click());
    assert.equal(await countEvents(), i);
    await button(L.showAnswer).click();
    assert.equal(await answer.isVisible(), true);
    assert.deepEqual(await answer.locator('.native').allTextContents(), data.views.en.items[i].practices[0].answers.flatMap(a => a.texts));
    await button(L.hideAnswer).click();
    assert.equal(await answer.isVisible(), false);
    await button(L.showAnswer).click();
    await button(L.understood).evaluate(el => { el.click(); el.click(); });
    assert.equal(await countEvents(), i + 1);
    assert.equal(await button(L.understood).isDisabled(), true);
    assert.equal(await button(L.retry).isDisabled(), true);
    await button(L.returnToTeaching).click();
    assert.equal(await article.locator('.sections').isVisible(), true);
    assert.equal(await answer.isVisible(), false);
    await button(L.startPractice).click();
    assert.equal(await answer.isVisible(), false);
    await button(L.showAnswer).click();
    assert.equal(await button(L.understood).isEnabled(), true);
    await button(L.returnToTeaching).click();
    assert.equal(await countEvents(), i + 1);
  }
  pass('both exercises: initially hidden, reveal/hide, return/re-entry, one event per attempt');

  phase = 'private state persistence and network boundary';
  await page.selectOption('#ui', 'ja');
  await page.selectOption('#locale', 'zh-Hant');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await countEvents(), 2);
  assert.equal(await page.locator('#history .event').count(), 2);
  // Check namespace only; do not print or serialize private event content.
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), [NAMESPACE]);
  assert.equal(pageErrors, 0, 'no uncaught browser errors');
  assert.equal(unexpectedRequests, 0, 'no outbound or non-static requests');
  const cleanContext = await browser.newContext({ serviceWorkers: 'block' });
  await cleanContext.route('**/*', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html>' }));
  const cleanPage = await cleanContext.newPage();
  await cleanPage.goto(`${origin}/language-core/`);
  assert.equal(await cleanPage.evaluate(() => localStorage.length), 0);
  await cleanContext.close();
  pass('local history survives reload, isolated from a new browser context, no network transmission');
  console.log('PASS Language Core browser smoke');
} catch (error) {
  // Fixed phase + stack locations, no browser state/HTML/network bodies in CI logs.
  console.error(`FAIL ${phase} (${error.name})`);
  console.error(String(error.stack).split('\n').filter(line => /^\s+at /.test(line)).join('\n'));
  process.exitCode = 1;
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
