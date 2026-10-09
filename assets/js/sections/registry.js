// Section types the content can use. A section JSON's "type" picks one of these;
// site.json → "sections" decides which ones appear and in what order.
// Each module exports render(data, ctx) → HTML string, and optionally mount(el, data, ctx).
import * as hero from './hero.js';
import * as reel from './reel.js';
import * as doors from './doors.js';
import * as band from './band.js';
import * as clips from './clips.js';
import * as films from './films.js';
import * as ads from './ads.js';
import * as manifesto from './manifesto.js';
import * as process from './process.js';
import * as about from './about.js';
import * as faq from './faq.js';
import * as contact from './contact.js';

export const registry = { hero, reel, doors, band, clips, films, ads, manifesto, process, about, faq, contact };
