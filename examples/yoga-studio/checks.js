/**
 * The yoga studio example's own end-to-end checks, run by
 * tests/e2e/site-build.test.js after the checks every site passes. Setup
 * copies this file to tests/e2e/site.checks.js; change it as the site
 * changes, the way you would any test (AGENTS.md §7).
 *
 * @param {{ it: Function, assert: typeof import('node:assert/strict'), site: any }} context
 */
export default function checks({ it, assert, site }) {
    const styles = ['vinyasa', 'yin', 'restorative', 'prenatal', 'beginners'];
    const teachers = ['maya-lindqvist', 'tomas-reyes', 'iris-okonkwo', 'hana-mori', 'nell-ashby'];

    it('builds every page: a page per class style and per teacher, and the paginated journal', () => {
        const built = site.files().filter((file) => file.endsWith('.html'));

        for (const page of ['classes/index.html', 'schedule/index.html', 'teachers/index.html', 'pricing/index.html',
            'workshops/index.html', 'new-students/index.html', 'about/index.html', 'faq/index.html', 'contact/index.html',
            'contact/thanks/index.html', 'privacy/index.html', 'credits/index.html', 'blog/index.html', 'blog/2/index.html',
            'blog/your-first-yoga-class/index.html', 'blog/tags/rest/index.html',
            ...styles.map((slug) => `classes/${slug}/index.html`),
            ...teachers.map((slug) => `teachers/${slug}/index.html`)]) {
            assert.ok(built.includes(page), `${page} was not built`);
        }

        assert.equal(site.exists('blog/3/index.html'), false);
        site.artifact.fact('pages', built.length);
    });

    it('keeps the thank-you and credits pages out of search results and the sitemap', () => {
        const sitemap = site.text('sitemap-0.xml');

        for (const file of ['contact/thanks/index.html', 'credits/index.html']) {
            assert.equal(site.html(file).querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
        }

        assert.equal(sitemap.includes('/contact/thanks/') || sitemap.includes('/credits/'), false);
        assert.ok(sitemap.includes(`${site.url}/classes/prenatal/`));
        assert.ok(sitemap.includes(`${site.url}/teachers/iris-okonkwo/`));
    });

    it('shows the waffle app\'s weekly schedule, day by day, and reads nothing else', () => {
        const page = site.html('schedule/index.html');
        const days = page.querySelectorAll('.days > .day');
        const slots = page.querySelectorAll('.slot');
        const first = slots[0];

        assert.equal(days.length, 7);
        assert.equal(slots.length, 29);
        assert.equal(days[0].querySelector('.day-name').text.trim().startsWith('Monday'), true);
        assert.equal(first.getAttribute('data-style'), 'vinyasa');
        assert.equal(first.querySelector('time').getAttribute('datetime'), '06:45');
        assert.equal(first.querySelector('time').text.trim(), '6:45 am');
        assert.equal(first.querySelector('a.teacher').getAttribute('href'), '/teachers/maya-lindqvist/');
        assert.equal(first.querySelector('.spaces').text.trim(), '4 spaces left');
        assert.equal(slots.filter((slot) => slot.querySelector('.spaces').text.trim() === 'Full, waitlist open').length, 2);
        // The filter: one choice for everything, then one per class style.
        assert.deepEqual(page.querySelectorAll('input[name="show"]').map((input) => input.getAttribute('value')), ['all', ...styles]);
        assert.deepEqual(site.requests(), ['GET /api/site/schedule']);
        site.artifact.fact('schedule', slots.map((slot) => [
            slot.querySelector('time').getAttribute('datetime'),
            slot.getAttribute('data-style'),
            slot.querySelector('.spaces').text.trim(),
        ]));
    });

    it('shows each class style and each teacher only their own classes', () => {
        const yin = site.html('classes/yin/index.html').querySelectorAll('.slot');
        const hana = site.html('teachers/hana-mori/index.html').querySelectorAll('.slot');

        assert.equal(yin.length, 6);
        assert.ok(yin.every((slot) => slot.getAttribute('data-style') === 'yin'));
        assert.deepEqual(hana.map((slot) => slot.getAttribute('data-style')), ['prenatal', 'restorative', 'prenatal', 'prenatal', 'restorative']);
        assert.equal(site.html('index.html').querySelectorAll('.glance .pill').length, 29);
    });

    it('describes the studio, its classes, teachers, FAQs and posts in structured data', () => {
        const business = site.graph('index.html')[0];
        const types = (file) => site.graph(file).map((node) => node['@type']);

        assert.equal(business['@type'], 'SportsActivityLocation');
        assert.equal(business.telephone, '+15415550137');
        assert.equal(business.address.addressLocality, 'Alderwick');
        assert.deepEqual(types('classes/restorative/index.html'), ['SportsActivityLocation', 'WebSite', 'WebPage', 'BreadcrumbList', 'Service', 'FAQPage']);
        assert.deepEqual(types('teachers/nell-ashby/index.html'), ['SportsActivityLocation', 'WebSite', 'WebPage', 'BreadcrumbList', 'Person']);
        assert.ok(types('faq/index.html').includes('FAQPage'));
        assert.ok(types('pricing/index.html').includes('FAQPage'));
        assert.deepEqual(types('blog/why-we-teach-vinyasa-slowly/index.html'), ['SportsActivityLocation', 'WebSite', 'WebPage', 'BreadcrumbList', 'BlogPosting']);
        assert.equal(site.graph('faq/index.html').find((node) => node['@type'] === 'FAQPage').mainEntity.length, 12);
        site.artifact.fact('business', { type: business['@type'], telephone: business.telephone, city: business.address.addressLocality });
    });

    it('serves every photo as a picture in AVIF and WebP, sized, described, only the first loaded eagerly', () => {
        const home = site.html('index.html');
        const pictures = home.querySelectorAll('picture');

        assert.ok(pictures.length >= 12, `only ${pictures.length} photos on the home page`);

        for (const picture of pictures) {
            const img = picture.querySelector('img');

            assert.deepEqual(picture.querySelectorAll('source').map((source) => source.getAttribute('type')), ['image/avif', 'image/webp']);
            assert.ok(img.getAttribute('width') && img.getAttribute('height'));
            assert.notEqual(img.getAttribute('alt'), undefined, img.getAttribute('src'));
        }

        assert.equal(home.querySelectorAll('img[loading="eager"]').length, 1);
        // Class, teacher and post photos sit beside links that name them, so
        // their alt is empty; the river, the room and the retreat are described.
        assert.ok(home.querySelectorAll('img[alt]').filter((img) => img.getAttribute('alt').length > 10).length >= 3);
        site.artifact.fact('home page photos', pictures.length);
    });

    it('credits every photographer', () => {
        assert.ok(site.html('credits/index.html').querySelectorAll('a[href^="https://unsplash.com/photos/"]').length >= 18);
    });

    it('carries the breathing circle on the home page, still and described where motion is off', () => {
        const breath = site.html('index.html').querySelector('.home-hero .breath');

        assert.ok(breath, 'no breathing circle');
        assert.equal(breath.querySelector('.cue-title').text.trim(), 'Breathe with us');
        assert.equal(breath.querySelector('.steady').text.trim(), 'in for four, out for six');
        assert.ok(breath.querySelectorAll('.phase').every((phase) => phase.getAttribute('aria-hidden') === 'true'));
    });

    it('lists every published post in the feed, newest first', () => {
        const titles = [...site.text('blog/rss.xml').matchAll(/<item><title>([^<]+)<\/title>/g)].map((match) => match[1]);

        assert.equal(titles.length, 11);
        assert.equal(titles[0], 'Practising with autumn on the river');
        site.artifact.fact('feed', titles);
    });

    it('paginates the journal with a distinct title on each page', () => {
        const title = (file) => site.html(file).querySelector('title').text;

        assert.equal(title('blog/index.html'), 'The journal — Still Water Yoga');
        assert.equal(title('blog/2/index.html'), 'The journal, page 2 — Still Water Yoga');
    });

    it('posts the intro offer form to the proxied waffle app, without script, with a honeypot', () => {
        for (const file of ['new-students/index.html']) {
            const form = site.html(file).querySelector('form[data-site-form]');

            assert.equal(form.getAttribute('action'), '/api/site/forms/intro-offer');
            assert.equal(form.getAttribute('method'), 'post');
            assert.equal(form.querySelector('input[name="redirect"]').getAttribute('value'), '/contact/thanks/');
            assert.ok(form.querySelector('input[name="company_website"]'));

            for (const name of ['name', 'email', 'phone']) {
                assert.ok(form.querySelector(`input[name="${name}"][required]`), name);
            }

            assert.deepEqual(form.querySelectorAll('input[name="experience"]').map((input) => input.getAttribute('value')), ['none', 'some', 'regular', 'returning']);
            assert.deepEqual(form.querySelectorAll('select[name="start_with"] option').map((option) => option.getAttribute('value')), [...styles, 'unsure']);

            for (const field of ['name', 'email', 'phone', 'experience', 'start_with']) {
                assert.ok(form.querySelector(`[data-error-for="${field}"]`), `no error slot for ${field}`);
            }

            site.artifact.fact('intro offer form', { page: file, action: form.getAttribute('action') });
        }
    });

    it('makes the phone number tappable on every kind of page', () => {
        for (const file of ['index.html', 'schedule/index.html', 'classes/yin/index.html', 'blog/your-first-yoga-class/index.html']) {
            assert.ok(site.html(file).querySelector('a[href="tel:+15415550137"]'), file);
        }
    });
}
