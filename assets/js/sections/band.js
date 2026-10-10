import { af, esc } from '../core/format.js';

const LATIN = /^[\x00-\x7F]+$/;

export function render(d, ctx) {
  const items = (d.items || [])
    .map((t, i) => `<li${LATIN.test(t) ? ' dir="ltr"' : ''}${af(ctx, `items.${i}`, t)}>${esc(t)}</li>`)
    .join('');
  return `
<section class="band" aria-label="${esc(d.ariaLabel)}">
  <p class="band__label"${af(ctx, 'label', d.label)}>${esc(d.label)}</p>
  <div class="band__viewport">
    <ul class="band__track" data-marquee>${items}</ul>
  </div>
</section>`;
}

// duplicate the list once so the loop is seamless
export function mount(el) {
  const list = el.querySelector('[data-marquee]');
  [...list.children].forEach((li) => {
    const clone = li.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    list.appendChild(clone);
  });
}
