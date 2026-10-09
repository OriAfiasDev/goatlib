// One sentence, revealed word by word (CSS scroll-driven, IntersectionObserver fallback).
import { esc } from '../core/format.js';

export function render(d) {
  const words = String(d.text || '').trim().split(/\s+/);
  const from = d.accentFrom ? words.indexOf(d.accentFrom) : -1;
  const html = words
    .map((w, i) => `<span class="w${from > -1 && i >= from ? ' is-accent' : ''}" style="--i:${i}">${esc(w)}</span>`)
    .join(' ');
  return `
<section class="manifesto" aria-label="${esc(d.ariaLabel)}">
  <blockquote class="manifesto__quote">
    <p>${html}</p>
    ${d.by ? `<footer>${esc(d.by)}</footer>` : ''}
  </blockquote>
</section>`;
}

export function mount(el) {
  if (CSS.supports('animation-timeline: view()')) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const quote = el.querySelector('.manifesto__quote');
  quote.classList.add('no-sdt');
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    quote.classList.add('is-in');
    io.disconnect();
  }, { threshold: 0.6 });
  io.observe(quote);
}
