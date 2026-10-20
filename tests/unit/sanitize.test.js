// src/core/lib/sanitize.js — HTML rendered from the app's Markdown keeps only plain tags and safe links.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, safeHref } from '../../src/core/lib/sanitize.js';

test('keeps what Markdown makes: paragraphs, emphasis, lists, quotes, code, tables, headings', () => {
    const html = '<h2>Agenda</h2><p>We <strong>build</strong> and <em>measure</em>.<br></p><ul><li>One</li></ul><ol start="3"><li>Three</li></ol>'
        + '<blockquote><p>Quoted</p></blockquote><pre><code class="language-js">let a = 1 &lt; 2;</code></pre><hr>'
        + '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table><p><del>old</del> <code>x</code></p>';

    assert.equal(sanitize(html), html);
});

test('drops scripts, styles and frames with what they hold, and any other tag but its text', () => {
    assert.equal(sanitize('<p>Hi<script>alert(1)</script><style>p{}</style><iframe src="x"></iframe></p>'), '<p>Hi</p>');
    assert.equal(sanitize('<div class="x"><span onclick="alert(1)">text</span></div>'), 'text');
    assert.equal(sanitize('<img src="x" onerror="alert(1)">after'), 'after');
    assert.equal(sanitize('<p>a<!-- hidden -->b</p>'), '<p>ab</p>');
    assert.equal(sanitize('<meta http-equiv="refresh" content="0;url=https://evil.example">x'), 'x');
});

test('keeps only safe attributes, and only safe links', () => {
    assert.equal(sanitize('<p class="lead" style="color:red" id="x">p</p>'), '<p>p</p>');
    assert.equal(sanitize('<a href="/events/" title="t" target="_blank">e</a>'), '<a href="/events/">e</a>');
    assert.equal(sanitize('<a href="javascript:alert(1)">x</a>'), '<a>x</a>');
    assert.equal(sanitize('<code class="evil">x</code>'), '<code>x</code>');
    assert.equal(sanitize('<ol start="x"><li>a</li></ol>'), '<ol><li>a</li></ol>');
});

test('re-escapes text, so nothing in it becomes markup', () => {
    assert.equal(sanitize('<p>1 &lt; 2 &amp; &quot;q&quot;</p>'), '<p>1 &lt; 2 &amp; &quot;q&quot;</p>');
    assert.equal(sanitize('<a href="/a?x=1&amp;y=&quot;2&quot;">q</a>'), '<a href="/a?x=1&amp;y=&quot;2&quot;">q</a>');
});

test('a link goes to a site path, an anchor, https or mailto', () => {
    for (const href of ['/events/', '#rsvp', 'https://example.com/x', 'mailto:hello@example.com']) {
        assert.equal(safeHref(href), true, href);
    }

    for (const href of ['javascript:alert(1)', 'JaVaScRiPt:x', 'data:text/html,x', 'http://example.com', '//evil.example', 'events', ' https://x.example', '']) {
        assert.equal(safeHref(href), false, href);
    }
});
