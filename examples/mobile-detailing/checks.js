/**
 * The mobile-detailing example's own end-to-end checks, run by
 * tests/e2e/site-build.test.js after the checks every site passes. Setup
 * copies this file to tests/e2e/site.checks.js; change it as the site
 * changes, the way you would any test (AGENTS.md §7).
 *
 * @param {{ it: Function, assert: typeof import('node:assert/strict'), site: any }} context
 */
export default function checks({ it, assert, site }) {
    const packages = ['express-wash', 'full-detail', 'interior-deep-clean', 'paint-correction', 'ceramic-coating'];
    const zones = ['old-harbor', 'cinder-hill', 'brightwater', 'fenwick-park', 'northgate'];

    it('builds every page, and no draft', () => {
        const built = site.files().filter((file) => file.endsWith('.html'));
        const pages = [
            'index.html', 'packages/index.html', ...packages.map((slug) => `packages/${slug}/index.html`),
            'zones/index.html', ...zones.map((slug) => `zones/${slug}/index.html`),
            'fleet/index.html', 'how-it-works/index.html', 'gallery/index.html', 'faq/index.html', 'about/index.html',
            'contact/index.html', 'book/index.html', 'book/thanks/index.html', 'privacy/index.html', 'credits/index.html',
            'blog/index.html', 'blog/2/index.html', 'blog/two-bucket-wash-method/index.html', 'blog/tags/washing/index.html',
        ];

        for (const page of pages) {
            assert.ok(built.includes(page), `${page} was not built`);
        }

        assert.equal(site.exists('blog/3/index.html'), false);
        assert.equal(built.includes('blog/winter-car-care-checklist/index.html'), false, 'a draft reached production');
        assert.ok(site.exists('blog/winter-car-care-checklist/index.html', 'development'), 'a draft is missing from development');
        site.artifact.check('drafts in development only', true);
        site.artifact.fact('page count', built.length);
    });

    it('keeps the thank-you and credits pages out of search results and the sitemap', () => {
        const sitemap = site.text('sitemap-0.xml');

        for (const file of ['book/thanks/index.html', 'credits/index.html']) {
            assert.equal(site.html(file).querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
        }

        assert.equal(sitemap.includes('/book/thanks/') || sitemap.includes('/credits/') || sitemap.includes('winter-car-care'), false);
        assert.ok(sitemap.includes(`${site.url}/zones/brightwater/`));
        assert.ok(sitemap.includes(`${site.url}/packages/ceramic-coating/`));
    });

    it('reads the packages from the waffle app, and only that', () => {
        assert.deepEqual(site.requests(), ['GET /api/site/packages']);
    });

    it('shows every package with its price and time for every vehicle size, from the fixture', () => {
        const rows = site.html('packages/index.html').querySelectorAll('.price-table tbody tr').map((row) => [
            row.querySelector('th').text.trim(),
            ...row.querySelectorAll('td strong').map((cell) => cell.text.trim()),
        ]);

        assert.deepEqual(rows, [
            ['Express Wash', '$65', '$75', '$85'],
            ['Full Detail', '$245', '$295', '$345'],
            ['Interior Deep Clean', '$185', '$215', '$245'],
            ['Paint Correction', '$650', '$795', '$925'],
            ['Ceramic Coating', '$1,150', '$1,350', '$1,550'],
        ]);

        const head = site.html('packages/index.html').querySelectorAll('.price-table thead th').map((cell) => cell.text.trim());
        assert.deepEqual(head, ['Package', 'Coupe / sedan', 'SUV / crossover', 'Truck / van']);

        const cards = site.html('index.html').querySelectorAll('.pricing .card');
        assert.equal(cards.length, 5);
        assert.equal(cards[0].querySelectorAll('.price').length, 3);
        assert.equal(cards[0].querySelector('.price dd .spec').text.trim(), '45 min');
        site.artifact.fact('price table', rows);
    });

    it('gives each package its own page with what the app says is included', () => {
        const page = site.html('packages/paint-correction/index.html');
        const included = page.querySelectorAll('.checks li').map((item) => item.text.trim());

        assert.equal(page.querySelector('h1').text.trim(), 'Paint Correction');
        assert.equal(included.length, 8);
        assert.equal(included[0], 'Paint depth readings on every panel before we polish');
        assert.deepEqual(page.querySelectorAll('.sizes dd strong').map((price) => price.text.trim()), ['$650', '$795', '$925']);
        assert.deepEqual(page.querySelectorAll('.sizes dd .spec').map((time) => time.text.trim()), ['8 h', '9.5 h', '1.5 days']);
        assert.ok(page.querySelector('[data-compare] input[type="range"]'), 'the before and after control is missing');
        assert.ok(page.querySelector('a[href="/book/?package=paint-correction"]'));
    });

    it('describes the business, its services, FAQs and posts in structured data', () => {
        const business = site.graph('index.html')[0];

        assert.equal(business['@type'], 'AutoWash');
        assert.equal(business.telephone, '+15415550174');
        assert.equal(business.address.addressLocality, 'Port Alder');
        assert.deepEqual(business.areaServed.map((area) => area.name), ['Old Harbor', 'Cinder Hill', 'Brightwater', 'Fenwick Park', 'Northgate Business Park']);

        for (const slug of packages) {
            const types = site.graph(`packages/${slug}/index.html`).map((node) => node['@type']);
            assert.deepEqual(types, ['AutoWash', 'WebSite', 'WebPage', 'BreadcrumbList', 'Service', 'FAQPage'], slug);
        }

        const faq = site.graph('faq/index.html').find((node) => node['@type'] === 'FAQPage');
        assert.equal(faq.mainEntity.length, 11);
        assert.ok(site.graph('packages/index.html').some((node) => node['@type'] === 'FAQPage'));
        assert.deepEqual(site.graph('blog/two-bucket-wash-method/index.html').map((node) => node['@type']), ['AutoWash', 'WebSite', 'WebPage', 'BreadcrumbList', 'BlogPosting']);
        site.artifact.fact('business', { type: business['@type'], telephone: business.telephone, zones: business.areaServed.map((area) => area.name) });
    });

    it('gives every zone a page that says something particular, and draws the route map', () => {
        for (const slug of zones) {
            const page = site.html(`zones/${slug}/index.html`);
            assert.equal(page.querySelectorAll('.facts li').length, 3, slug);
            assert.ok(page.querySelector('.zone-map .area.current'), `${slug} is not lit on its map`);
        }

        const map = site.html('zones/index.html');
        assert.equal(map.querySelectorAll('.zone-map a.area').length, 5);
        assert.ok(map.querySelector('.zone-map path.route').getAttribute('d').startsWith('M372 246'));
    });

    it('serves every photo as a picture in AVIF and WebP, sized, only the first loaded eagerly', () => {
        const home = site.html('index.html');
        const pictures = home.querySelectorAll('picture');

        assert.ok(pictures.length >= 10, `only ${pictures.length} photos on the home page`);

        for (const picture of pictures) {
            const img = picture.querySelector('img');

            assert.deepEqual(picture.querySelectorAll('source').map((source) => source.getAttribute('type')), ['image/avif', 'image/webp']);
            assert.ok(img.getAttribute('width') && img.getAttribute('height'));
            assert.notEqual(img.getAttribute('alt'), undefined, img.getAttribute('src'));
        }

        assert.equal(home.querySelectorAll('img[loading="eager"]').length, 1);
        site.artifact.fact('home page photos', pictures.length);
    });

    it('credits every photographer and typeface', () => {
        const credits = site.html('credits/index.html');

        assert.equal(credits.querySelectorAll('a[href^="https://unsplash.com/photos/"]').length, 20);
        assert.ok(credits.text.includes('Archivo') && credits.text.includes('JetBrains Mono'));
    });

    it('makes the phone number tappable on every kind of page', () => {
        for (const file of ['index.html', 'packages/full-detail/index.html', 'zones/cinder-hill/index.html', 'blog/hard-water-spots/index.html', 'book/index.html']) {
            assert.ok(site.html(file).querySelector('a[href="tel:+15415550174"]'), file);
        }
    });

    it('lists every published post in the feed, newest first', () => {
        const titles = [...site.text('blog/rss.xml').matchAll(/<item><title>([^<]+)<\/title>/g)].map((match) => match[1]);

        assert.equal(titles.length, 10);
        assert.equal(titles[0], 'The two-bucket wash, and why it matters');
        site.artifact.fact('feed', titles);
    });

    it('paginates the journal with a distinct title on each page', () => {
        const title = (file) => site.html(file).querySelector('title').text;

        assert.equal(title('blog/index.html'), 'The Gloss Journal — Gloss Theory');
        assert.equal(title('blog/2/index.html'), 'The Gloss Journal, page 2 — Gloss Theory');
        assert.equal(site.html('blog/index.html').querySelectorAll('.posts > li').length, 6);
    });

    it('posts the booking form to the proxied waffle app, without script, with a honeypot', () => {
        const form = site.html('book/index.html').querySelector('form[data-site-form]');

        assert.equal(form.getAttribute('action'), '/api/site/forms/booking');
        assert.equal(form.getAttribute('method'), 'post');
        assert.equal(form.querySelector('input[name="redirect"]').getAttribute('value'), '/book/thanks/');
        assert.ok(form.querySelector('input[name="company_website"]'));

        for (const name of ['vehicle', 'address', 'name', 'phone', 'email', 'date_from']) {
            assert.ok(form.querySelector(`input[name="${name}"][required]`), `${name} is missing or optional`);
        }

        assert.deepEqual(form.querySelectorAll('input[name="size"]').map((input) => input.getAttribute('value')), ['coupe-sedan', 'suv', 'truck-van']);
        assert.deepEqual(form.querySelectorAll('select[name="package"] option').map((option) => option.getAttribute('value')), [...packages, 'not-sure']);
        assert.deepEqual(form.querySelectorAll('select[name="zone"] option').map((option) => option.getAttribute('value')), ['', ...zones, 'other']);
        assert.ok(form.querySelector('input[name="date_to"][type="date"]'));
        assert.equal(form.querySelectorAll('input[name="time_of_day"]').length, 3);
        site.artifact.fact('booking form', { action: form.getAttribute('action') });
    });
}
