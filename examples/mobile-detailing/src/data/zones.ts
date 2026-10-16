/**
 * The service zones: the parts of Port Alder the vans drive to on set days.
 * Each has its own page, /zones/<slug>/ (src/pages/zones/[slug].astro), and
 * each page says something true about detailing there and nowhere else: the
 * salt air, the slopes, the lake rules, the parking. A zone page that only
 * swaps the name is a doorway page, and search engines rank none of them
 * (docs/pages.md, "Town pages"). If you cannot say something particular
 * about a zone, list it on /zones/ and give it no page.
 *
 * `map` places the zone on the SVG map (viewBox 0 0 800 520) drawn by
 * src/components/ZoneMap.astro.
 */
import type { PhotoName } from './photos';

export interface Zone {
    slug: string;
    name: string;
    /** The page's <title> and description. */
    title: string;
    description: string;
    /** One line for lists. */
    summary: string;
    /** When the vans are there. */
    days: string;
    photo: PhotoName;
    lead: string;
    /** The particular things about detailing here. */
    facts: { title: string; text: string }[];
    /** Where the van parks, said plainly. */
    parking: string;
    /** The package that suits the zone best, by slug. */
    suggested: string;
    map: { points: string; label: [number, number]; stop: [number, number] };
}

export const zones: Zone[] = [
    {
        slug: 'old-harbor',
        name: 'Old Harbor',
        title: 'Mobile detailing in Old Harbor',
        description: 'Mobile car detailing in Old Harbor, Port Alder: salt-air protection, a compact van for the narrow lanes, and Tuesday and Friday visits.',
        summary: 'Salt air, narrow lanes, permit parking. We send the short van.',
        days: 'Tuesdays and Fridays',
        photo: 'redCoupeRain',
        lead: 'Living by the water is lovely for people and hard on paint. Salt mist settles on everything parked near the quays, and it does its work slowly and quietly.',
        facts: [
            { title: 'Salt never sleeps', text: 'Within six blocks of the waterfront, a film of salt lands on cars every night the wind comes off the bay. We recommend a sealant top-up every three months here, not six, and an iron decontamination twice a year.' },
            { title: 'The short van', text: 'The lanes between Wharf Street and the old cannery are one-way and too tight for our long-wheelbase van. Old Harbor gets the compact van, which carries the same water and power in a shorter body.' },
            { title: 'Underneath matters too', text: 'Salt collects in wheel arches and sills, out of sight. Every Old Harbor wash includes a low-pressure rinse of the arches at no extra charge.' },
        ],
        parking: 'Most of Old Harbor is resident permit parking. We need your driveway or a legal curb space of about 24 feet next to the car; if you have a visitor permit, leave it on the dash for us.',
        suggested: 'full-detail',
        map: { points: '150,300 300,288 332,420 186,470 118,398', label: [158, 444], stop: [250, 334] },
    },
    {
        slug: 'cinder-hill',
        name: 'Cinder Hill',
        title: 'Mobile car detailing on Cinder Hill',
        description: 'Car detailing on Cinder Hill’s steep driveways: we park at the curb, run long hoses to you, and remove the linden sap that falls each summer.',
        summary: 'Steep driveways and summer tree sap. We park below and bring the hoses up.',
        days: 'Mondays and Thursdays',
        photo: 'garageBlackCoupe',
        lead: 'The views are the reason people live on Cinder Hill. The driveways are the reason we plan every visit there a little differently.',
        facts: [
            { title: 'We stay at the curb', text: 'A van carrying 120 gallons of water should not stand on a steep slope. On Cinder Hill we park level at the street and run our 100-foot hose and power reels up to your car.' },
            { title: 'Linden sap season', text: 'The old lindens along Ember Avenue and the upper crescents drip sticky honeydew from late June into August. Left in the sun it etches clear coat. We dissolve it with a sap remover rather than scrubbing it off.' },
            { title: 'Wash downhill, not on the car below', text: 'We lay a runoff mat at the foot of the driveway, so our water does not run down onto your neighbor’s car or the street.' },
        ],
        parking: 'We need a level space at the curb within 100 feet of the car. If your driveway is shared, let us know who else uses it so we keep it clear.',
        suggested: 'express-wash',
        map: { points: '160,92 320,70 342,200 300,272 170,250', label: [186, 128], stop: [268, 204] },
    },
    {
        slug: 'brightwater',
        name: 'Brightwater',
        title: 'Lakeside mobile detailing in Brightwater',
        description: 'Car detailing in Brightwater without a drop reaching the lake: water-reclaim mats, deionised rinse water, and visits every Wednesday and Saturday.',
        summary: 'Lake rules: no wash water down the drains. We catch every drop.',
        days: 'Wednesdays and Saturdays',
        photo: 'microfiberBlueHood',
        lead: 'Every storm drain in Brightwater runs straight into the lake, and the homeowners’ association takes that seriously. So do we.',
        facts: [
            { title: 'Every drop caught', text: 'In Brightwater we wash on a bermed reclaim mat. A pump lifts the used water back into a holding tank on the van, and we take it away for proper disposal. Nothing reaches the drains.' },
            { title: 'Hard water, soft finish', text: 'Lakeside homes here draw from wells with very hard water, which leaves white spots as it dries. We never use it: the rinse comes from the van’s deionised tank.' },
            { title: 'Cottonwood fluff', text: 'In late May the cottonwoods by the shore shed for two weeks. It sticks to wet paint and clogs cowl drains, so we clear the cowl and door drains on every visit in that season.' },
        ],
        parking: 'Your driveway is perfect. If you park on the shared lane by the water, we will need room for the mat beside the car: roughly a car-width.',
        suggested: 'ceramic-coating',
        map: { points: '560,62 760,82 750,252 590,242 556,160', label: [578, 104], stop: [616, 216] },
    },
    {
        slug: 'fenwick-park',
        name: 'Fenwick Park',
        title: 'Driveway car detailing in Fenwick Park',
        description: 'Car detailing on Fenwick Park driveways: family SUVs, interiors after the school run, and Saturday slots that book up two weeks ahead.',
        summary: 'Wide driveways, family SUVs, busy Saturdays. Book a fortnight out.',
        days: 'Thursdays and Saturdays',
        photo: 'quiltedInterior',
        lead: 'Fenwick Park is where we do the most interiors. Wide driveways, garages with room to work, and SUVs that have done a lot of school runs.',
        facts: [
            { title: 'Saturdays go fast', text: 'Fenwick Park Saturdays are our busiest day anywhere in the city. They usually book up two weeks ahead; Thursday daytime slots are much easier to get.' },
            { title: 'Room to do it properly', text: 'Most homes here have a two- or three-car garage, which is ideal for paint correction and ceramic coatings that need cover and a dry night to cure.' },
            { title: 'Two cars, one visit', text: 'Book two cars at the same address on the same day and the second is 10% off. We see it most here, where the family car and the commuter share a driveway.' },
        ],
        parking: 'Your driveway, with the car pulled forward so we can walk all the way around it. A garage is a bonus for coatings and correction.',
        suggested: 'interior-deep-clean',
        map: { points: '420,300 640,290 700,440 480,482 400,420', label: [452, 452], stop: [528, 338] },
    },
    {
        slug: 'northgate',
        name: 'Northgate Business Park',
        title: 'Office parking lot detailing in Northgate',
        description: 'We detail your car in the Northgate Business Park lot while you work, Tuesday to Thursday, with building permission arranged. Fleet days too.',
        summary: 'Office lots, Tuesday to Thursday. Your car is done by five.',
        days: 'Tuesdays to Thursdays',
        photo: 'vanOfficeEntrance',
        lead: 'The easiest car to detail is one that is going to sit still for eight hours. In Northgate, that is most of them.',
        facts: [
            { title: 'Done while you work', text: 'Drop your key at reception or leave the car unlocked, carry on with your day, and find it finished in the same space by five. Nothing about it needs you.' },
            { title: 'We ask the building first', text: 'Several Northgate landlords require contractors to be approved and insured on site. We hold certificates for the main buildings already, and arrange it with facilities for any we have not worked at before.' },
            { title: 'Office days for the whole team', text: 'When five or more people in one building book the same day, we bring two vans and everyone gets 15% off. It is how most of our fleet accounts started.' },
        ],
        parking: 'Your usual space, as long as there is about three feet clear on each side. Underground structures with less than 7 feet of clearance are out of reach for the van: tell us and we will find a surface spot with you.',
        suggested: 'express-wash',
        map: { points: '360,40 520,40 540,150 382,170', label: [392, 76], stop: [470, 132] },
    },
];

export const zoneNames = zones.map((zone) => zone.name);
export const zoneUrl = (slug: string) => `/zones/${slug}/`;

/** The yard the vans leave from, on the map. */
export const yard: [number, number] = [372, 246];
