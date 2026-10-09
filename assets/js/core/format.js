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

export function slate(label, sc, modifier = '') {
  if (!label) return '';
  return `<p class="slate${modifier ? ` slate--${modifier}` : ''}"><span dir="ltr">${esc(sc)}</span> ${esc(label)}</p>`;
}

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
