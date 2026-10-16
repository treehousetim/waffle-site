/**
 * The bakery example's own end-to-end checks, run by
 * tests/e2e/site-build.test.js after the checks every site passes. Setup
 * copies this file to tests/e2e/site.checks.js; change it as the site
 * changes, the way you would any test (AGENTS.md §7).
 *
 * @param {{ it: Function, assert: typeof import('node:assert/strict'), site: any }} context
 */
export default function checks({ it, assert, site }) {
    const sections = ['breads', 'pastries', 'cakes', 'coffee'];

    it('builds every page, and no draft', () => {
        const built = site.files().filter((file) => file.endsWith('.html'));

        for (const page of ['menu/index.html', ...sections.map((slug) => `menu/${slug}/index.html`), 'cakes/index.html',
            'cakes/order/index.html', 'cakes/order/thanks/index.html', 'wholesale/index.html', 'visit/index.html', 'about/index.html',
            'bakers/index.html', 'faq/index.html', 'contact/index.html', 'privacy/index.html', 'credits/index.html', 'journal/index.html',
            'journal/2/index.html', 'journal/feeding-a-sourdough-starter/index.html', 'journal/tags/sourdough/index.html', 'journal/tags/recipes/index.html']) {
            assert.ok(built.includes(page), `${page} was not built`);
        }

        assert.equal(built.includes('journal/holiday-orders/index.html'), false, 'a draft reached production');
        assert.ok(site.exists('journal/holiday-orders/index.html', 'development'), 'a draft is missing from development');
        site.artifact.check('drafts in development only', true);
        site.artifact.fact('page count', built.length);
    });

    it('keeps the thank-you and credits pages out of search results and the sitemap', () => {
        const sitemap = site.text('sitemap-0.xml');

        for (const file of ['cakes/order/thanks/index.html', 'credits/index.html']) {
            assert.equal(site.html(file).querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
        }

        assert.equal(sitemap.includes('/thanks/') || sitemap.includes('/credits/') || sitemap.includes('holiday-orders'), false);
        assert.ok(sitemap.includes(`${site.url}/menu/pastries/`));
        assert.ok(sitemap.includes(`${site.url}/journal/kettle-chai-recipe/`));
    });

    it('shows the waffle app\'s menu for the day, priced, with what has sold out', () => {
        const page = site.html('menu/index.html');
        const items = page.querySelectorAll('.board .item').map((item) => ({
            id: item.getAttribute('data-id'),
            name: item.querySelector('.name').text.trim(),
            price: item.querySelector('.price').text.replace('Price:', '').trim(),
            soldOut: item.getAttribute('data-sold-out') === 'true',
        }));

        assert.deepEqual(site.requests(), ['GET /api/site/menu']);
        assert.equal(items.length, 21);
        assert.deepEqual(items[0], { id: 'country-sourdough', name: 'Country sourdough', price: '$9', soldOut: false });
        assert.deepEqual(items.find((item) => item.id === 'croissant'), { id: 'croissant', name: 'Butter croissant', price: '$4.25', soldOut: false });
        assert.deepEqual(items.filter((item) => item.soldOut).map((item) => item.id), ['walnut-levain', 'cardamom-knot']);
        assert.ok(page.querySelector('h1').text.includes('Today’s bakes'));
        assert.ok(page.querySelector('.page-hero .eyebrow').text.includes('Friday, October 16'), 'the board is dated');
        // Dietary marks are spelled out for screen readers, not only stamped.
        assert.ok(page.querySelector('[data-id="almond-croissant"]').text.includes('Contains nuts'));
        site.artifact.fact('menu', items);
    });

    it('shows each section of the counter only its own bakes', () => {
        const ids = (file) => site.html(file).querySelectorAll('.board .item').map((item) => item.getAttribute('data-id'));

        assert.deepEqual(ids('menu/breads/index.html'), ['country-sourdough', 'seeded-rye', 'fougasse', 'spelt-honey', 'baguette', 'walnut-levain']);
        assert.deepEqual(ids('menu/coffee/index.html'), ['flat-white', 'filter', 'cardamom-latte', 'chai', 'hot-chocolate']);
        assert.equal(ids('menu/pastries/index.html').length, 6);
        assert.equal(ids('menu/cakes/index.html').length, 4);
    });

    it('runs today\'s bakes across the home page ticker, once for readers', () => {
        const runs = site.html('index.html').querySelectorAll('.ticker .run');

        assert.equal(runs.length, 2);
        assert.equal(runs[0].getAttribute('aria-hidden'), undefined);
        assert.equal(runs[1].getAttribute('aria-hidden'), 'true');
        assert.equal(runs[0].querySelectorAll('li').length, 22, 'the day, then all 21 bakes');
    });

    it('describes the bakery, its menu, questions and posts in structured data', () => {
        const business = site.graph('index.html')[0];
        const menu = site.graph('menu/index.html').find((node) => node['@type'] === 'Menu');
        const items = menu.hasMenuSection.flatMap((section) => section.hasMenuItem);
        const walnut = items.find((item) => item.name === 'Walnut & raisin levain');

        assert.equal(business['@type'], 'Bakery');
        assert.equal(business.telephone, '+18025550137');
        assert.equal(business.address.addressLocality, 'Larkhaven');
        assert.equal(business.openingHoursSpecification.length, 3);
        assert.deepEqual(menu.hasMenuSection.map((section) => section.name), ['Bread', 'Pastries', 'Cakes by the slice', 'Coffee & the kettle']);
        assert.equal(items.length, 21);
        assert.equal(walnut.offers.availability, 'https://schema.org/SoldOut');
        assert.equal(walnut.offers.price, '11.00');
        assert.deepEqual(walnut.suitableForDiet, ['https://schema.org/VeganDiet']);
        assert.deepEqual(site.graph('menu/breads/index.html').map((node) => node['@type']), ['Bakery', 'WebSite', 'WebPage', 'BreadcrumbList', 'Menu', 'FAQPage']);
        assert.ok(site.graph('faq/index.html').some((node) => node['@type'] === 'FAQPage' && node.mainEntity.length === 13));
        assert.ok(site.graph('cakes/index.html').some((node) => node['@type'] === 'FAQPage'));
        assert.deepEqual(site.graph('journal/kettle-chai-recipe/index.html').map((node) => node['@type']), ['Bakery', 'WebSite', 'WebPage', 'BreadcrumbList', 'BlogPosting']);
        site.artifact.fact('business', { type: business['@type'], telephone: business.telephone, towns: business.areaServed.map((town) => town.name) });
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

    it('credits every photographer and the typefaces', () => {
        const credits = site.html('credits/index.html');

        assert.equal(credits.querySelectorAll('a[href^="https://unsplash.com/photos/"]').length, 18);
        assert.ok(credits.text.includes('Bagel Fat One') && credits.text.includes('Alegreya') && credits.text.includes('Caveat'));
    });

    it('puts the phone number and the hours on every kind of page', () => {
        for (const file of ['index.html', 'menu/breads/index.html', 'cakes/order/index.html', 'journal/lemon-drizzle-recipe/index.html']) {
            const page = site.html(file);

            assert.ok(page.querySelector('a[href="tel:+18025550137"]'), file);
            assert.ok(page.querySelector('.site-footer dl').text.includes('Tue–Fri'), file);
        }
    });

    it('lists every published post in the feed, newest first', () => {
        const titles = [...site.text('journal/rss.xml').matchAll(/<item><title>([^<]+)<\/title>/g)].map((match) => match[1]);

        assert.equal(titles.length, 9);
        assert.equal(titles[0], 'How we feed our sourdough starter');
        assert.ok(site.html('index.html').querySelector('link[rel="alternate"][type="application/rss+xml"]').getAttribute('href') === '/journal/rss.xml');
        site.artifact.fact('feed', titles);
    });

    it('paginates the journal with a distinct title on each page', () => {
        const title = (file) => site.html(file).querySelector('title').text;

        assert.equal(title('journal/index.html'), 'The journal: recipes and baking notes — Crumb & Kettle');
        assert.equal(title('journal/2/index.html'), 'The journal, page 2 — Crumb & Kettle');
        assert.equal(site.exists('journal/3/index.html'), false);
        assert.equal(site.html('journal/index.html').querySelectorAll('.posts > li').length, 6);
    });

    it('posts the cake order to the proxied waffle app, without script, with a honeypot', () => {
        const form = site.html('cakes/order/index.html').querySelector('form[data-site-form]');
        const radios = (name) => form.querySelectorAll(`input[type="radio"][name="${name}"]`).map((input) => input.getAttribute('value'));

        assert.equal(form.getAttribute('action'), '/api/site/forms/cake-order');
        assert.equal(form.getAttribute('method'), 'post');
        assert.equal(form.querySelector('input[name="redirect"]').getAttribute('value'), '/cakes/order/thanks/');
        assert.ok(form.querySelector('input[name="company_website"]'));
        assert.equal(form.querySelectorAll('select[name="occasion"] option').length, 7);
        assert.equal(form.querySelectorAll('select[name="servings"] option').length, 6);
        assert.equal(radios('flavour').length, 7);
        assert.deepEqual(radios('pickup'), ['morning', 'afternoon', 'delivery']);
        assert.equal(form.querySelector('input[name="date_needed"]').getAttribute('type'), 'date');
        assert.equal(form.querySelector('input[name="message"]').getAttribute('maxlength'), '40');

        for (const name of ['occasion', 'servings', 'date_needed', 'name', 'email', 'phone']) {
            assert.ok(form.querySelector(`[name="${name}"]`).hasAttribute('required'), `${name} is required`);
            assert.ok(form.querySelector(`[data-error-for="${name}"]`), `${name} has an error slot`);
        }

        site.artifact.fact('cake order form', { action: form.getAttribute('action'), flavours: radios('flavour') });
    });
}
