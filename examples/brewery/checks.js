/**
 * The brewery example's own end-to-end checks, run by
 * tests/e2e/site-build.test.js after the checks every site passes. Setup
 * copies this file to tests/e2e/site.checks.js; change it as the site
 * changes, the way you would any test (AGENTS.md §7).
 *
 * @param {{ it: Function, assert: typeof import('node:assert/strict'), site: any }} context
 */
export default function checks({ it, assert, site }) {
    const beers = ['pour-line-pilsner', 'cupola-ipa', 'tamsen-haze', 'cast-iron-stout', 'ferrymans-rye', 'bellows-saison'];

    it('builds every page: the beers, the taproom, events, hire, tours and the blog', () => {
        const built = site.files().filter((file) => file.endsWith('.html'));

        for (const page of ['on-tap/index.html', 'beers/index.html', ...beers.map((slug) => `beers/${slug}/index.html`),
            'taproom/index.html', 'events/index.html', 'private-hire/index.html', 'tours/index.html', 'about/index.html',
            'faq/index.html', 'contact/index.html', 'contact/thanks/index.html', 'privacy/index.html', 'credits/index.html',
            'blog/index.html', 'blog/2/index.html', 'blog/why-our-pilsner-takes-six-weeks/index.html', 'blog/tags/hops/index.html']) {
            assert.ok(built.includes(page), `${page} was not built`);
        }

        assert.equal(site.exists('blog/3/index.html'), false);
        site.artifact.fact('pages', built.length);
    });

    it('reads the tap list and the events from the waffle app, and nothing else', () => {
        assert.deepEqual([...site.requests()].sort(), ['GET /api/site/events', 'GET /api/site/taplist']);
    });

    it('shows the whole tap list from the waffle app, with flags, pours and prices', () => {
        const page = site.html('on-tap/index.html');
        const rows = page.querySelectorAll('.board .tap').map((tap) => ({
            tap: tap.querySelector('.no').text.replace(/\D/g, ''),
            name: tap.querySelector('.name').text.trim(),
            abv: tap.querySelectorAll('.stats dd')[0].text.trim(),
            prices: tap.querySelectorAll('.pours .price').map((price) => price.text.trim()),
        }));

        assert.equal(rows.length, 12);
        assert.deepEqual(rows[0], { tap: '01', name: 'Pour Line Pilsner', abv: '4.9%', prices: ['$3', '$5', '$7'] });
        assert.deepEqual(rows[10], { tap: '11', name: 'Banked Fire Imperial Stout', abv: '11.2%', prices: ['$9'] });
        assert.equal(page.querySelectorAll('.board .flag-new').length, 3);
        assert.equal(page.querySelectorAll('.board .flag-limited').length, 5);
        assert.ok(page.querySelector('.board time[datetime="2026-10-15T20:42:00.000Z"]'), 'the board says when it was updated');
        // A tap pouring a core beer links to its page, by the slug the parser checked.
        assert.equal(page.querySelector('.board .tap .name a')?.getAttribute('href'), '/beers/pour-line-pilsner/');
        site.artifact.fact('tap list', rows);
    });

    it('runs the tap list through the header ticker on every page, and says the age policy plainly', () => {
        for (const file of ['index.html', 'beers/cupola-ipa/index.html', 'blog/wet-hop-season/index.html']) {
            const page = site.html(file);
            const ticker = page.querySelector('a.ticker');

            assert.equal(ticker?.getAttribute('href'), '/on-tap/', file);
            assert.ok(ticker.querySelector('.visually-hidden').text.includes('12 beers pouring'), file);
            assert.ok(page.querySelector('footer.site-footer').text.includes('21 and over to drink.'), file);
        }

        for (const file of ['on-tap/index.html', 'taproom/index.html', 'faq/index.html', 'private-hire/index.html']) {
            assert.ok(site.html(file).querySelector('main').text.includes('21'), `${file} does not mention the age policy`);
        }
    });

    it('gives each core beer its page, and says on it whether it is pouring', () => {
        const stout = site.html('beers/cast-iron-stout/index.html');

        assert.equal(stout.querySelector('h1').text.trim(), 'Cast Iron Stout');
        assert.ok(stout.querySelector('.status.live').text.includes('tap 6'));
        assert.deepEqual(stout.querySelectorAll('.numbers dd').map((dd) => dd.text.trim()), ['6.2%', '38', '50°F']);
        assert.equal(site.html('beers/index.html').querySelectorAll('.can-card').length, 6);
        assert.deepEqual(
            site.graph('beers/cast-iron-stout/index.html').find((node) => node['@type'] === 'BreadcrumbList').itemListElement.map((item) => item.name),
            ['Home', 'Our beers', 'Cast Iron Stout'],
        );
    });

    it('lists the waffle app\'s events, and describes each as a schema.org Event', () => {
        const page = site.html('events/index.html');
        const titles = page.querySelectorAll('.events .title').map((title) => title.text.trim());
        const events = site.graph('events/index.html').filter((node) => node['@type'] === 'Event');

        assert.equal(titles.length, 8);
        assert.equal(titles[0], 'Wednesday Quiz in the Pattern Shop');
        assert.equal(events.length, 8);
        assert.equal(events[0].startDate, '2026-10-21T19:00');
        assert.equal(events[0].location.address.addressLocality, 'Wrenford');
        assert.equal(events.find((event) => event.name.startsWith('Stout Day')).startDate, '2026-11-07');
        assert.equal(site.html('index.html').querySelectorAll('.events .stub').length, 3);
        site.artifact.fact('events', titles);
    });

    it('describes the brewery, its FAQs and its posts in structured data', () => {
        const business = site.graph('index.html')[0];

        assert.equal(business['@type'], 'Brewery');
        assert.equal(business.telephone, '+17405550137');
        assert.equal(business.address.addressLocality, 'Wrenford');
        assert.equal(business.openingHoursSpecification.length, 4);
        assert.ok(site.graph('faq/index.html').some((node) => node['@type'] === 'FAQPage'));
        assert.ok(site.graph('private-hire/index.html').some((node) => node['@type'] === 'FAQPage'));
        assert.deepEqual(site.graph('blog/saison-yeast/index.html').map((node) => node['@type']), ['Brewery', 'WebSite', 'WebPage', 'BreadcrumbList', 'BlogPosting']);
        site.artifact.fact('business', { type: business['@type'], telephone: business.telephone });
    });

    it('posts the private event form to the proxied waffle app, without script, with a honeypot', () => {
        for (const file of ['private-hire/index.html', 'contact/index.html']) {
            const form = site.html(file).querySelector('form[data-site-form]');

            assert.equal(form.getAttribute('action'), '/api/site/forms/private-event', file);
            assert.equal(form.getAttribute('method'), 'post');
            assert.equal(form.querySelector('input[name="redirect"]').getAttribute('value'), '/contact/thanks/');
            assert.ok(form.querySelector('input[name="company_website"]'));
            assert.equal(form.querySelectorAll('select[name="event_type"] option').length, 8);
            assert.ok(form.querySelector('input[name="date"][type="date"][required]'));
            assert.ok(form.querySelector('input[name="guests"][type="number"][required]'));
            assert.deepEqual(form.querySelectorAll('input[name="space"]').map((input) => input.getAttribute('value')), ['pattern-shop', 'loading-dock', 'foundry-floor', 'not-sure']);
            assert.ok(form.querySelector('input[name="email"][type="email"][required]'));
            assert.ok(form.querySelector('input[name="age_ok"][type="checkbox"][required]'));
        }

        site.artifact.fact('private event form', { action: '/api/site/forms/private-event' });
    });

    it('keeps the thank-you and credits pages out of search results and the sitemap', () => {
        const sitemap = site.text('sitemap-0.xml');

        for (const file of ['contact/thanks/index.html', 'credits/index.html']) {
            assert.equal(site.html(file).querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
        }

        assert.equal(sitemap.includes('/contact/thanks/') || sitemap.includes('/credits/'), false);
        assert.ok(sitemap.includes(`${site.url}/beers/ferrymans-rye/`));
    });

    it('serves every photo as a picture in AVIF and WebP, sized, only the first loaded eagerly', () => {
        const pictures = site.html('index.html').querySelectorAll('picture');

        assert.ok(pictures.length >= 8, `only ${pictures.length} photos on the home page`);

        for (const picture of pictures) {
            const img = picture.querySelector('img');

            assert.deepEqual(picture.querySelectorAll('source').map((source) => source.getAttribute('type')), ['image/avif', 'image/webp']);
            assert.ok(img.getAttribute('width') && img.getAttribute('height'));
            assert.notEqual(img.getAttribute('alt'), undefined);
        }

        assert.equal(site.html('index.html').querySelectorAll('img[loading="eager"]').length, 1);
    });

    it('credits every photographer and every typeface', () => {
        const credits = site.html('credits/index.html');

        assert.equal(credits.querySelectorAll('a[href^="https://unsplash.com/photos/"]').length, 20);
        assert.ok(credits.text.includes('Big Shoulders') && credits.text.includes('Bitter'));
    });

    it('lists every published post in the feed, newest first', () => {
        const titles = [...site.text('blog/rss.xml').matchAll(/<item><title>([^<]+)<\/title>/g)].map((match) => match[1]);

        assert.equal(titles.length, 11);
        assert.equal(titles[0], 'Why our pilsner takes six weeks to make');
        site.artifact.fact('feed', titles);
    });

    it('paginates the blog with a distinct title on each page', () => {
        const title = (file) => site.html(file).querySelector('title').text;

        assert.equal(title('blog/index.html'), 'Brewing notes — Ironwood Brewing Co.');
        assert.equal(title('blog/2/index.html'), 'Brewing notes, page 2 — Ironwood Brewing Co.');
    });
}
