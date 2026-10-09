// Header, footer and the floating WhatsApp button: everything outside <main>.
import { esc, inline } from '../core/format.js';
import { WA_ICON, waLink } from '../core/whatsapp.js';
import { track } from '../core/analytics.js';

export function renderHeader(site) {
  const h = site.header || {};
  const b = site.brand || {};
  return `
<div class="site-header__inner">
  <a class="brand" href="#top" aria-label="${esc(b.homeLabel)}">
    <img class="brand__mark" src="${esc(b.mark)}" alt="" width="33" height="40">
    <span class="brand__word" dir="ltr">${esc(b.name)}<small>${esc(b.suffix)}</small></span>
  </a>
  <nav class="nav" aria-label="${esc(h.navLabel)}">
    <ul>${(h.nav || []).map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('')}</ul>
  </nav>
  ${h.cta ? `<a class="btn btn--small" href="${esc(h.cta.href)}">${esc(h.cta.label)}</a>` : ''}
</div>`;
}

export function renderFooter(site) {
  const f = site.footer || {};
  const link = (l) => {
    if (l.whatsapp) return `<li><a href="#contact" data-whatsapp>${esc(l.label)}</a></li>`;
    if (!l.href) return `<li>${inline(l.label)}</li>`;
    return `<li><a href="${esc(l.href)}" rel="noopener" target="_blank">${esc(l.label)}</a></li>`;
  };
  return `
<div class="wrap site-footer__grid">
  <div>
    <p class="site-footer__line">${esc(f.line)}</p>
    <p class="site-footer__small">${inline(f.small)}</p>
  </div>
  <ul class="site-footer__links">${(f.links || []).map(link).join('')}</ul>
</div>
<div class="site-footer__stage" aria-hidden="true">
  <img class="site-footer__goat" src="${esc(site.brand?.mark)}" alt="" width="253" height="306" loading="lazy">
  <p class="site-footer__word" dir="ltr">${esc(f.wordmark)}</p>
</div>
<p class="site-footer__legal wrap"><span dir="ltr">${esc(f.legal)}</span></p>`;
}

export function renderFloat(site) {
  return `<a class="wa-float is-hidden" href="#contact" data-whatsapp aria-label="${esc(site.contact?.whatsappLabel)}">${WA_ICON}</a>`;
}

export function mountChrome(site) {
  // every [data-whatsapp] opens a chat with the greeting, or falls back to the brief form
  document.querySelectorAll('[data-whatsapp]').forEach((a) => {
    const href = waLink(site, site.contact?.whatsappGreeting || '');
    if (!href) return;
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.addEventListener('click', () => track('whatsapp_click'));
  });

  // header turns solid once the hero is behind us
  const header = document.querySelector('[data-header]');
  const hero = document.querySelector('[data-hero]');
  if (header) {
    if (hero) {
      new IntersectionObserver(([e]) => header.classList.toggle('is-scrolled', !e.isIntersecting), {
        rootMargin: '-64px 0px 0px 0px',
      }).observe(hero);
    } else {
      const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 40);
      addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  // floating button stays out of the hero and out of the brief form
  const float = document.querySelector('.wa-float');
  const hidden = new Set();
  const watch = [hero, document.getElementById('contact')].filter(Boolean);
  if (float && watch.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? hidden.add(e.target) : hidden.delete(e.target)));
      float.classList.toggle('is-hidden', hidden.size > 0);
    }, { threshold: 0.05 });
    watch.forEach((el) => io.observe(el));
  } else if (float) {
    float.classList.remove('is-hidden');
  }
}
