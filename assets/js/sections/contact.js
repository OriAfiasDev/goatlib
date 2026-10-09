// Brief form: steps and fields are defined in content/sections/contact.json.
// Field kinds: choice (radio chips), checks (checkbox group), check (single), select,
// text, textarea, url, tel, email. Consecutive `half` fields share a row.
import { esc, inline, slate } from '../core/format.js';
import { WA_ICON, waLink } from '../core/whatsapp.js';
import { track } from '../core/analytics.js';

const INPUT_DIR = { url: 'ltr', tel: 'ltr', email: 'ltr' };

function field(f) {
  const req = f.required ? ' required' : '';
  const ac = f.autocomplete ? ` autocomplete="${esc(f.autocomplete)}"` : '';
  const ph = f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : '';
  const lang = f.lang ? ` lang="${esc(f.lang)}" dir="ltr"` : '';
  switch (f.kind) {
    case 'choice':
      return `<div class="choices">${f.options
        .map((o, i) => `<label class="choice"><input type="radio" name="${esc(f.name)}" value="${esc(o)}"${i === 0 ? req : ''}><span>${esc(o)}</span></label>`)
        .join('')}</div>`;
    case 'checks':
      return `<div class="field"><span class="field__label">${esc(f.label)}</span><div class="checks">${f.options
        .map((o) => `<label class="check"><input type="checkbox" name="${esc(f.name)}" value="${esc(o)}"><span>${esc(o)}</span></label>`)
        .join('')}</div></div>`;
    case 'check':
      return `<label class="check"><input type="checkbox" name="${esc(f.name)}" value="${esc(f.value || 'כן')}"${f.checked ? ' checked' : ''}><span${lang}>${esc(f.label)}</span></label>`;
    case 'select':
      return `<label class="field"><span class="field__label">${esc(f.label)}</span><select name="${esc(f.name)}"${req}>${f.options
        .map((o) => `<option>${esc(o)}</option>`)
        .join('')}</select></label>`;
    case 'textarea':
      return `<label class="field"><span class="field__label">${esc(f.label)}</span><textarea name="${esc(f.name)}" rows="4"${req}${ph}></textarea></label>`;
    default: {
      const type = ['url', 'tel', 'email'].includes(f.kind) ? f.kind : 'text';
      const dir = INPUT_DIR[type] ? ` dir="${INPUT_DIR[type]}" inputmode="${type}"` : '';
      return `<label class="field"><span class="field__label">${esc(f.label)}</span><input type="${type}" name="${esc(f.name)}"${req}${ac}${ph}${dir}></label>`;
    }
  }
}

function fields(list = []) {
  let html = '';
  for (let i = 0; i < list.length; i++) {
    const f = list[i];
    if (f.half && list[i + 1]?.half) {
      html += `<div class="field-row">${field(f)}${field(list[i + 1])}</div>`;
      i++;
    } else if (f.kind === 'check') {
      // group consecutive single checkboxes
      let group = field(f);
      while (list[i + 1]?.kind === 'check') group += field(list[++i]);
      html += `<div class="checks">${group}</div>`;
    } else {
      html += field(f);
    }
  }
  return html;
}

export function render(d, { site, sc }) {
  const form = d.form || {};
  const steps = form.steps || [];
  const face = d.face || {};
  const total = steps.length;
  const stepLabel = (n) => (form.stepLabel || '{n}/{total}').replace('{n}', n).replace('{total}', total);

  return `
<section class="contact" id="${esc(d.id || 'contact')}" aria-labelledby="contact-title">
  <div class="wrap contact__grid">
    <header class="contact__head">
      ${slate(d.slate, sc, 'ink')}
      <h2 id="contact-title" class="contact__title">${inline(d.title)}</h2>
      <p>${inline(d.text)}</p>
      <div class="contact__direct">
        <a class="btn btn--ink" href="#contact" data-whatsapp>${WA_ICON} ${esc(site.contact?.whatsappLabel)}</a>
        ${d.direct ? `<p class="contact__mail">${inline(d.direct)}</p>` : ''}
      </div>
      <figure class="contact__face">
        <div class="frame frame--ink" style="--ar: 1">
          ${face.src ? `<img class="frame__media" src="${esc(face.src)}" alt="${esc(face.alt)}" loading="lazy">` : `<div class="frame__missing">${inline(face.missing)}</div>`}
        </div>
      </figure>
    </header>

    <form class="brief" data-brief novalidate>
      <div class="scrubber" aria-hidden="true">
        <div class="scrubber__ridges"></div>
        <div class="scrubber__head" data-scrubber></div>
      </div>
      <p class="brief__count" aria-live="polite" data-step-label>${esc(stepLabel(1))}</p>
      ${steps
        .map((s, i) => `
      <fieldset class="brief__step" data-step="${i + 1}"${i ? ' hidden' : ''}>
        <legend>${esc(s.legend)}</legend>
        ${s.note ? `<p class="brief__note">${inline(s.note)}</p>` : ''}
        ${fields(s.fields)}
        <p class="brief__error" data-error hidden>${esc(s.error)}</p>
      </fieldset>`)
        .join('')}
      <div class="brief__nav">
        <button class="btn btn--ghost-ink" type="button" data-prev hidden>${esc(form.prev)}</button>
        <button class="btn btn--ink" type="button" data-next>${esc(form.next)}</button>
        <button class="btn btn--ink" type="submit" data-submit hidden>${esc(form.submit)}</button>
      </div>
      <div class="brief__done" data-done hidden tabindex="-1">
        <p class="brief__done-title">${esc(form.done?.title)}</p>
        <p>${inline(form.done?.text)}</p>
      </div>
    </form>
  </div>
</section>`;
}

export function mount(el, d, { site }) {
  const form = el.querySelector('[data-brief]');
  const conf = d.form || {};
  const steps = [...form.querySelectorAll('[data-step]')];
  const btnPrev = form.querySelector('[data-prev]');
  const btnNext = form.querySelector('[data-next]');
  const btnSubmit = form.querySelector('[data-submit]');
  const label = form.querySelector('[data-step-label]');
  const head = form.querySelector('[data-scrubber]');
  const done = form.querySelector('[data-done]');
  const total = steps.length;
  let current = 0;

  const show = (i, user = true) => {
    current = i;
    steps.forEach((s, n) => (s.hidden = n !== i));
    btnPrev.hidden = i === 0;
    btnNext.hidden = i === total - 1;
    btnSubmit.hidden = i !== total - 1;
    label.textContent = (conf.stepLabel || '{n}/{total}').replace('{n}', i + 1).replace('{total}', total);
    head.style.insetInlineStart = `calc(${(i / Math.max(1, total - 1)) * 100}% - ${i === total - 1 ? 4 : 0}px)`;
    if (user) {
      steps[i].querySelector('input, textarea, select')?.focus({ preventScroll: true });
      track('brief_step', { step: i + 1 });
    }
  };

  const valid = (i) => {
    const step = steps[i];
    let ok = true;
    step.querySelectorAll('[required]').forEach((f) => {
      if (f.type === 'radio') {
        if (!step.querySelector(`input[name="${CSS.escape(f.name)}"]:checked`)) ok = false;
      } else if (!f.value.trim()) ok = false;
    });
    const error = step.querySelector('[data-error]');
    if (error) error.hidden = ok;
    return ok;
  };

  btnNext.addEventListener('click', () => valid(current) && show(current + 1));
  btnPrev.addEventListener('click', () => show(current - 1));

  // clear the error while typing/choosing, not on blur: a blur-time layout shift
  // would move the submit button out from under the pointer mid-click
  form.addEventListener('input', () => {
    const error = steps[current].querySelector('[data-error]');
    if (error && !error.hidden) valid(current);
  });

  // links elsewhere can preselect answers, e.g. data-prefill='{"type":"קליפ"}'
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-prefill]');
    if (!a) return;
    try {
      Object.entries(JSON.parse(a.dataset.prefill)).forEach(([name, value]) => {
        const input = form.querySelector(`input[name="${CSS.escape(name)}"][value="${CSS.escape(value)}"]`);
        if (input) input.checked = true;
      });
    } catch (_) { /* malformed prefill: ignore */ }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!valid(current)) return;
    const data = new FormData(form);
    const lines = [site.contact?.whatsappGreeting || ''];
    (conf.steps || []).flatMap((s) => s.fields || []).forEach((f) => {
      const v = data.getAll(f.name).filter(Boolean).join(', ');
      if (v) lines.push(`${f.summary || f.label || f.name}: ${v}`);
    });
    track('brief_submit', { type: data.get('type'), budget: data.get('budget') });

    // [חסר: לאן נשלחים לידים: מייל / CRM / וואטסאפ]. בינתיים: וואטסאפ עם הבריף מוכן
    const href = waLink(site, lines.join('\n'));
    if (href) window.open(href, '_blank', 'noopener');
    else console.info('[GOATLIB] contact.whatsappNumber חסר ב-site.json. הבריף:\n' + lines.join('\n'));

    steps.forEach((s) => (s.hidden = true));
    form.querySelector('.brief__nav').hidden = true;
    form.classList.add('is-done');
    done.hidden = false;
    done.focus();
  });

  show(0, false);
}
