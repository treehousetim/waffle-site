/**
 * /book/?package=<slug> arrives with that package chosen: package and zone
 * pages link here that way. Only a value the select already offers is
 * taken, so the address bar cannot put anything else into the form.
 * Without script the form starts on its first package, which is fine.
 */
export function choosePackage(root: ParentNode, search: string): void {
    const params = new URLSearchParams(search);

    for (const [param, field] of [['package', 'package'], ['zone', 'zone']] as const) {
        const wanted = params.get(param);
        const select = root.querySelector<HTMLSelectElement>(`form[data-booking-form] select[name="${field}"]`);

        if (wanted === null || select === null) {
            continue;
        }

        if ([...select.options].some((option) => option.value === wanted)) {
            select.value = wanted;
        }
    }
}
