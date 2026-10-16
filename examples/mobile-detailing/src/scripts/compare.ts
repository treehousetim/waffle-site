/**
 * The before-and-after frames (src/components/Compare.astro): shows each
 * one's range slider, and moves the dividing line as it is dragged, by
 * setting --pos through the CSSOM. Once someone takes hold of the slider the
 * scroll-driven wipe stops (.is-manual), so the line stays where they put it.
 *
 * Without this script the frame still shows both halves, and still wipes
 * on scroll where the browser can.
 */
export function enableCompare(root: ParentNode): void {
    for (const figure of root.querySelectorAll<HTMLElement>('[data-compare]')) {
        const control = figure.querySelector<HTMLElement>('[data-compare-control]');
        const input = control?.querySelector<HTMLInputElement>('input[type="range"]');

        if (control === null || control === undefined || input === null || input === undefined) {
            continue;
        }

        control.hidden = false;

        input.addEventListener('input', () => {
            figure.classList.add('is-manual');
            figure.style.setProperty('--pos', `${input.value}%`);
        });
    }
}
