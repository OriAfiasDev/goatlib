// The afias studio editor's live preview (/_afias/preview.html, noindex). The editor posts its
// draft here; this page renders it with the site's own templates and stylesheet, so the canvas
// shows the real design, plus the data-afias-* attributes the editor uses to select a section
// and edit text in place. The public page never loads this file.
import { registry } from '../assets/js/sections/registry.js';
import { renderHeader, renderFooter } from '../assets/js/sections/chrome.js';
import { esc, scLabel } from '../assets/js/core/format.js';
import { fromStudio } from './content.js';

const root = document.getElementById('af-root');
const studio = root.dataset.studio;

// The hero and the process strip stay in their finished, static form here (no scroll sequence,
// no pinning), so every text is on screen and clickable. Only the marquee keeps its behaviour.
const BEHAVIOUR = new Set(['band']);
const mounted = new WeakSet();
let rendered = new Map(); // section id → { mod, data, ctx }

const failed = (err) => `<section class="wrap" style="padding-block:var(--s5)"><p class="missing">[התצוגה המקדימה נכשלה: ${esc(err.message)}]</p></section>`;
const tagRoot = (html, id) => html.replace(/<([a-z][\w-]*)/i, `<$1 data-afias-section="${esc(id)}"`);

// Content paths (assets/…) are relative to the site's root, and this page lives one folder down.
const fromRoot = (v) => {
  if (Array.isArray(v)) return v.map(fromRoot);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fromRoot(x)]));
  return typeof v === 'string' && /^assets\//.test(v) ? `../${v}` : v;
};

export function renderPreview(doc, pageId) {
  let content;
  try {
    content = fromRoot(fromStudio(doc, { pageId, ids: true }));
  } catch (err) {
    return { html: failed(err) };
  }
  const { site, sections } = content;
  rendered = new Map();
  let n = 0;
  const body = sections.map(({ id, data }) => {
    const mod = registry[data.type];
    // scene numbers follow the order, as in app.js
    const ctx = { site, sc: mod && (data.type === 'hero' || data.slate) ? scLabel(++n) : '', annotate: true };
    try {
      if (!mod) throw new Error(`סוג סקשן לא מוכר: ${data.type}`);
      const html = mod.render(data, ctx);
      rendered.set(id, { mod, data, ctx });
      return tagRoot(html, id);
    } catch (err) {
      return tagRoot(failed(err), id);
    }
  });
  queueMicrotask(afterRender);
  return {
    html: [
      `<header class="site-header" data-afias-key="header">${renderHeader(site)}</header>`,
      ...body,
      `<footer class="site-footer" data-afias-key="footer">${renderFooter(site)}</footer>`,
    ].join(''),
    css: `:root{${Object.entries(site.theme?.colors || {}).map(([name, value]) => `--${name}:${value}`).join(';')}}`,
  };
}

// The runtime swaps in only the sections whose markup changed; give the new ones their behaviour.
function afterRender() {
  for (const el of root.querySelectorAll(':scope > [data-afias-section]')) {
    if (mounted.has(el)) continue;
    mounted.add(el);
    const s = rendered.get(el.dataset.afiasSection);
    if (s?.mod.mount && BEHAVIOUR.has(s.data.type)) s.mod.mount(el, s.data, s.ctx);
  }
  syncHeader();
}

// the header turns solid once the hero is behind us, as on the site
function syncHeader() {
  const hero = root.querySelector('[data-hero]');
  root.querySelector('.site-header')?.classList.toggle('is-scrolled', hero ? hero.getBoundingClientRect().bottom <= 64 : scrollY > 40);
}
addEventListener('scroll', syncHeader, { passive: true });

if (!studio) {
  console.error('[afias] preview.html has no studio URL: build it with STUDIO_URL set.');
} else {
  import(`${studio}/kit/v1/preview.js`).then(({ connect }) =>
    connect({ root, render: renderPreview, origins: [new URL(studio).origin] }),
  );
}
