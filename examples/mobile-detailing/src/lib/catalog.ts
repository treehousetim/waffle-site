/**
 * The packages as pages use them: the waffle app's list (prices, durations,
 * what is included), checked by parsePackages, joined to the site's own copy
 * for each (src/data/packages.ts).
 *
 * The app decides which packages exist. A package it lists that has no copy
 * here fails the build, naming the slug: a new package needs its words
 * written before it goes live. Copy for a package the app no longer lists is
 * simply not shown.
 *
 * waffle.get() fetches each path once per build, however many pages ask.
 */
import { waffle } from '@core/settings';
import { packageCopy, type PackageCopy } from '../data/packages';
import { parsePackages, type DetailPackage, type PackageList } from './packages';

export type CatalogPackage = DetailPackage & { copy: PackageCopy; url: string };

export interface Catalog extends Omit<PackageList, 'packages'> {
    packages: CatalogPackage[];
}

export const packageUrl = (slug: string) => `/packages/${slug}/`;

export async function loadCatalog(): Promise<Catalog> {
    const list = parsePackages(await waffle.get('/api/site/packages'));

    return {
        ...list,
        packages: list.packages.map((item) => {
            const copy = packageCopy.find((entry) => entry.slug === item.slug);

            if (copy === undefined) {
                throw new Error(`/api/site/packages lists '${item.slug}', which has no copy in src/data/packages.ts. Write its page copy before it goes live.`);
            }

            return { ...item, copy, url: packageUrl(item.slug) };
        }),
    };
}
