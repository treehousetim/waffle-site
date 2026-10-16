/**
 * The full-screen viewer, enhanced. Without this script it already works:
 * each photograph links to its slide (#<id>-view-<n>), shown with :target,
 * and the slide's own links go to the previous, the next, and back
 * (src/components/Gallery.astro). This adds what links cannot do:
 *
 *   - the keyboard: left and right arrows move, Escape closes;
 *   - swiping left and right on a touch screen;
 *   - focus: on the slide's Close link when it opens, back on the photograph
 *     you opened when it closes;
 *   - history: moving between photographs replaces the entry instead of
 *     adding one, so Back leaves the viewer rather than replaying it;
 *   - the page stays where it was: opening a slide does not scroll it.
 */

const SWIPE = 50;

export function enhanceViewers(root: Document): void {
    let opener: HTMLElement | null = null;
    let scrollY = 0;

    const current = (): HTMLElement | null => {
        const hash = decodeURIComponent(root.location.hash.slice(1));
        const target = hash === '' ? null : root.getElementById(hash);

        return target?.matches('[data-slide]') ? target : null;
    };

    const go = (link: HTMLAnchorElement | null, mode: 'push' | 'replace'): void => {
        if (link === null) {
            return;
        }

        const hash = new URL(link.href).hash;

        // A real navigation either way, so :target follows; replacing keeps
        // the history to one entry for the whole time the viewer is open.
        if (mode === 'replace') {
            root.location.replace(hash);
        } else {
            root.location.hash = hash;
        }
    };

    const close = (slide: HTMLElement): void => {
        go(slide.querySelector<HTMLAnchorElement>('[data-viewer-close]'), 'replace');
        root.defaultView?.scrollTo({ top: scrollY, behavior: 'instant' });
        opener?.focus({ preventScroll: true });
    };

    root.addEventListener('click', (event) => {
        const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-viewer-open], a[data-viewer-prev], a[data-viewer-next], a[data-viewer-close]');

        if (link === null || link === undefined) {
            return;
        }

        event.preventDefault();

        if (link.matches('[data-viewer-open]')) {
            opener = link;
            scrollY = root.defaultView?.scrollY ?? 0;
            go(link, 'push');
            root.defaultView?.scrollTo({ top: scrollY, behavior: 'instant' });
        } else if (link.matches('[data-viewer-close]')) {
            const slide = link.closest<HTMLElement>('[data-slide]');

            if (slide !== null) {
                close(slide);
            }
        } else {
            go(link, 'replace');
            root.defaultView?.scrollTo({ top: scrollY, behavior: 'instant' });
        }
    });

    root.defaultView?.addEventListener('hashchange', () => {
        current()?.querySelector<HTMLElement>('[data-viewer-close]')?.focus({ preventScroll: true });
    });

    root.addEventListener('keydown', (event) => {
        const slide = current();

        if (slide === null) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            close(slide);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            go(slide.querySelector<HTMLAnchorElement>('[data-viewer-next]'), 'replace');
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            go(slide.querySelector<HTMLAnchorElement>('[data-viewer-prev]'), 'replace');
        }
    });

    let startX: number | null = null;

    root.addEventListener(
        'touchstart',
        (event) => {
            startX = current() !== null && event.touches.length === 1 ? (event.touches[0]?.clientX ?? null) : null;
        },
        { passive: true },
    );

    root.addEventListener('touchend', (event) => {
        const slide = current();
        const endX = event.changedTouches[0]?.clientX;

        if (slide === null || startX === null || endX === undefined) {
            return;
        }

        const distance = endX - startX;
        startX = null;

        if (Math.abs(distance) >= SWIPE) {
            go(slide.querySelector<HTMLAnchorElement>(distance < 0 ? '[data-viewer-next]' : '[data-viewer-prev]'), 'replace');
        }
    });

    // Opened straight from a link to a slide: focus it.
    current()?.querySelector<HTMLElement>('[data-viewer-close]')?.focus({ preventScroll: true });
}
