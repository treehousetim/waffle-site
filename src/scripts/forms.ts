/**
 * Makes every form marked data-site-form send JSON and show the app's answer
 * in place, instead of leaving the page (docs/forms.md). Without this script
 * the same form still works: the browser posts it and the app redirects.
 *
 * The rules for reading the answer live in src/lib/forms.js, which is tested;
 * this is only the wiring to the page.
 */
import { formPayload, submissionOutcome } from '../lib/forms.js';

export function enhanceForms(root: ParentNode): void {
    for (const form of root.querySelectorAll<HTMLFormElement>('form[data-site-form]')) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            void submit(form);
        });
    }
}

async function submit(form: HTMLFormElement): Promise<void> {
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const status = form.querySelector<HTMLElement>('[data-status]');

    showFieldErrors(form, {});
    button?.setAttribute('disabled', '');

    let outcome;

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(formPayload(new FormData(form))),
        });
        const body: unknown = await response.json().catch(() => null);
        outcome = submissionOutcome(response.status, body);
    } catch {
        outcome = submissionOutcome(0, null);
    } finally {
        button?.removeAttribute('disabled');
    }

    if (status !== null) {
        status.textContent = outcome.message;
        status.dataset.kind = outcome.kind;
    }

    showFieldErrors(form, outcome.fields);

    if (outcome.kind === 'sent') {
        form.reset();
    }
}

function showFieldErrors(form: HTMLFormElement, fields: Record<string, string>): void {
    for (const slot of form.querySelectorAll<HTMLElement>('[data-error-for]')) {
        const name = slot.dataset.errorFor ?? '';
        const message = fields[name];
        const input = form.elements.namedItem(name);

        slot.textContent = message ?? '';
        slot.hidden = message === undefined;

        if (input instanceof HTMLElement) {
            if (message === undefined) {
                input.removeAttribute('aria-invalid');
            } else {
                input.setAttribute('aria-invalid', 'true');
            }
        }
    }
}
