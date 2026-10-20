/**
 * HTML rendered from the waffle app's Markdown, made safe to put in a page
 * (Waffle's docs/content.md). The app refuses raw HTML and unsafe links when
 * staff save; this is the second line, because Astro's Markdown renderer
 * passes raw HTML through. Only the tags Markdown makes are kept, with only
 * the attributes they need, and a link only to a site path, an anchor,
 * https:// or mailto:. Everything else is dropped; text is re-escaped.
 */

import { parse, NodeType } from 'node-html-parser';

/** Tags kept, and the attributes each may keep. */
const ALLOWED = {
    p: [], br: [], hr: [], em: [], strong: [], b: [], i: [], del: [], s: [], code: ['class'], pre: [],
    blockquote: [], ul: [], ol: ['start'], li: [], a: ['href'],
    h2: [], h3: [], h4: [], h5: [], h6: [],
    table: [], thead: [], tbody: [], tr: [], th: [], td: [],
};

/** Tags dropped together with everything inside them. */
const DROPPED = new Set(['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'svg', 'math', 'title', 'textarea', 'select']);

const VOID = new Set(['br', 'hr']);

/** @param {string} html */
export function sanitize(html) {
    // Comments are dropped by the parser; script and style are read as text
    // so nothing inside them is taken for tags, then dropped below.
    return children(parse(html, { comment: false, blockTextElements: { script: true, style: true, noscript: true } }));
}

/**
 * @param {string} href
 * @returns {boolean}
 */
export function safeHref(href) {
    return /^(?:\/(?!\/)|#|https:\/\/[^\s/]|mailto:[^\s]+@)/i.test(href);
}

/**
 * @param {import('node-html-parser').Node} node
 * @returns {string}
 */
function children(node) {
    return node.childNodes.map(serialize).join('');
}

/**
 * @param {import('node-html-parser').Node} node
 * @returns {string}
 */
function serialize(node) {
    if (node.nodeType === NodeType.TEXT_NODE) {
        return escape(node.text);
    }

    const element = /** @type {import('node-html-parser').HTMLElement} */ (node);
    const tag = element.rawTagName.toLowerCase();

    if (DROPPED.has(tag)) {
        return '';
    }

    const keep = /** @type {Record<string, string[]>} */ (ALLOWED)[tag];

    if (keep === undefined) {
        return children(element);
    }

    const attributes = keep
        .map((name) => /** @type {[string, string | undefined]} */ ([name, element.getAttribute(name)]))
        .filter(([name, value]) => value !== undefined && allowed(tag, name, value))
        .map(([name, value]) => ` ${name}="${escape(String(value))}"`)
        .join('');

    return VOID.has(tag) ? `<${tag}${attributes}>` : `<${tag}${attributes}>${children(element)}</${tag}>`;
}

/** @param {string} tag @param {string} name @param {string} value */
function allowed(tag, name, value) {
    if (name === 'href') {
        return safeHref(value);
    }

    if (name === 'start') {
        return /^\d{1,9}$/.test(value);
    }

    return tag === 'code' && /^language-[a-z0-9+#-]{1,30}$/i.test(value);
}

/** @param {string} text */
function escape(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
