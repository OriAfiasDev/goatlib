// Restrained by design: no amber anywhere in this section.
import { esc, inline, slate } from '../core/format.js';

export function render(d, { sc }) {
  const en = d.english;
  const credits = (d.items || [])
    .map(
      (f) => `
      <li class="credit">
        <p class="credit__year" dir="ltr">${esc(f.year)}</p>
        <h3 class="credit__title">${esc(f.title)}${f.titleEn ? ` <span lang="en" dir="ltr">${esc(f.titleEn)}</span>` : ''}</h3>
        <p class="credit__role">${inline(f.role)}</p>
        ${(f.meta || []).map((m) => `<p class="credit__meta">${inline(m)}</p>`).join('')}
      </li>`
    )
    .join('');

  return `
<section class="films" id="${esc(d.id || 'films')}" aria-labelledby="films-title">
  <div class="wrap films__grid">
    <header class="films__head">
      ${slate(d.slate, sc, 'quiet')}
      <h2 id="films-title" class="h-display">${esc(d.title)}</h2>
      <p>${inline(d.intro)}</p>
      ${en ? `<div class="films__en">
        <p lang="en" dir="ltr"><strong>${esc(en.lead)}</strong> ${esc(en.text)}</p>
        ${en.note ? `<p>${inline(en.note)}</p>` : ''}
      </div>` : ''}
    </header>
    <ol class="credits">${credits}</ol>
  </div>
</section>`;
}
