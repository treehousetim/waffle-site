/**
 * The electrician example's own end-to-end checks, run by
 * tests/e2e/site-build.test.js after the checks every site passes. Setup
 * copies this file to tests/e2e/site.checks.js; change it as the site
 * changes, the way you would any test (AGENTS.md §7).
 *
 * @param {{ it: Function, assert: typeof import('node:assert/strict'), site: any }} context
 */
export default function checks({ it, assert, site }) {
    it('builds every page, and no draft', () => {
        const built = site.files().filter((file) => file.endsWith('.html'));

        for (const page of ['services/index.html', 'services/panel-upgrades/index.html', 'services/ev-chargers/index.html',
            'areas/index.html', 'areas/riverside/index.html', 'prices/index.html', 'reviews/index.html', 'emergency/index.html',
            'faq/index.html', 'about/index.html', 'contact/index.html', 'contact/thanks/index.html', 'privacy/index.html',
            'credits/index.html', 'blog/index.html', 'blog/2/index.html', 'blog/3/index.html',
            'blog/signs-you-need-a-panel-upgrade/index.html', 'blog/tags/safety/index.html']) {
            assert.ok(built.includes(page), `${page} was not built`);
        }

        assert.equal(built.includes('blog/electrical-safety-checklist-winter/index.html'), false, 'a draft reached production');
        assert.ok(site.exists('blog/electrical-safety-checklist-winter/index.html', 'development'), 'a draft is missing from development');
        site.artifact.check('drafts in development only', true);
    });

    it('keeps the thank-you and credits pages out of search results and the sitemap', () => {
        const sitemap = site.text('sitemap-0.xml');

        for (const file of ['contact/thanks/index.html', 'credits/index.html']) {
            assert.equal(site.html(file).querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
        }

        assert.equal(sitemap.includes('/contact/thanks/') || sitemap.includes('/credits/') || sitemap.includes('winter'), false);
        assert.ok(sitemap.includes(`${site.url}/areas/lakewood/`));
    });

    it('shows the waffle app\'s price guide', () => {
        const rows = site.html('prices/index.html').querySelectorAll('.guide .item').map((item) => [
            item.querySelector('.name').text.trim(),
            item.querySelector('dd strong').text.trim(),
        ]);

        assert.equal(rows.length, 12);
        assert.deepEqual(rows[0], ['Written estimate', 'Free']);
        assert.ok(rows.some(([name, price]) => name === '200-amp panel upgrade' && price === '$2,400'));
        assert.deepEqual(site.requests(), ['GET /api/site/prices']);
        site.artifact.fact('price guide', rows);
    });

    it('shows each service only its own prices', () => {
        const names = site.html('services/panel-upgrades/index.html').querySelectorAll('.guide .item .name').map((name) => name.text.trim());

        assert.deepEqual(names, ['200-amp panel upgrade', 'Subpanel installation']);
    });

    it('describes the business, its services, FAQs and posts in structured data', () => {
        const business = site.graph('index.html')[0];

        assert.equal(business.telephone, '+12175550142');
        assert.equal(business.address.addressLocality, 'Springfield');
        assert.equal(business.areaServed.length, 6);
        assert.deepEqual(site.graph('services/ev-chargers/index.html').map((node) => node['@type']), ['Electrician', 'WebSite', 'WebPage', 'BreadcrumbList', 'Service', 'FAQPage']);
        assert.ok(site.graph('prices/index.html').some((node) => node['@type'] === 'FAQPage'));
        assert.deepEqual(site.graph('blog/signs-you-need-a-panel-upgrade/index.html').map((node) => node['@type']), ['Electrician', 'WebSite', 'WebPage', 'BreadcrumbList', 'BlogPosting']);
        site.artifact.fact('business', { telephone: business.telephone, towns: business.areaServed.map((town) => town.name) });
    });

    it('serves every photo as a picture in AVIF and WebP, sized, described, only the first loaded eagerly', () => {
        const pictures = site.html('index.html').querySelectorAll('picture');

        assert.ok(pictures.length >= 10, `only ${pictures.length} photos on the home page`);

        for (const picture of pictures) {
            const img = picture.querySelector('img');

            assert.deepEqual(picture.querySelectorAll('source').map((source) => source.getAttribute('type')), ['image/avif', 'image/webp']);
            assert.ok(img.getAttribute('width') && img.getAttribute('height'));
            // Described, or deliberately empty where the link beside it says it all.
            assert.notEqual(img.getAttribute('alt'), undefined, img.getAttribute('src'));
        }

        assert.equal(site.html('index.html').querySelectorAll('img[loading="eager"]').length, 1);
        assert.ok(site.html('index.html').querySelectorAll('img[alt]').filter((img) => img.getAttribute('alt').length > 10).length >= 4);
        site.artifact.fact('home page photos', pictures.length);
    });

    it('credits every photographer', () => {
        assert.ok(site.html('credits/index.html').querySelectorAll('a[href^="https://unsplash.com/photos/"]').length >= 20);
    });

    it('makes the phone number tappable on every kind of page', () => {
        for (const file of ['index.html', 'emergency/index.html', 'areas/oakdale/index.html', 'blog/afci-breakers/index.html']) {
            assert.ok(site.html(file).querySelector('a[href="tel:+12175550142"]'), file);
        }
    });

    it('lists every published post in the feed, newest first', () => {
        const titles = [...site.text('blog/rss.xml').matchAll(/<item><title>([^<]+)<\/title>/g)].map((match) => match[1]);

        assert.equal(titles.length, 24);
        assert.equal(titles[0], 'Why your breaker keeps tripping, and when to worry');
        site.artifact.fact('feed', titles);
    });

    it('paginates the blog with a distinct title on each page', () => {
        const title = (file) => site.html(file).querySelector('title').text;

        assert.equal(title('blog/index.html'), 'Electrical advice — Waffle Site');
        assert.equal(title('blog/2/index.html'), 'Electrical advice, page 2 — Waffle Site');
        assert.equal(site.exists('blog/4/index.html'), false);
    });

    it('posts the quote form to the proxied waffle app, without script, with a honeypot', () => {
        const form = site.html('contact/index.html').querySelector('form[data-site-form]');

        assert.equal(form.getAttribute('action'), '/api/site/forms/quote');
        assert.equal(form.getAttribute('method'), 'post');
        assert.equal(form.querySelector('input[name="redirect"]').getAttribute('value'), '/contact/thanks/');
        assert.ok(form.querySelector('input[name="company_website"]'));
        assert.equal(form.querySelectorAll('select[name="service"] option').length, 10);
        site.artifact.fact('quote form', { action: form.getAttribute('action') });
    });
}
