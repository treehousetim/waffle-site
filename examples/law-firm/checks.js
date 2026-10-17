/**
 * The law-firm example's own end-to-end checks, run by
 * tests/e2e/site-build.test.js after the checks every site passes. Setup
 * copies this file to tests/e2e/site.checks.js; change it as the site
 * changes, the way you would any test (AGENTS.md §7).
 *
 * @param {{ it: Function, assert: typeof import('node:assert/strict'), site: any }} context
 */
export default function checks({ it, assert, site }) {
    const practices = ['business-formation-contracts', 'estate-planning-probate', 'employment-law', 'commercial-real-estate'];
    const attorneys = ['eleanor-hale', 'daniel-morrow', 'margaret-okafor', 'samuel-whitcomb'];

    it('builds every page: four practices, four attorneys, fees, Insights, questions, consultation and the notices', () => {
        const built = site.files().filter((file) => file.endsWith('.html'));

        for (const page of [
            'practice/index.html', ...practices.map((slug) => `practice/${slug}/index.html`),
            'attorneys/index.html', ...attorneys.map((slug) => `attorneys/${slug}/index.html`),
            'how-we-work/index.html', 'faq/index.html', 'about/index.html', 'consultation/index.html', 'consultation/thanks/index.html',
            'privacy/index.html', 'disclaimer/index.html', 'credits/index.html', '404.html',
            'insights/index.html', 'insights/2/index.html', 'insights/probate-step-by-step/index.html', 'insights/tags/estate-planning/index.html',
        ]) {
            assert.ok(built.includes(page), `${page} was not built`);
        }

        assert.equal(site.exists('insights/3/index.html'), false);
        site.artifact.fact('pages', built.length);
    });

    it('keeps the thank-you and credits pages out of search results and the sitemap', () => {
        const sitemap = site.text('sitemap-0.xml');

        for (const file of ['consultation/thanks/index.html', 'credits/index.html']) {
            assert.equal(site.html(file).querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
        }

        assert.equal(sitemap.includes('/consultation/thanks/') || sitemap.includes('/credits/'), false);
        assert.ok(sitemap.includes(`${site.url}/practice/employment-law/`));
        assert.ok(sitemap.includes(`${site.url}/disclaimer/`));
    });

    it('reads nothing from the waffle app at build time: its one endpoint is the consultation form', () => {
        assert.deepEqual(site.requests(), []);
    });

    it('describes the firm, its practices, attorneys, questions and Insights in structured data', () => {
        const business = site.graph('index.html')[0];

        assert.equal(business['@type'], 'LegalService');
        assert.equal(business.telephone, '+15405550137');
        assert.equal(business.address.addressLocality, 'Harrowmere');
        assert.equal(business.areaServed.length, 5);
        assert.equal('aggregateRating' in business, false);

        for (const slug of practices) {
            assert.deepEqual(site.graph(`practice/${slug}/index.html`).map((node) => node['@type']), ['LegalService', 'WebSite', 'WebPage', 'BreadcrumbList', 'Service', 'FAQPage'], slug);
        }

        const person = site.graph('attorneys/daniel-morrow/index.html').find((node) => node['@type'] === 'Person');
        assert.equal(person.name, 'Daniel Morrow');
        assert.deepEqual(person.worksFor, { '@id': `${site.url}/#organization` });
        assert.ok(site.graph('faq/index.html').some((node) => node['@type'] === 'FAQPage'));
        assert.ok(site.graph('how-we-work/index.html').some((node) => node['@type'] === 'FAQPage'));
        assert.deepEqual(site.graph('insights/probate-step-by-step/index.html').map((node) => node['@type']), ['LegalService', 'WebSite', 'WebPage', 'BreadcrumbList', 'BlogPosting']);
        site.artifact.fact('business', { type: business['@type'], telephone: business.telephone, towns: business.areaServed.map((town) => town.name) });
    });

    it('labels every attorney\'s bar admissions as fictional', () => {
        for (const slug of attorneys) {
            const page = site.html(`attorneys/${slug}/index.html`);
            const record = page.querySelector('.record');

            assert.ok(record, slug);
            assert.ok(record.querySelectorAll('.fiction').length >= 2, `${slug}: admissions and education are not marked fictional`);
            assert.ok(record.text.includes('(fictional admission)'), slug);
        }
    });

    it('carries the attorney-advertising and no-relationship notices on every page', () => {
        for (const file of ['index.html', 'practice/estate-planning-probate/index.html', 'insights/probate-step-by-step/index.html', '404.html']) {
            const footer = site.html(file).querySelector('.site-footer').text;

            assert.ok(footer.includes('Attorney advertising.'), file);
            assert.ok(footer.includes('does not create an attorney-client relationship'), file);
            assert.ok(site.html(file).querySelector('a[href="/disclaimer/"]'), file);
        }
    });

    it('marks every Insight as general information, not legal advice', () => {
        for (const file of site.files().filter((path) => /^insights\/[a-z0-9-]+\/index\.html$/.test(path) && !/^insights\/\d+\//.test(path))) {
            assert.ok(site.html(file).querySelector('aside.notice')?.text.includes('not legal advice'), file);
        }
    });

    it('posts the consultation request to the proxied waffle app, without script, with a conflict check and the notice', () => {
        const form = site.html('consultation/index.html').querySelector('form[data-site-form]');
        const names = [...new Set(form.querySelectorAll('[name]').map((field) => field.getAttribute('name')))];

        assert.equal(form.getAttribute('action'), '/api/site/forms/consultation');
        assert.equal(form.getAttribute('method'), 'post');
        assert.equal(form.querySelector('input[name="redirect"]').getAttribute('value'), '/consultation/thanks/');
        assert.ok(form.querySelector('input[name="company_website"]'));
        assert.deepEqual(names, ['redirect', 'practice_area', 'matter_summary', 'conflict_names', 'heard_about', 'name', 'organization', 'email', 'phone', 'contact_method', 'company_website', 'acknowledge_no_relationship']);
        assert.deepEqual(form.querySelectorAll('select[name="practice_area"] option').map((option) => option.getAttribute('value')), ['', ...practices, 'not-sure']);
        assert.equal(form.querySelectorAll('input[name="contact_method"]').length, 3);
        assert.ok(form.querySelector('textarea[name="conflict_names"]').hasAttribute('required'));
        assert.ok(form.querySelector('input[name="acknowledge_no_relationship"]').hasAttribute('required'));
        assert.ok(form.text.includes('Submitting this form does not create an attorney-client relationship.'));
        site.artifact.fact('consultation form', { action: form.getAttribute('action'), fields: names });
    });

    it('serves every photo as a picture in AVIF and WebP, sized and described, only the hero loaded eagerly', () => {
        const home = site.html('index.html');
        const pictures = home.querySelectorAll('picture');

        assert.ok(pictures.length >= 2);

        for (const picture of pictures) {
            const img = picture.querySelector('img');

            assert.deepEqual(picture.querySelectorAll('source').map((source) => source.getAttribute('type')), ['image/avif', 'image/webp']);
            assert.ok(img.getAttribute('width') && img.getAttribute('height'));
            assert.ok(img.getAttribute('alt').length > 10);
        }

        assert.equal(home.querySelectorAll('img[loading="eager"]').length, 1);
    });

    it('gives the home page figures their counting targets, and the numbers themselves', () => {
        const counts = site.html('index.html').querySelectorAll('.count');

        assert.equal(counts.length, 4);
        for (const count of counts) {
            assert.equal(count.getAttribute('data-to'), count.querySelector('.digits').text.trim());
        }
    });

    it('credits every photographer', () => {
        assert.equal(site.html('credits/index.html').querySelectorAll('a[href^="https://unsplash.com/photos/"]').length, 18);
    });

    it('makes the telephone number tappable on every kind of page', () => {
        for (const file of ['index.html', 'practice/employment-law/index.html', 'attorneys/eleanor-hale/index.html', 'insights/handbooks-that-help/index.html', 'consultation/index.html']) {
            assert.ok(site.html(file).querySelector('a[href="tel:+15405550137"]'), file);
        }
    });

    it('lists every Insight in the feed, newest first', () => {
        const titles = [...site.text('insights/rss.xml').matchAll(/<item><title>([^<]+)<\/title>/g)].map((match) => match[1]);

        assert.equal(titles.length, 10);
        assert.equal(titles[0], 'Due diligence before you buy commercial property');
        site.artifact.fact('feed', titles);
    });

    it('paginates the Insights with a distinct title on each page', () => {
        const title = (file) => site.html(file).querySelector('title').text;

        assert.match(title('insights/index.html'), /^Insights — Hale (&amp;|&) Morrow$/);
        assert.match(title('insights/2/index.html'), /^Insights, page 2 — Hale (&amp;|&) Morrow$/);
    });
}
