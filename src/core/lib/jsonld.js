/**
 * Structured data (schema.org JSON-LD): what search engines read to show a
 * site's name, logo, breadcrumbs and article dates instead of guessing them.
 *
 * Builders return plain objects; `serializeJsonLd` turns a graph into text
 * that is safe inside <script type="application/ld+json">. docs/seo.md.
 */

/**
 * @typedef {object} Organization
 * @property {string} name
 * @property {string} logo        path or URL
 * @property {readonly string[]} sameAs  profiles elsewhere (social, directories)
 * @property {string} [email]
 */

/**
 * @param {Organization} org
 * @param {string} siteUrl
 */
export function organization(org, siteUrl) {
    /** @type {Record<string, unknown>} */
    const node = {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: org.name,
        url: `${siteUrl}/`,
        logo: new URL(org.logo, siteUrl + '/').href,
    };

    if (org.sameAs.length > 0) {
        node.sameAs = [...org.sameAs];
    }

    if (org.email !== undefined) {
        node.email = org.email;
    }

    return node;
}

/**
 * @typedef {object} Business
 * @property {string} type        a schema.org LocalBusiness type: Electrician, Plumber...
 * @property {string} name
 * @property {string} legalName
 * @property {string} phoneE164
 * @property {string} email
 * @property {{ street: string, city: string, region: string, postalCode: string, country: string }} address
 * @property {{ latitude: number, longitude: number }} geo
 * @property {readonly { days: readonly string[], opens: string, closes: string }[]} hours
 * @property {string} priceRange
 * @property {number} founded
 * @property {string} logo
 * @property {readonly string[]} sameAs
 */

/**
 * A local business: what search engines show in the map pack and the
 * knowledge panel. It takes the organization's @id, so every page's
 * publisher and provider point at it. No ratings: marking up reviews a
 * business shows about itself is against search engines' rules.
 *
 * @param {Business} business
 * @param {readonly string[]} areas  the towns served
 * @param {string} siteUrl
 */
export function localBusiness(business, areas, siteUrl) {
    /** @type {Record<string, unknown>} */
    const node = {
        '@type': business.type,
        '@id': `${siteUrl}/#organization`,
        name: business.name,
        legalName: business.legalName,
        url: `${siteUrl}/`,
        logo: new URL(business.logo, siteUrl + '/').href,
        image: new URL(business.logo, siteUrl + '/').href,
        telephone: business.phoneE164,
        email: business.email,
        priceRange: business.priceRange,
        foundingDate: String(business.founded),
        address: {
            '@type': 'PostalAddress',
            streetAddress: business.address.street,
            addressLocality: business.address.city,
            addressRegion: business.address.region,
            postalCode: business.address.postalCode,
            addressCountry: business.address.country,
        },
        geo: { '@type': 'GeoCoordinates', latitude: business.geo.latitude, longitude: business.geo.longitude },
        openingHoursSpecification: business.hours.map((hours) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [...hours.days],
            opens: hours.opens,
            closes: hours.closes,
        })),
        areaServed: areas.map((name) => ({ '@type': 'City', name })),
    };

    if (business.sameAs.length > 0) {
        node.sameAs = [...business.sameAs];
    }

    return node;
}

/**
 * One service the business offers, on that service's page.
 *
 * @param {{ url: string, name: string, description: string, areas: readonly string[] }} service
 * @param {string} siteUrl
 */
export function service(service, siteUrl) {
    return {
        '@type': 'Service',
        '@id': `${service.url}#service`,
        name: service.name,
        serviceType: service.name,
        description: service.description,
        url: service.url,
        provider: { '@id': `${siteUrl}/#organization` },
        areaServed: service.areas.map((name) => ({ '@type': 'City', name })),
    };
}

/**
 * @param {{ name: string, description: string }} site
 * @param {string} siteUrl
 */
export function website(site, siteUrl) {
    return {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: site.name,
        description: site.description,
        publisher: { '@id': `${siteUrl}/#organization` },
    };
}

/**
 * @param {{ url: string, title: string, description: string }} page
 * @param {string} siteUrl
 */
export function webPage(page, siteUrl) {
    return {
        '@type': 'WebPage',
        '@id': `${page.url}#webpage`,
        url: page.url,
        name: page.title,
        description: page.description,
        isPartOf: { '@id': `${siteUrl}/#website` },
    };
}

/**
 * @param {{
 *   url: string, title: string, description: string, image: string,
 *   published: Date, updated?: Date, author: string, tags: readonly string[]
 * }} post
 * @param {string} siteUrl
 */
export function blogPosting(post, siteUrl) {
    /** @type {Record<string, unknown>} */
    const node = {
        '@type': 'BlogPosting',
        '@id': `${post.url}#article`,
        mainEntityOfPage: post.url,
        headline: post.title,
        description: post.description,
        image: post.image,
        datePublished: post.published.toISOString(),
        dateModified: (post.updated ?? post.published).toISOString(),
        author: { '@type': 'Person', name: post.author },
        publisher: { '@id': `${siteUrl}/#organization` },
    };

    if (post.tags.length > 0) {
        node.keywords = post.tags.join(', ');
    }

    return node;
}

/**
 * @param {readonly { name: string, url: string }[]} trail  home first
 */
export function breadcrumbList(trail) {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: trail.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: crumb.url,
        })),
    };
}

/**
 * @param {readonly { question: string, answer: string }[]} items
 */
export function faqPage(items) {
    return {
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
    };
}

/**
 * One document holding every node, linked by @id.
 *
 * @param {readonly Record<string, unknown>[]} nodes
 */
export function graph(nodes) {
    return { '@context': 'https://schema.org', '@graph': [...nodes] };
}

/**
 * JSON that cannot end the <script> element it sits in. `</script>` inside a
 * string would close the element and turn the rest into markup, so `<`, `>`
 * and `&` are written as JSON unicode escapes (backslash-u003c and friends),
 * which JSON reads back unchanged;
 * U+2028 and U+2029 likewise, which some parsers treat as line ends.
 *
 * @param {unknown} value
 */
export function serializeJsonLd(value) {
    return JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}
