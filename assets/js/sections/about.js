import { esc, inline, ratio, slate } from '../core/format.js';

export function render(d, { sc }) {
  const ph = d.photo || {};
  const photo = ph.src
    ? `<img class="frame__media" src="${esc(ph.src)}" alt="${esc(ph.alt)}" loading="lazy">`
    : `<div class="frame__missing">${inline(ph.missing)}</div>`;
  const links = (d.links || [])
    .map((l) => `<a href="${esc(l.href)}" rel="noopener" target="_blank" dir="ltr">${esc(l.label)}</a>`)
    .join(' · ');

  return `
<section class="about" id="${esc(d.id || 'about')}" aria-labelledby="about-title">
  <div class="wrap about__grid">
    <figure class="about__photo">
      <div class="frame" style="--ar: ${ratio(ph.aspect || '4:5')}">
        ${photo}
        <span class="frame__ar" dir="ltr">${esc(ph.aspect || '4:5')}</span>
      </div>
    </figure>
    <div class="about__text">
      ${slate(d.slate, sc)}
      <h2 id="about-title" class="h-display">${esc(d.title)}</h2>
      ${d.lede ? `<p class="about__lede">${inline(d.lede)}</p>` : ''}
      ${(d.paragraphs || []).map((t) => `<p class="about__p">${inline(t)}</p>`).join('')}
      ${d.note ? `<p class="about__name">${inline(d.note)}</p>` : ''}
      <ul class="about__facts">
        ${(d.facts || []).map((t) => `<li>${inline(t)}</li>`).join('')}
        ${links ? `<li>${links}</li>` : ''}
      </ul>
    </div>
  </div>
</section>`;
}
