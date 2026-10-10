/*
 * Where the build gets the site's content: site.json plus the visible sections, in order.
 *
 *   CONTENT_SOURCE=file (default)  this repo's content/ folder: local work, offline builds.
 *   CONTENT_SOURCE=http            the afias studio's published document at CONTENT_URL
 *                                  (CI sets both, see .github/workflows/deploy.yml).
 *
 * A studio request that fails on the network or with a 5xx/408/429 is retried 3 times (1s, 2s, 4s).
 * After that the build fails: a failed build keeps the previous deployment live, so a studio
 * outage never ships an empty or partial page. Every section is also rendered once with the
 * site's own templates, so content that would break the page fails the build instead.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fromStudio } from '../../_afias/content.js';
import { registry } from '../../assets/js/sections/registry.js';
import { renderHeader, renderFooter } from '../../assets/js/sections/chrome.js';

const RETRY_DELAYS = [1000, 2000, 4000];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fromFiles(root) {
  const read = async (file) => JSON.parse(await readFile(path.join(root, 'content', file), 'utf8'));
  const site = await read('site.json');
  const sections = await Promise.all((site.sections || []).map(async (id) => ({ id, data: await read(`sections/${id}.json`) })));
  return { label: 'content/ (local files)', site, sections };
}

async function request(url) {
  let res;
  try {
    res = await fetch(url, { headers: { accept: 'application/json' } });
  } catch (err) {
    return { retry: true, error: `studio unreachable (${err.cause?.message ?? err.message})` };
  }
  if (res.ok) return { doc: await res.json(), revision: res.headers.get('x-afias-revision') };
  const retry = res.status >= 500 || res.status === 408 || res.status === 429;
  return { retry, error: `studio returned ${res.status}: ${(await res.text()).slice(0, 200)}` };
}

async function fromStudioApi(url) {
  for (let i = 0; ; i++) {
    const { doc, revision, error, retry } = await request(url);
    if (doc) return { label: `afias studio, revision ${revision ?? '?'} (${url})`, ...fromStudio(doc) };
    if (!retry || i === RETRY_DELAYS.length) throw new Error(`${error} (${url})`);
    console.log(`  ${error}; retrying in ${RETRY_DELAYS[i] / 1000}s`);
    await sleep(RETRY_DELAYS[i]);
  }
}

export async function loadContent(root) {
  const source = process.env.CONTENT_SOURCE || 'file';
  let content;
  if (source === 'file') content = await fromFiles(root);
  else if (source === 'http') {
    if (!process.env.CONTENT_URL) throw new Error('CONTENT_SOURCE=http needs CONTENT_URL ({studio}/api/v1/sites/{slug})');
    content = await fromStudioApi(process.env.CONTENT_URL);
  } else throw new Error(`Unknown CONTENT_SOURCE "${source}": use file or http`);

  if (!content.sections.length) throw new Error(`No visible sections in ${content.label}; not deploying an empty page`);
  for (const { id, data } of content.sections) {
    if (!/^[\w-]+$/.test(id)) throw new Error(`Section id "${id}" can't be a file name`);
    if (!registry[data.type]) throw new Error(`Section ${id}: no template for type "${data.type}"`);
    try {
      registry[data.type].render(data, { site: content.site, sc: '' });
    } catch (err) {
      throw new Error(`Section ${id} (${data.type}) doesn't render: ${err.message}`);
    }
  }
  renderHeader(content.site);
  renderFooter(content.site);
  return content;
}
