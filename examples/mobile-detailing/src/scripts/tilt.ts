/**
 * Cards marked data-tilt lean toward the pointer, as if you were turning a
 * panel under a light. It only sets two CSS custom properties (--rx, --ry)
 * through the CSSOM, which the content security policy allows; the card's
 * own CSS does the drawing. Nothing happens for touch, for keyboards, or
 * for anyone who prefers reduced motion: the cards are simply still.
 */
export function enableTilt(root: ParentNode): void {
    if (!window.matchMedia('(prefers-reduced-motion: no-preference) and (hover: hover)').matches) {
        return;
    }

    for (const card of root.querySelectorAll<HTMLElement>('[data-tilt]')) {
        card.addEventListener('pointermove', (event) => {
            const box = card.getBoundingClientRect();
            const x = (event.clientX - box.left) / box.width - 0.5;
            const y = (event.clientY - box.top) / box.height - 0.5;

            card.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
            card.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`);
        });

        card.addEventListener('pointerleave', () => {
            card.style.setProperty('--ry', '0deg');
            card.style.setProperty('--rx', '0deg');
        });
    }
}
