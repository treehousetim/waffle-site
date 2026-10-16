/**
 * The celebration cake menu: what can be ordered, in what sizes, in what
 * flavours, and how far ahead. The order form (components/CakeOrderForm.astro)
 * offers exactly these, and the waffle app that receives the order should
 * accept exactly these values (POST /api/site/forms/cake-order).
 */
import type { PhotoName } from './photos';

export interface Option {
    /** What the form sends. */
    value: string;
    label: string;
}

export const occasions: Option[] = [
    { value: 'birthday', label: 'Birthday' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'baby', label: 'Baby shower or naming day' },
    { value: 'office', label: 'Office or team celebration' },
    { value: 'other', label: 'Something else' },
];

export interface Size {
    value: string;
    label: string;
    serves: string;
    priceFrom: string;
    note: string;
}

/** Sizes and servings. Prices are examples: set the real ones with the bakery. */
export const sizes: Size[] = [
    { value: '6', label: '6-inch, two layers', serves: '8–10', priceFrom: '$48', note: 'A small birthday, a big dinner party.' },
    { value: '8', label: '8-inch, three layers', serves: '14–18', priceFrom: '$72', note: 'Our most ordered size.' },
    { value: '10', label: '10-inch, three layers', serves: '24–30', priceFrom: '$105', note: 'For a crowd, or an office.' },
    { value: 'two-tier', label: 'Two tiers, 6 and 9 inch', serves: '40–50', priceFrom: '$240', note: 'Weddings and big birthdays; a tasting first.' },
    { value: 'three-tier', label: 'Three tiers, 6, 8 and 10 inch', serves: '70–90', priceFrom: '$410', note: 'Weddings; booked at least six weeks ahead.' },
];

export interface Flavour {
    value: string;
    name: string;
    description: string;
    /** When it is at its best; the year round when absent. */
    season?: string;
}

export const flavours: Flavour[] = [
    { value: 'vanilla-berry', name: 'Vanilla bean & berries', description: 'Vanilla sponge, whipped mascarpone, whatever berries are best that week.', season: 'June to September' },
    { value: 'chocolate-salted-caramel', name: 'Chocolate & salted caramel', description: 'Dark chocolate sponge, salted caramel, chocolate buttercream.' },
    { value: 'lemon-elderflower', name: 'Lemon & elderflower', description: 'Lemon sponge soaked in elderflower syrup, lemon curd, Swiss meringue buttercream.' },
    { value: 'brown-butter-pear', name: 'Brown butter & pear', description: 'Brown butter sponge, poached pear, vanilla cream, a little cardamom.', season: 'October to January' },
    { value: 'carrot-walnut', name: 'Carrot & walnut', description: 'Spiced carrot cake, toasted walnuts, brown sugar cream cheese frosting. Contains nuts.' },
    { value: 'chocolate-olive-oil', name: 'Chocolate olive oil (vegan)', description: 'Our dairy-free, egg-free chocolate cake, layered with dark chocolate ganache made with oat cream.' },
    { value: 'fig-honey', name: 'Fig, honey & pistachio', description: 'Honey sponge, fresh figs, pistachio cream. Our wedding favorite. Contains nuts.', season: 'August to October' },
];

export const pickups: Option[] = [
    { value: 'morning', label: 'Pick up, 8–11am' },
    { value: 'afternoon', label: 'Pick up, 11am–2pm' },
    { value: 'delivery', label: 'Deliver it (weddings and events within 15 miles)' },
];

/** The fewest days' notice for an order, by size. */
export const leadTimes = [
    { what: 'Cakes up to 10 inches', notice: '5 days' },
    { what: 'Two-tier cakes', notice: '3 weeks, with a tasting' },
    { what: 'Three-tier and wedding cakes', notice: '6 weeks, with a tasting' },
    { what: 'Twelve or more of any one pastry', notice: '48 hours' },
];

/** Photos for the cake pages. */
export const cakePhotos: PhotoName[] = ['layerCake', 'weddingCake', 'cakeSlice'];
