/**
 * The dental example's own end-to-end checks, run by
 * tests/e2e/site-build.test.js after the checks every site passes. Setup
 * copies this file to tests/e2e/site.checks.js; change it as the site
 * changes, the way you would any test (AGENTS.md §7).
 *
 * @param {{ it: Function, assert: typeof import('node:assert/strict'), site: any }} context
 */
export default function checks({ it, assert, site }) {
    const treatments = ['checkups-and-cleanings', 'childrens-dentistry', 'whitening', 'clear-aligners', 'implants', 'emergency-dental-care'];
    const dentists = ['hannah-whitlock', 'sofia-marchetti', 'peter-lindqvist', 'rafael-castellano'];

    it('builds every page: treatments, dentists, patient guides, booking and the blog', () => {
        const built = site.files().filter((file) => file.endsWith('.html'));
        const pages = [
            'treatments/index.html', ...treatments.map((slug) => `treatments/${slug}/index.html`),
            'team/index.html', ...dentists.map((slug) => `team/${slug}/index.html`),
            'new-patients/index.html', 'nervous-patients/index.html', 'insurance/index.html', 'faq/index.html',
            'book/index.html', 'book/thanks/index.html', 'about/index.html', 'contact/index.html', 'privacy/index.html',
            'credits/index.html', 'blog/index.html', 'blog/2/index.html', 'blog/your-childs-first-dental-visit/index.html',
            'blog/tags/nervous-patients/index.html', 'blog/tags/children/index.html',
        ];

        for (const page of pages) {
            assert.ok(built.includes(page), `${page} was not built`);
        }

        assert.equal(site.exists('blog/3/index.html'), false);
        site.artifact.fact('pages', built.length);
    });

    it('keeps the thank-you and credits pages out of search results and the sitemap', () => {
        const sitemap = site.text('sitemap-0.xml');

        for (const file of ['book/thanks/index.html', 'credits/index.html']) {
            assert.equal(site.html(file).querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
        }

        assert.equal(sitemap.includes('/book/thanks/') || sitemap.includes('/credits/'), false);
        assert.ok(sitemap.includes(`${site.url}/treatments/implants/`));
        assert.ok(sitemap.includes(`${site.url}/team/sofia-marchetti/`));
    });

    it('reads the accepted insurance from the waffle app, once, and shows every plan and price', () => {
        assert.deepEqual(site.requests(), ['GET /api/site/insurance']);

        const page = site.html('insurance/index.html');
        const plans = page.querySelectorAll('.plans .plan').map((plan) => [plan.getAttribute('data-plan'), plan.querySelector('.name').text.trim(), plan.querySelector('.network').text.trim()]);

        assert.equal(plans.length, 9);
        assert.deepEqual(plans[0], ['evergreen-mutual-ppo', 'Evergreen Mutual Dental PPO', 'In network']);
        assert.equal(plans.filter(([, , network]) => network === 'In network').length, 6);
        assert.ok(plans.some(([id, , network]) => id === 'keystone-indemnity' && network === 'Out of network'));

        const membership = page.querySelector('.payment[data-payment="membership"] .price').text.replace(/\s+/g, ' ').trim();
        assert.equal(membership, 'from $329 a year');
        assert.equal(page.querySelectorAll('.payment').length, 5);
        assert.match(page.querySelector('.updated').text, /October 1, 2026/);

        // The home page shows the in-network plans and the membership price from the same answer.
        const home = site.html('index.html');
        assert.equal(home.querySelectorAll('.plan-cloud li').length, 6);
        assert.match(home.querySelector('.membership-price').text.replace(/\s+/g, ' '), /\$329 a year/);
        site.artifact.fact('insurance plans', plans);
    });

    it('describes the practice, each treatment and each dentist in structured data', () => {
        const business = site.graph('index.html')[0];

        assert.equal(business['@type'], 'Dentist');
        assert.equal(business.telephone, '+15035550134');
        assert.equal(business.address.addressLocality, 'Thistlewood');
        assert.equal(business.areaServed.length, 4);

        for (const slug of treatments) {
            const types = site.graph(`treatments/${slug}/index.html`).map((node) => node['@type']);
            assert.deepEqual(types, ['Dentist', 'WebSite', 'WebPage', 'BreadcrumbList', 'MedicalProcedure', 'FAQPage'], slug);
        }

        const implant = site.graph('treatments/implants/index.html').find((node) => node['@type'] === 'MedicalProcedure');
        assert.equal(implant.procedureType, 'https://schema.org/SurgicalProcedure');
        assert.ok(implant.howPerformed.length > 40 && implant.preparation.length > 40 && implant.followup.length > 40);

        const person = site.graph('team/peter-lindqvist/index.html').find((node) => node['@type'] === 'Person');
        assert.equal(person.name, 'Dr. Peter Lindqvist');
        assert.deepEqual(person.worksFor, { '@id': `${site.url}/#organization` });

        for (const file of ['faq/index.html', 'insurance/index.html', 'nervous-patients/index.html', 'new-patients/index.html']) {
            assert.ok(site.graph(file).some((node) => node['@type'] === 'FAQPage'), file);
        }

        assert.deepEqual(site.graph('blog/is-teeth-whitening-safe/index.html').map((node) => node['@type']), ['Dentist', 'WebSite', 'WebPage', 'BreadcrumbList', 'BlogPosting']);
        site.artifact.fact('business', { type: business['@type'], telephone: business.telephone, areas: business.areaServed.map((area) => area.name) });
    });

    it('shows kind words as text, never as review markup', () => {
        for (const file of ['index.html', 'about/index.html']) {
            const text = site.text(file);
            assert.equal(/"@type":"(Review|AggregateRating)"/.test(text), false, file);
        }

        assert.ok(site.html('index.html').querySelectorAll('.words blockquote').length >= 3);
    });

    it('serves every photo as a picture in AVIF and WebP, sized, only the first loaded eagerly', () => {
        const pictures = site.html('index.html').querySelectorAll('picture');

        assert.ok(pictures.length >= 12, `only ${pictures.length} photos on the home page`);

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

    it('makes the phone number tappable on every kind of page', () => {
        for (const file of ['index.html', 'treatments/emergency-dental-care/index.html', 'team/hannah-whitlock/index.html', 'blog/bleeding-gums/index.html', 'book/index.html']) {
            assert.ok(site.html(file).querySelector('a[href="tel:+15035550134"]'), file);
        }
    });

    it('lists every published post in the feed, newest first', () => {
        const titles = [...site.text('blog/rss.xml').matchAll(/<item><title>([^<]+)<\/title>/g)].map((match) => match[1]);

        assert.equal(titles.length, 10);
        assert.equal(titles[0], 'Toothache: what to do tonight');
        site.artifact.fact('feed', titles);
    });

    it('paginates the blog with a distinct title on each page', () => {
        const title = (file) => site.html(file).querySelector('title').text;

        assert.equal(title('blog/index.html'), 'Oral health advice — Brightside Dental');
        assert.equal(title('blog/2/index.html'), 'Oral health advice, page 2 — Brightside Dental');
    });

    it('posts the appointment request to the proxied waffle app, without script, with a honeypot', () => {
        const form = site.html('book/index.html').querySelector('form[data-site-form]');
        const names = (selector) => [...new Set(form.querySelectorAll(selector).map((input) => input.getAttribute('name')))];

        assert.equal(form.getAttribute('action'), '/api/site/forms/appointment');
        assert.equal(form.getAttribute('method'), 'post');
        assert.equal(form.querySelector('input[name="redirect"]').getAttribute('value'), '/book/thanks/');
        assert.ok(form.querySelector('input[name="company_website"]'));
        assert.deepEqual(names('input[type="radio"]'), ['patient_type', 'appointment_for', 'contact_by']);
        assert.deepEqual(names('input[type="checkbox"]'), ['nervous', 'days', 'times']);
        assert.deepEqual(form.querySelectorAll('input[name="patient_type"]').map((input) => input.getAttribute('value')), ['new', 'existing']);

        for (const field of ['name', 'phone', 'email']) {
            assert.ok(form.querySelector(`input[name="${field}"][required]`), field);
        }

        // Reasons: every treatment and "not sure"; insurance: the waffle app's plans and two choices of our own.
        assert.equal(form.querySelectorAll('select[name="reason"] option').length, 8);
        assert.equal(form.querySelectorAll('select[name="insurance"] option').length, 11);
        assert.ok(form.querySelector('select[name="insurance"] option[value="bluefern-hmo"]'));
        site.artifact.fact('appointment form', { action: form.getAttribute('action'), fields: names('[name]') });
    });
}
