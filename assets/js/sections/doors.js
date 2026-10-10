import { af, esc, inline, key, slate } from '../core/format.js';

export function render(d, ctx) {
  const { sc } = ctx;
  const items = (d.items || [])
    .map((it, i) => {
      const p = `items.${key(it, i)}`;
      return `
    <li class="door">
      <a class="door__link" href="${esc(it.href)}"${af(ctx, `${p}.href`, null)}>
        <span class="door__num" dir="ltr">${String(i + 1).padStart(2, '0')}</span>
        <span class="door__title"${af(ctx, `${p}.title`, it.title)}>${esc(it.title)}</span>
        <span class="door__text"${af(ctx, `${p}.text`, it.text)}>${inline(it.text)}</span>
        <span class="door__formats" dir="ltr"${af(ctx, `${p}.formats`, it.formats)}>${esc(it.formats)}</span>
      </a>
    </li>`;
    })
    .join('');

  return `
<section class="doors" id="${esc(d.id || 'services')}" aria-labelledby="doors-title">
  <div class="wrap">
    <header class="section-head">
      ${slate(d.slate, sc, '', ctx)}
      <h2 id="doors-title" class="visually-hidden"${af(ctx, 'title', d.title)}>${esc(d.title)}</h2>
    </header>
    <ol class="doors__list">${items}</ol>
  </div>
</section>`;
}
