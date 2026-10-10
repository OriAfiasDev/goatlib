// Text helpers shared by every section template.
// Templates are pure (data in, HTML string out) so the same code can later
// pre-render pages on a server or at build time, once the CMS exists.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const esc = (s = '') => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// CMS text → safe inline HTML.
//   **bold**            → <strong>
//   [חסר] / [חסר: …]    → highlighted "missing content" marker
//   line break          → <br>
export function inline(s = '') {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[חסר(?::[^\]]*)?\]/g, (m) => `<span class="missing">${m}</span>`)
    .replace(/\n/g, '<br>');
}

export const isMissing = (s) => !s || /^\s*\[חסר/.test(s);

// "2.39:1" | "16:9" → number for CSS aspect-ratio
export function ratio(aspect = '16:9') {
  const [w, h] = String(aspect).split(':').map(Number);
  return w && h ? +(w / h).toFixed(4) : 1.7778;
}

// Section label like "SC 03"
export const scLabel = (n) => `SC ${String(n).padStart(2, '0')}`;

export function slate(label, sc, modifier = '', ctx) {
  if (!label) return '';
  return `<p class="slate${modifier ? ` slate--${modifier}` : ''}"><span dir="ltr">${esc(sc)}</span> ${afText(ctx, 'slate', label, esc(label))}</p>`;
}

// Preview only: the attributes the afias studio editor reads to focus a field when it's clicked,
// and to edit plain text in place (not text with **bold**: editing it would drop the markers).
// ctx.annotate is set by /_afias/preview.html alone, so the public page renders without them.
export function af(ctx, path, value, { multiline = false } = {}) {
  if (!ctx?.annotate) return '';
  const editable = typeof value === 'string' && !value.includes('**');
  return ` data-afias-field="${esc(path)}"${editable ? ' data-afias-inline="text"' : ''}${editable && multiline ? ' data-afias-multiline="true"' : ''}`;
}

// Text that shares its element with other markup gets an element of its own, in the preview only.
// Not a span: rules like `.slate span` would style it.
export const afText = (ctx, path, value, html) => (ctx?.annotate ? `<af-text${af(ctx, path, value)}>${html}</af-text>` : html);

// A list item's segment in a field path: its studio _id, or its position.
export const key = (item, i) => item?._id ?? i;

// YouTube / Vimeo URL (or bare YouTube id) → { provider, id }
export function parseVideo(url = '') {
  const u = String(url).trim();
  if (!u) return null;
  let m = u.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  if (m) return { provider: 'youtube', id: m[1] };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) return { provider: 'vimeo', id: m[1] };
  if (/^[\w-]{11}$/.test(u)) return { provider: 'youtube', id: u };
  return null;
}
