import { esc } from '../core/format.js';

const LATIN = /^[\x00-\x7F]+$/;

export function render(d) {
  const items = (d.items || [])
    .map((t) => `<li${LATIN.test(t) ? ' dir="ltr"' : ''}>${esc(t)}</li>`)
    .join('');
  return `
<section class="band" aria-label="${esc(d.ariaLabel)}">
  <p class="band__label">${esc(d.label)}</p>
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
