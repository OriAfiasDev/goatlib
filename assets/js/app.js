// Boot: load content → apply theme → render sections in the order site.json lists → mount behaviours.
import { registry } from './sections/registry.js';
import { renderHeader, renderFooter, renderFloat, mountChrome } from './sections/chrome.js';
import { scLabel } from './core/format.js';

const CONTENT = 'content/';

async function getJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

function applyTheme(site) {
  const root = document.documentElement;
  Object.entries(site.theme?.colors || {}).forEach(([name, value]) => root.style.setProperty(`--${name}`, value));
  const set = site.theme?.colors?.set;
  if (set) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', set);
  if (site.lang) root.lang = site.lang;
  if (site.dir) root.dir = site.dir;
  if (site.meta?.title) document.title = site.meta.title;
  if (site.meta?.description) document.querySelector('meta[name="description"]')?.setAttribute('content', site.meta.description);
}

async function boot() {
  const site = await getJSON(`${CONTENT}site.json`);
  applyTheme(site);

  const ids = site.sections || [];
  const results = await Promise.allSettled(ids.map((id) => getJSON(`${CONTENT}sections/${id}.json`)));

  // scene numbers follow the order, so reordering in the CMS renumbers "SC 01, SC 02…"
  let n = 0;
  const sections = results.map((r, i) => {
    if (r.status !== 'fulfilled') {
      console.warn(`[content] ${ids[i]}:`, r.reason);
      return null;
    }
    const data = r.value;
    const mod = registry[data.type];
    if (!mod) {
      console.warn(`[content] unknown section type "${data.type}" in ${ids[i]}.json`);
      return null;
    }
    const numbered = data.type === 'hero' || Boolean(data.slate);
    const ctx = { site, sc: numbered ? scLabel(++n) : '' };
    return { id: ids[i], data, mod, ctx };
  }).filter(Boolean);

  document.querySelector('[data-header]').innerHTML = renderHeader(site);
  document.querySelector('[data-footer]').innerHTML = renderFooter(site);
  document.querySelector('[data-skip]').textContent = site.skipLink || '';
  const main = document.getElementById('main');
  main.innerHTML = sections.map((s) => `<div class="section-slot" data-slot="${s.id}">${s.mod.render(s.data, s.ctx)}</div>`).join('');
  document.body.insertAdjacentHTML('beforeend', renderFloat(site));
  document.documentElement.classList.add('is-ready');

  for (const s of sections) {
    if (!s.mod.mount) continue;
    const el = main.querySelector(`[data-slot="${s.id}"]`).firstElementChild;
    try {
      await s.mod.mount(el, s.data, s.ctx);
    } catch (err) {
      console.error(`[mount] ${s.id}`, err);
    }
  }
  mountChrome(site);

  // honour a #hash now that the target exists
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

boot().catch((err) => {
  console.error(err);
  document.getElementById('main').innerHTML =
    '<p class="boot-error">לא הצלחנו לטעון את התוכן. אם פתחתם את הקובץ ישירות מהמחשב, הריצו שרת מקומי (למשל <code dir="ltr">python3 -m http.server</code>).</p>';
});
