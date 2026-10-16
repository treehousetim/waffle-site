// src/lib/jsonld.js — docs/seo.md, "Structured data".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    blogPosting,
    breadcrumbList,
    faqPage,
    graph,
    localBusiness,
    organization,
    serializeJsonLd,
    service,
    webPage,
    website,
} from '../../src/core/lib/jsonld.js';

const site = 'https://www.acme.com';

test('the organization has an id the other nodes point at, and an absolute logo', () => {
    assert.deepEqual(organization({ name: 'Acme', logo: '/logo.png', sameAs: ['https://x.com/acme'], email: 'hi@acme.com' }, site), {
        '@type': 'Organization',
        '@id': 'https://www.acme.com/#organization',
        name: 'Acme',
        url: 'https://www.acme.com/',
        logo: 'https://www.acme.com/logo.png',
        sameAs: ['https://x.com/acme'],
        email: 'hi@acme.com',
    });
});

test('an organization with no profiles or email leaves both out', () => {
    const node = organization({ name: 'Acme', logo: 'https://cdn.example/logo.png', sameAs: [] }, site);

    assert.equal('sameAs' in node, false);
    assert.equal('email' in node, false);
    assert.equal(node.logo, 'https://cdn.example/logo.png');
});

test('the website is published by the organization', () => {
    assert.deepEqual(website({ name: 'Acme', description: 'Scheduling.' }, site), {
        '@type': 'WebSite',
        '@id': 'https://www.acme.com/#website',
        url: 'https://www.acme.com/',
        name: 'Acme',
        description: 'Scheduling.',
        publisher: { '@id': 'https://www.acme.com/#organization' },
    });
});

test('a page belongs to the website', () => {
    const node = webPage({ url: 'https://www.acme.com/pricing/', title: 'Pricing', description: 'Plans.' }, site);

    assert.equal(node['@id'], 'https://www.acme.com/pricing/#webpage');
    assert.deepEqual(node.isPartOf, { '@id': 'https://www.acme.com/#website' });
});

test('a post carries its dates, author, publisher and keywords', () => {
    const node = blogPosting({
        url: 'https://www.acme.com/blog/hello/',
        title: 'Hello',
        description: 'First post.',
        image: 'https://www.acme.com/og.png',
        published: new Date('2026-10-01T00:00:00Z'),
        updated: new Date('2026-10-05T00:00:00Z'),
        author: 'Sam',
        tags: ['news', 'product'],
    }, site);

    assert.equal(node.datePublished, '2026-10-01T00:00:00.000Z');
    assert.equal(node.dateModified, '2026-10-05T00:00:00.000Z');
    assert.deepEqual(node.author, { '@type': 'Person', name: 'Sam' });
    assert.deepEqual(node.publisher, { '@id': 'https://www.acme.com/#organization' });
    assert.equal(node.keywords, 'news, product');
});

test('a post never updated was modified when it was published, and an untagged one has no keywords', () => {
    const node = blogPosting({
        url: 'u', title: 't', description: 'd', image: 'i',
        published: new Date('2026-10-01T00:00:00Z'), author: 'Sam', tags: [],
    }, site);

    assert.equal(node.dateModified, '2026-10-01T00:00:00.000Z');
    assert.equal('keywords' in node, false);
});

test('breadcrumbs are numbered from one', () => {
    assert.deepEqual(breadcrumbList([{ name: 'Home', url: 'a' }, { name: 'Blog', url: 'b' }]).itemListElement, [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'a' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'b' },
    ]);
});

test('an FAQ is questions with accepted answers', () => {
    assert.deepEqual(faqPage([{ question: 'Q?', answer: 'A.' }]), {
        '@type': 'FAQPage',
        mainEntity: [{ '@type': 'Question', name: 'Q?', acceptedAnswer: { '@type': 'Answer', text: 'A.' } }],
    });
});

test('a graph is one schema.org document', () => {
    assert.deepEqual(graph([{ '@type': 'Thing' }]), { '@context': 'https://schema.org', '@graph': [{ '@type': 'Thing' }] });
});

test('serialised JSON-LD cannot close its script element, and reads back unchanged', () => {
    const value = { text: '</script><script>alert(1)</script> & \u2028\u2029' };
    const text = serializeJsonLd(value);

    assert.equal(text.includes('<'), false);
    assert.equal(text.includes('>'), false);
    assert.equal(text.includes('&'), false);
    assert.equal(text.includes('\u2028'), false);
    assert.equal(text.includes('\u2029'), false);
    assert.deepEqual(JSON.parse(text), value);
});

const business = {
    type: 'Electrician',
    name: 'Acme',
    legalName: 'Acme Electrical LLC',
    phoneE164: '+12175550142',
    email: 'hi@acme.com',
    address: { street: '1 Main St', city: 'Springfield', region: 'IL', postalCode: '62701', country: 'US' },
    geo: { latitude: 39.78, longitude: -89.65 },
    hours: [{ days: ['Monday', 'Friday'], opens: '08:00', closes: '17:00' }],
    priceRange: '$$',
    founded: 2009,
    logo: '/logo.png',
    sameAs: ['https://facebook.com/acme'],
};

test('a local business is the organization, with its address, hours, phone and towns', () => {
    const node = localBusiness(business, ['Springfield', 'Riverside'], site);

    assert.equal(node['@type'], 'Electrician');
    assert.equal(node['@id'], 'https://www.acme.com/#organization');
    assert.equal(node.telephone, '+12175550142');
    assert.equal(node.foundingDate, '2009');
    assert.equal(node.logo, 'https://www.acme.com/logo.png');
    assert.deepEqual(node.address, {
        '@type': 'PostalAddress', streetAddress: '1 Main St', addressLocality: 'Springfield',
        addressRegion: 'IL', postalCode: '62701', addressCountry: 'US',
    });
    assert.deepEqual(node.geo, { '@type': 'GeoCoordinates', latitude: 39.78, longitude: -89.65 });
    assert.deepEqual(node.openingHoursSpecification, [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Friday'], opens: '08:00', closes: '17:00' },
    ]);
    assert.deepEqual(node.areaServed, [{ '@type': 'City', name: 'Springfield' }, { '@type': 'City', name: 'Riverside' }]);
    assert.deepEqual(node.sameAs, ['https://facebook.com/acme']);
    assert.equal('aggregateRating' in node, false);
});

test('a local business with no profiles elsewhere has no sameAs', () => {
    assert.equal('sameAs' in localBusiness({ ...business, sameAs: [] }, [], site), false);
});

test('a service is provided by the business, in the towns it serves', () => {
    assert.deepEqual(service({ url: 'https://www.acme.com/services/ev/', name: 'EV chargers', description: 'Installed.', areas: ['Springfield'] }, site), {
        '@type': 'Service',
        '@id': 'https://www.acme.com/services/ev/#service',
        name: 'EV chargers',
        serviceType: 'EV chargers',
        description: 'Installed.',
        url: 'https://www.acme.com/services/ev/',
        provider: { '@id': 'https://www.acme.com/#organization' },
        areaServed: [{ '@type': 'City', name: 'Springfield' }],
    });
});
