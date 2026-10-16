/**
 * What customers said, with their permission, for the reviews page, the home
 * page and the town pages. Example reviews: replace them with real ones.
 *
 * Shown as text only, never as star-rating structured data: search engines
 * do not allow a business to mark up reviews of itself on its own site.
 */
import type { Testimonial } from '../components/Testimonials.astro';

export interface Review extends Testimonial {
    town: string;
    service: string;
}

const review = (quote: string, name: string, town: string, service: string): Review => ({
    quote,
    name,
    town,
    service,
    role: `${town} · ${service}`,
});

export const reviews: Review[] = [
    review('Our breakers kept tripping every time the dryer ran. They found a failing breaker and a shared circuit in under an hour, and the price was exactly what they quoted.', 'Dana R.', 'Springfield', 'Repairs'),
    review('Upgraded our 100-amp panel to 200 so we could add a heat pump. Permit, inspection and the utility were all handled. The power was off for less than a day.', 'Miguel and Ana T.', 'Riverside', 'Panel upgrade'),
    review('Clear quote for the EV charger, showed up on time, and the install is tidier than the one at my office. Charging overnight now with no issues.', 'Priya S.', 'Fairview', 'EV charger'),
    review('Called at 11pm with a burning smell from an outlet. Someone was here in 40 minutes, made it safe, and came back the next morning to replace the wiring.', 'Tom W.', 'Oakdale', 'Emergency call-out'),
    review('Our 1940s house still had knob-and-tube in the upstairs. They rewired three bedrooms in four days and patched every hole they made.', 'Hannah L.', 'Springfield', 'Rewiring'),
    review('Ten recessed lights in the kitchen and living room, all on dimmers that actually dim smoothly. Clean work and they vacuumed before leaving.', 'Chris P.', 'Millbrook', 'Lighting'),
    review('The pre-purchase inspection found a double-tapped breaker and an ungrounded bathroom circuit. We used the report to negotiate the repairs into the sale.', 'Jordan K.', 'Lakewood', 'Inspection'),
    review('Standby generator went in before the winter storms. When the power went out for two days in January, the house never noticed.', 'Ruth and Ed M.', 'Riverside', 'Generator'),
    review('They ran network cable to every room and put a proper access point on each floor. Video calls finally work from the back bedroom.', 'Sam O.', 'Fairview', 'Data wiring'),
];

export const reviewsFrom = (town: string) => reviews.filter((item) => item.town === town);
