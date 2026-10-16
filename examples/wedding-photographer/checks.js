/**
 * The wedding-photographer example's own end-to-end checks, run by
 * tests/e2e/site-build.test.js after the checks every site passes. Setup
 * copies this file to tests/e2e/site.checks.js; change it as the site
 * changes, the way you would any test (AGENTS.md §7).
 *
 * @param {{ it: Function, assert: typeof import('node:assert/strict'), site: any }} context
 */
import { readFileSync } from 'node:fs';
import { parsePackages } from './src/lib/packages.ts';
import { parseAvailability } from './src/lib/availability.ts';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./api-fixtures/api/site/${name}.json`, import.meta.url), 'utf8')).data;

export default function checks({ it, assert, site }) {
    const stories = ['ines-and-callum', 'margot-and-dev', 'saoirse-and-jun', 'autumn-sittings'];

    it('builds every page, and no draft', () => {
        const built = site.files().filter((file) => file.endsWith('.html'));

        for (const page of ['index.html', 'stories/index.html', ...stories.map((slug) => `stories/${slug}/index.html`),
            'portfolio/index.html', 'portfolio/weddings/index.html', 'portfolio/elopements/index.html', 'portfolio/portraits/index.html',
            'packages/index.html', 'experience/index.html', 'about/index.html', 'faq/index.html', 'enquire/index.html',
            'enquire/thanks/index.html', 'privacy/index.html', 'credits/index.html', '404.html', 'journal/index.html', 'journal/2/index.html',
            'journal/golden-hour-explained/index.html', 'journal/tags/planning/index.html']) {
            assert.ok(built.includes(page), `${page} was not built`);
        }

        assert.equal(built.includes('journal/winter-weddings-on-the-coast/index.html'), false, 'a draft reached production');
        assert.ok(site.exists('journal/winter-weddings-on-the-coast/index.html', 'development'), 'a draft is missing from development');
        assert.equal(site.exists('journal/3/index.html'), false);
        site.artifact.fact('pages built', built.length);
    });

    it('keeps the thank-you and credits pages out of search results and the sitemap', () => {
        const sitemap = site.text('sitemap-0.xml');

        for (const file of ['enquire/thanks/index.html', 'credits/index.html']) {
            assert.equal(site.html(file).querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
        }

        assert.equal(sitemap.includes('/enquire/thanks/') || sitemap.includes('/credits/') || sitemap.includes('winter-weddings'), false);
        assert.ok(sitemap.includes(`${site.url}/stories/saoirse-and-jun/`));
        assert.ok(sitemap.includes(`${site.url}/portfolio/elopements/`));
    });

    it('reads the packages and the calendar from the waffle app, once each', () => {
        assert.deepEqual([...site.requests()].sort(), ['GET /api/site/availability', 'GET /api/site/packages']);
    });

    it('shows the waffle app\'s packages, with the featured one marked, and the add-ons', () => {
        const page = site.html('packages/index.html');
        const rows = page.querySelectorAll('.rates .rate').map((row) => [row.querySelector('.name').text.trim(), row.querySelector('.price strong').text.trim()]);

        assert.deepEqual(rows, [['The Sitting', '$650'], ['The Elopement', '$3,800'], ['The Gathering', '$5,200'], ['The Full Day', '$7,400'], ['The Elopement Weekend', '$9,600']]);
        assert.equal(page.querySelector('.rate.featured .name').text.trim(), 'The Full Day');
        assert.ok(page.querySelector('#package-sitting .hours').text.includes('1½ hours'));
        assert.equal(page.querySelectorAll('.addons tbody tr').length, 5);
        site.artifact.fact('packages', rows);
    });

    it('shows each portfolio room only its own packages', () => {
        const names = (file) => site.html(file).querySelectorAll('.rate .name').map((name) => name.text.trim());

        assert.deepEqual(names('portfolio/portraits/index.html'), ['The Sitting']);
        assert.deepEqual(names('portfolio/elopements/index.html'), ['The Elopement', 'The Elopement Weekend']);
        assert.deepEqual(names('portfolio/weddings/index.html'), ['The Gathering', 'The Full Day']);
    });

    it('draws the calendar strip from the waffle app\'s availability, in words as well as pattern', () => {
        const months = site.html('enquire/index.html').querySelectorAll('.calendar .month').map((month) => [
            month.getAttribute('data-month'),
            month.getAttribute('class').split(/\s+/).find((name) => ['booked', 'limited', 'open'].includes(name)),
            month.querySelector('.state').text.trim(),
        ]);

        assert.equal(months.length, 12);
        assert.deepEqual(months[0], ['2026-11', 'limited', '2 dates left']);
        assert.deepEqual(months[6], ['2027-05', 'booked', 'Booked']);
        assert.deepEqual(months[8], ['2027-07', 'limited', '1 date left']);
        assert.deepEqual(months[11], ['2027-10', 'open', 'Open, 5 dates']);
        site.artifact.fact('calendar', months);
    });

    it('posts the enquiry to the proxied waffle app, without script, with a honeypot and the packages to choose from', () => {
        const form = site.html('enquire/index.html').querySelector('form[data-site-form]');

        assert.equal(form.getAttribute('action'), '/api/site/forms/enquiry');
        assert.equal(form.getAttribute('method'), 'post');
        assert.equal(form.querySelector('input[name="redirect"]').getAttribute('value'), '/enquire/thanks/');
        assert.ok(form.querySelector('input[name="company_website"]'));

        for (const name of ['names', 'email', 'phone', 'date', 'venue', 'guests', 'message']) {
            assert.ok(form.querySelector(`[name="${name}"]`), `no ${name} field`);
        }

        for (const name of ['names', 'email', 'venue', 'guests', 'package', 'message']) {
            assert.ok(form.querySelector(`[name="${name}"]`).hasAttribute('required'), `${name} is not required`);
        }

        assert.deepEqual(form.querySelectorAll('select[name="package"] option').map((option) => option.getAttribute('value')),
            ['', 'sitting', 'elopement', 'gathering', 'full-day', 'weekend', 'not-sure']);
        assert.ok(form.querySelector('[data-error-for="message"]') && form.querySelector('[data-status]'));
        site.artifact.fact('enquiry form', { action: form.getAttribute('action') });
    });

    it('describes the studio, its galleries, offers, FAQs and posts in structured data', () => {
        const business = site.graph('index.html')[0];

        assert.equal(business['@type'], 'ProfessionalService');
        assert.equal(business.telephone, '+15415550163');
        assert.equal(business.address.addressLocality, 'Port Alder');
        assert.equal(business.areaServed.length, 6);

        for (const slug of stories) {
            const gallery = site.graph(`stories/${slug}/index.html`).find((node) => node['@type'] === 'ImageGallery');
            const frames = site.html(`stories/${slug}/index.html`).querySelectorAll('[data-slide]').length;

            assert.ok(gallery, `${slug} has no ImageGallery`);
            assert.equal(gallery.image.length, frames, `${slug}: every photograph is in the gallery's structured data`);
            assert.ok(gallery.image.every((image) => image.contentUrl.startsWith(`${site.url}/`) && image.creditText && image.caption));
        }

        assert.deepEqual(site.graph('stories/ines-and-callum/index.html').map((node) => node['@type']), ['ProfessionalService', 'WebSite', 'WebPage', 'BreadcrumbList', 'ImageGallery']);
        assert.ok(site.graph('packages/index.html').some((node) => node['@type'] === 'OfferCatalog' && node.itemListElement.length === 5));
        assert.ok(site.graph('faq/index.html').some((node) => node['@type'] === 'FAQPage' && node.mainEntity.length === 12));
        assert.ok(site.graph('journal/golden-hour-explained/index.html').some((node) => node['@type'] === 'BlogPosting'));
        site.artifact.fact('business', { type: business['@type'], telephone: business.telephone, towns: business.areaServed.map((town) => town.name) });
    });

    it('serves every photo as a picture in AVIF and WebP, sized, and only the first on a page loaded eagerly', () => {
        for (const [file, least] of [['index.html', 10], ['stories/margot-and-dev/index.html', 8], ['portfolio/index.html', 20], ['journal/index.html', 1]]) {
            const page = site.html(file);
            const pictures = page.querySelectorAll('picture');

            assert.ok(pictures.length >= least, `${file}: only ${pictures.length} photos`);

            for (const picture of pictures) {
                const img = picture.querySelector('img');

                assert.deepEqual(picture.querySelectorAll('source').map((source) => source.getAttribute('type')), ['image/avif', 'image/webp']);
                assert.ok(img.getAttribute('width') && img.getAttribute('height'), `${file}: ${img.getAttribute('src')} has no size`);
                assert.notEqual(img.getAttribute('alt'), undefined);
            }

            assert.equal(page.querySelectorAll('img[loading="eager"]').length, 1, `${file}: one eager photo`);
        }

        site.artifact.fact('home page photos', site.html('index.html').querySelectorAll('picture').length);
    });

    it('opens every photograph in the viewer with plain links, no script needed', () => {
        for (const slug of stories) {
            const page = site.html(`stories/${slug}/index.html`);
            const slides = page.querySelectorAll('[data-slide]').map((slide) => slide.getAttribute('id'));
            const ids = new Set(page.querySelectorAll('[id]').map((element) => element.getAttribute('id')));

            assert.ok(slides.length >= 4, `${slug} has ${slides.length} photographs`);

            for (const link of page.querySelectorAll('a[href^="#"]')) {
                assert.ok(ids.has(link.getAttribute('href').slice(1)), `${slug}: ${link.getAttribute('href')} goes nowhere`);
            }

            // The hero opens the first slide; every slide but the last links on.
            assert.ok(page.querySelector(`a[href="#${slides[0]}"]`));
            assert.equal(page.querySelectorAll('[data-viewer-next]').length, slides.length - 1);
            assert.equal(page.querySelectorAll('[data-viewer-close]').length, slides.length);
        }
    });

    it('credits every photographer', () => {
        assert.ok(site.html('credits/index.html').querySelectorAll('a[href^="https://unsplash.com/photos/"]').length >= 20);
    });

    it('makes the phone number tappable on every kind of page', () => {
        for (const file of ['index.html', 'enquire/index.html', 'stories/autumn-sittings/index.html', 'journal/golden-hour-explained/index.html']) {
            assert.ok(site.html(file).querySelector('a[href="tel:+15415550163"]'), file);
        }
    });

    it('lists every published journal entry in the feed, newest first', () => {
        const titles = [...site.text('journal/rss.xml').matchAll(/<item><title>([^<]+)<\/title>/g)].map((match) => match[1]);

        assert.equal(titles.length, 9);
        assert.equal(titles[0], 'Building a wedding timeline around the light');
        site.artifact.fact('feed', titles);
    });

    it('paginates the journal with a distinct title on each page', () => {
        const title = (file) => site.html(file).querySelector('title').text.replace('&amp;', '&');

        assert.equal(title('journal/index.html'), 'The Journal — Juniper & Vale');
        assert.equal(title('journal/2/index.html'), 'The Journal, page 2 — Juniper & Vale');
    });

    it('refuses packages the site does not understand, naming the endpoint and the field', () => {
        const good = fixture('packages');
        const broken = (change) => {
            const copy = structuredClone(good);
            change(copy);

            return () => parsePackages(copy);
        };

        assert.equal(parsePackages(good).collections.length, 5);
        assert.throws(broken((data) => { data.collections[0].price_cents = '650'; }), /\/api\/site\/packages collections\[0\]\.price_cents/);
        assert.throws(broken((data) => { data.collections[1].kind = 'party'; }), /collections\[1\]\.kind/);
        assert.throws(broken((data) => { data.collections[2].inclusions = []; }), /collections\[2\]\.inclusions/);
        assert.throws(broken((data) => { data.collections[0].featured = true; }), /at most one featured/);
        assert.throws(broken((data) => { data.collections[4].id = data.collections[3].id; }), /'full-day' appears twice/);
        assert.throws(broken((data) => { data.add_ons[0].per = 'week'; }), /add_ons\[0\]\.per/);
        assert.throws(broken((data) => { data.collections[0].url = 'javascript:alert(1)'; }), /collections\[0\]\.url: expected no such field/);
        assert.throws(broken((data) => { data.currency = 'dollars'; }), /currency/);
        assert.throws(() => parsePackages(null), /\/api\/site\/packages data: expected an object/);
    });

    it('refuses a calendar the site does not understand, naming the endpoint and the field', () => {
        const good = fixture('availability');
        const broken = (change) => {
            const copy = structuredClone(good);
            change(copy);

            return () => parseAvailability(copy);
        };

        assert.equal(parseAvailability(good).months.length, 12);
        assert.throws(broken((data) => { data.months[0].month = '2026-13'; }), /\/api\/site\/availability months\[0\]\.month/);
        assert.throws(broken((data) => { data.months[1].month = data.months[0].month; }), /months\[1\]\.month: expected a month after 2026-11/);
        assert.throws(broken((data) => { data.months[2].status = 'maybe'; }), /months\[2\]\.status/);
        assert.throws(broken((data) => { data.months[6].open_dates = 3; }), /months\[6\]\.open_dates: expected 0 for a booked month/);
        assert.throws(broken((data) => { data.months[1].open_dates = 0; }), /months\[1\]\.open_dates: expected at least 1/);
        assert.throws(broken((data) => { data.months = []; }), /months: expected a list of 1-24 months/);
        assert.throws(broken((data) => { data.updated = 'yesterday'; }), /updated: expected a date/);
    });
}
