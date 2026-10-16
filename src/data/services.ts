/**
 * The services, for the lists that show them all: the home page, /services/,
 * the quote form's dropdown and each town page. Each service also has its own
 * page, src/pages/services/<slug>.astro, written by hand; the audit fails the
 * build if a slug here has no page (its link would be broken).
 */
import type { IconName } from '../components/Icon.astro';

export interface Service {
    slug: string;
    name: string;
    /** One sentence, for a card. */
    summary: string;
    icon: IconName;
}

export const services: Service[] = [
    { slug: 'repairs', name: 'Repairs and troubleshooting', summary: 'Dead outlets, tripping breakers, flickering lights: found and fixed, usually in one visit.', icon: 'wrench' },
    { slug: 'panel-upgrades', name: 'Panel upgrades', summary: 'A 200-amp panel with room for a heat pump, an EV charger and whatever comes next.', icon: 'panel' },
    { slug: 'ev-chargers', name: 'EV charger installation', summary: 'Level 2 home charging, sized to your panel and permitted properly.', icon: 'car' },
    { slug: 'rewiring', name: 'Home rewiring', summary: 'Knob-and-tube, aluminum and tired wiring replaced with as little disruption as we can manage.', icon: 'home' },
    { slug: 'lighting', name: 'Lighting', summary: 'Recessed lights, fans, outdoor and landscape lighting, dimmers that do not buzz.', icon: 'bulb' },
    { slug: 'generators', name: 'Standby generators', summary: 'Whole-home backup that starts by itself when the power goes out.', icon: 'battery' },
    { slug: 'inspections', name: 'Electrical inspections', summary: 'For buyers, sellers, insurers and anyone who has never had one: a written report with photos.', icon: 'clipboard' },
    { slug: 'smart-home', name: 'Smart home and data wiring', summary: 'Smart switches, doorbells, Wi-Fi access points and network cabling, neatly done.', icon: 'wifi' },
];

export const serviceUrl = (slug: string) => `/services/${slug}/`;
