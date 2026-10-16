/**
 * The veterinary example's own end-to-end checks, run by
 * tests/e2e/site-build.test.js after the checks every site passes. Setup
 * copies this file to tests/e2e/site.checks.js; change it as the site
 * changes, the way you would any test (AGENTS.md §7).
 *
 * @param {{ it: Function, assert: typeof import('node:assert/strict'), site: any }} context
 */
export default function checks({ it, assert, site }) {
    const services = ['wellness-exams-vaccines', 'dental-care', 'surgery', 'urgent-care', 'puppy-kitten-care', 'senior-pets', 'exotic-pets'];

    it('builds every page, and no draft', () => {
        const built = site.files().filter((file) => file.endsWith('.html'));

        for (const page of ['index.html', 'services/index.html', ...services.map((slug) => `services/${slug}/index.html`),
            'wellness-plans/index.html', 'team/index.html', 'new-clients/index.html', 'resources/index.html', 'emergency/index.html',
            'faq/index.html', 'book/index.html', 'book/thanks/index.html', 'about/index.html', 'contact/index.html',
            'privacy/index.html', 'credits/index.html', '404.html', 'blog/index.html', 'blog/2/index.html',
            'blog/puppy-vaccination-schedule/index.html', 'blog/tags/exotics/index.html']) {
            assert.ok(built.includes(page), `${page} was not built`);
        }

        assert.equal(built.includes('blog/tortoise-hibernation-checks/index.html'), false, 'a draft reached production');
        assert.ok(site.exists('blog/tortoise-hibernation-checks/index.html', 'development'), 'a draft is missing from development');
        site.artifact.check('drafts in development only', true);
        site.artifact.fact('page count', built.length);
    });

    it('keeps the thank-you and credits pages out of search results and the sitemap', () => {
        const sitemap = site.text('sitemap-0.xml');

        for (const file of ['book/thanks/index.html', 'credits/index.html']) {
            assert.equal(site.html(file).querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
        }

        assert.equal(sitemap.includes('/book/thanks/') || sitemap.includes('/credits/') || sitemap.includes('tortoise'), false);
        assert.ok(sitemap.includes(`${site.url}/services/exotic-pets/`));
        assert.ok(sitemap.includes(`${site.url}/wellness-plans/`));
    });

    it('shows every wellness plan from the waffle app, with its price and inclusions', () => {
        const page = site.html('wellness-plans/index.html');
        const plans = page.querySelectorAll('.plan').map((plan) => [
            plan.getAttribute('data-plan'),
            plan.querySelector('.name').text.trim(),
            plan.querySelector('.amount').text.trim(),
            plan.querySelectorAll('.inclusions li').length,
        ]);

        assert.equal(plans.length, 8);
        assert.deepEqual(plans[0], ['dog-puppy', 'Puppy Pack', '$39', 6]);
        assert.ok(plans.some(([id, name, price]) => id === 'cat-adult' && name === 'Adult Cat' && price === '$27'));
        assert.ok(plans.some(([id, , price, count]) => id === 'rabbit-senior' && price === '$29' && count === 5));
        assert.equal(page.querySelectorAll('.plan.popular').length, 2);
        assert.deepEqual(page.querySelectorAll('.species-band').map((band) => band.getAttribute('id')), ['dog', 'cat', 'rabbit']);
        assert.deepEqual(site.requests(), ['GET /api/site/wellness-plans']);
        site.artifact.fact('wellness plans', plans);
    });

    it('shows each service only the plans that cover it', () => {
        const ids = (file) => site.html(file).querySelectorAll('.plan').map((plan) => plan.getAttribute('data-plan'));

        assert.deepEqual(ids('services/senior-pets/index.html'), ['dog-senior', 'cat-senior', 'rabbit-senior']);
        assert.deepEqual(ids('services/puppy-kitten-care/index.html'), ['dog-puppy', 'cat-kitten']);
        assert.deepEqual(ids('services/exotic-pets/index.html'), ['rabbit-adult', 'rabbit-senior']);
        assert.deepEqual(ids('services/dental-care/index.html'), []);
        assert.ok(site.html('index.html').text.includes('Plans from $22 a month'), 'the home page names the cheapest plan');
    });

    it('describes the hospital, its services, FAQs and posts in structured data', () => {
        const business = site.graph('index.html')[0];

        assert.equal(business['@type'], 'VeterinaryCare');
        assert.equal(business.telephone, '+15035550147');
        assert.equal(business.address.addressLocality, 'Bramblewick');
        assert.equal(business.areaServed.length, 5);

        for (const slug of services) {
            assert.deepEqual(site.graph(`services/${slug}/index.html`).map((node) => node['@type']), ['VeterinaryCare', 'WebSite', 'WebPage', 'BreadcrumbList', 'Service', 'FAQPage'], slug);
        }

        for (const file of ['faq/index.html', 'wellness-plans/index.html', 'new-clients/index.html', 'emergency/index.html']) {
            assert.ok(site.graph(file).some((node) => node['@type'] === 'FAQPage'), file);
        }

        assert.deepEqual(site.graph('blog/rabbit-gut-stasis/index.html').map((node) => node['@type']), ['VeterinaryCare', 'WebSite', 'WebPage', 'BreadcrumbList', 'BlogPosting']);
        site.artifact.fact('business', { type: business['@type'], telephone: business.telephone, towns: business.areaServed.map((town) => town.name) });
    });

    it('serves every photo as a picture in AVIF and WebP, sized, described, only the first loaded eagerly', () => {
        const pictures = site.html('index.html').querySelectorAll('picture');

        assert.ok(pictures.length >= 15, `only ${pictures.length} photos on the home page`);

        for (const picture of pictures) {
            const img = picture.querySelector('img');

            assert.deepEqual(picture.querySelectorAll('source').map((source) => source.getAttribute('type')), ['image/avif', 'image/webp']);
            assert.ok(img.getAttribute('width') && img.getAttribute('height'));
            assert.notEqual(img.getAttribute('alt'), undefined, img.getAttribute('src'));
        }

        assert.equal(site.html('index.html').querySelectorAll('img[loading="eager"]').length, 1);
        site.artifact.fact('home page photos', pictures.length);
    });

    it('credits every photographer', () => {
        assert.equal(site.html('credits/index.html').querySelectorAll('a[href^="https://unsplash.com/photos/"]').length, 20);
    });

    it('makes both phone numbers tappable where people look for them', () => {
        for (const file of ['index.html', 'emergency/index.html', 'services/urgent-care/index.html', 'book/index.html', 'blog/is-it-an-emergency/index.html']) {
            assert.ok(site.html(file).querySelector('a[href="tel:+15035550147"]'), `${file}: the hospital`);
            assert.ok(site.html(file).querySelector('a[href="tel:+15035550188"]'), `${file}: after hours`);
        }
    });

    it('keeps urgent care calm: no playful trail or sticker on the emergency page', () => {
        const emergency = site.html('emergency/index.html');

        assert.equal(emergency.querySelectorAll('.paw-trail').length, 0);
        assert.equal(emergency.querySelectorAll('.closing').length, 0);
        assert.ok(emergency.querySelector('.hero.calm'));
        assert.ok(site.html('index.html').querySelector('section.urgent.calm'));
    });

    it('lists every published post in the feed, newest first', () => {
        const titles = [...site.text('blog/rss.xml').matchAll(/<item><title>([^<]+)<\/title>/g)].map((match) => match[1]);

        assert.equal(titles.length, 10);
        assert.match(titles[0], /^Your puppy(&apos;|')s vaccine schedule, week by week$/);
        site.artifact.fact('feed', titles);
    });

    it('paginates the blog with a distinct title on each page', () => {
        const title = (file) => site.html(file).querySelector('title').text;

        assert.equal(title('blog/index.html'), 'Pet-health advice — Paws & Whiskers');
        assert.equal(title('blog/2/index.html'), 'Pet-health advice, page 2 — Paws & Whiskers');
        assert.equal(site.exists('blog/3/index.html'), false);
    });

    it('posts the appointment form to the proxied waffle app, without script, with a honeypot', () => {
        const form = site.html('book/index.html').querySelector('form[data-site-form]');
        const values = (name) => form.querySelectorAll(`input[name="${name}"]`).map((input) => input.getAttribute('value'));

        assert.equal(form.getAttribute('action'), '/api/site/forms/appointment');
        assert.equal(form.getAttribute('method'), 'post');
        assert.equal(form.querySelector('input[name="redirect"]').getAttribute('value'), '/book/thanks/');
        assert.ok(form.querySelector('input[name="company_website"]'));

        for (const name of ['pet_name', 'age', 'name', 'phone', 'email']) {
            assert.ok(form.querySelector(`input[name="${name}"][required]`), `${name} is a required field`);
        }

        assert.deepEqual(values('client_type'), ['new', 'existing']);
        assert.deepEqual(values('species'), ['dog', 'cat', 'rabbit', 'bird', 'reptile', 'other']);
        assert.deepEqual(values('preferred_times'), ['weekday-morning', 'weekday-afternoon', 'weekday-evening', 'saturday']);
        assert.ok(form.querySelectorAll('select[name="reason"] option').length >= 8);
        site.artifact.fact('appointment form', { action: form.getAttribute('action'), species: values('species') });
    });
}
