import { af, esc, inline, key, ratio, slate } from '../core/format.js';

export function render(d, ctx) {
  const { sc } = ctx;
  const ph = d.photo || {};
  const photo = ph.src
    ? `<img class="frame__media" src="${esc(ph.src)}" alt="${esc(ph.alt)}" loading="lazy">`
    : `<div class="frame__missing">${inline(ph.missing)}</div>`;
  const links = (d.links || [])
    .map((l, i) => `<a href="${esc(l.href)}" rel="noopener" target="_blank" dir="ltr"${af(ctx, `links.${key(l, i)}.label`, l.label)}>${esc(l.label)}</a>`)
    .join(' · ');

  return `
<section class="about" id="${esc(d.id || 'about')}" aria-labelledby="about-title">
  <div class="wrap about__grid">
    <figure class="about__photo">
      <div class="frame" style="--ar: ${ratio(ph.aspect || '4:5')}"${af(ctx, 'photo', null)}>
        ${photo}
        <span class="frame__ar" dir="ltr"${af(ctx, 'photoAspect', null)}>${esc(ph.aspect || '4:5')}</span>
      </div>
    </figure>
    <div class="about__text">
      ${slate(d.slate, sc, '', ctx)}
      <h2 id="about-title" class="h-display"${af(ctx, 'title', d.title)}>${esc(d.title)}</h2>
      ${d.lede ? `<p class="about__lede"${af(ctx, 'lede', d.lede)}>${inline(d.lede)}</p>` : ''}
      ${(d.paragraphs || []).map((t, i) => `<p class="about__p"${af(ctx, `paragraphs.${i}`, t)}>${inline(t)}</p>`).join('')}
      ${d.note ? `<p class="about__name">${inline(d.note)}</p>` : ''}
      <ul class="about__facts">
        ${(d.facts || []).map((t, i) => `<li${af(ctx, `facts.${i}`, t)}>${inline(t)}</li>`).join('')}
        ${links ? `<li>${links}</li>` : ''}
      </ul>
    </div>
  </div>
</section>`;
}
