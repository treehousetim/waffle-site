/**
 * What the site says about each package, beyond what the waffle app holds.
 *
 * The app (GET /api/site/packages, src/lib/packages.ts) is the source of the
 * packages themselves: which there are, their names, prices by vehicle size,
 * durations and what is included. This file holds the words a page needs
 * around them: who a package is for, how the visit goes, its questions. A
 * package the app lists with no copy here fails the build (src/lib/catalog.ts),
 * so a new package cannot go live with an empty page.
 *
 * Each package's page is /packages/<slug>/, built by
 * src/pages/packages/[slug].astro.
 */
import type { PhotoName } from './photos';

export interface PackageCopy {
    slug: string;
    /** The page's <title>, before the site name: under about 50 characters. */
    title: string;
    /** The search-result description: 50-160 characters. */
    description: string;
    /** Above the headline, in the mono spec style: "01 / Exterior". */
    kicker: string;
    headline: string;
    lead: string;
    photo: PhotoName;
    /** A second photo for the page's body. */
    detailPhoto: PhotoName;
    bestFor: string[];
    /** How the visit goes, step by step. */
    visit: { title: string; text: string }[];
    /** What we need from the customer, said plainly. */
    needs: string[];
    /** How long it lasts, or how often to book it. */
    cadence: string;
    faq: { question: string; answer: string }[];
}

export const packageCopy: PackageCopy[] = [
    {
        slug: 'express-wash',
        title: 'Express mobile hand wash',
        description: 'A scratch-safe hand wash at your home or office in Port Alder: snow foam, two buckets, deionised rinse, wheels and glass. Under an hour.',
        kicker: '01 / Maintenance',
        headline: 'A proper hand wash, in under an hour',
        lead: 'The wash that keeps a good finish good. Foam first, two buckets, a spot-free rinse and a dry that never drags grit across the paint.',
        photo: 'foamGreySuv',
        detailPhoto: 'tireBrush',
        bestFor: [
            'Keeping a detailed or coated car looking detailed',
            'A fortnightly or monthly visit while the car is parked at work',
            'Anyone who has stopped using the drive-through for the sake of their paint',
        ],
        visit: [
            { title: 'Foam', text: 'Snow foam softens road film and lifts grit so the mitt never grinds it in.' },
            { title: 'Wash', text: 'Top down, two buckets with grit guards, a fresh mitt for the lower panels.' },
            { title: 'Rinse', text: 'Deionised water from the van’s tank: no minerals, so no spots as it dries.' },
            { title: 'Dry', text: 'Filtered air into mirrors, badges and seams, then one gentle microfiber pass.' },
        ],
        needs: [
            'Nothing: we bring our own water and power.',
            'Room to walk all the way round the car: about three feet on each side.',
        ],
        cadence: 'Every two to four weeks keeps most cars looking freshly detailed.',
        faq: [
            { question: 'Do you need my hose or an outside outlet?', answer: 'No. Every van carries 120 gallons of deionised water and its own quiet inverter generator. We use nothing from your house.' },
            { question: 'Is a hand wash really gentler than a drive-through?', answer: 'Yes. Most swirl marks come from brushes and dirty cloths dragging grit across the clear coat. Foam, two buckets and clean microfiber are how we avoid putting them there.' },
            { question: 'Can you wash the car while I am at work?', answer: 'Yes, if your building lets us. Leave the car unlocked or not, as you like: the Express Wash is exterior only.' },
        ],
    },
    {
        slug: 'full-detail',
        title: 'Full mobile car detail',
        description: 'Inside and out at your driveway: decontaminated, sealed paint and a vacuumed, steamed, wiped-down cabin. Mobile full detailing in Port Alder.',
        kicker: '02 / Inside and out',
        headline: 'The whole car, inside and out',
        lead: 'Our most booked visit. The paint is washed, decontaminated and sealed for about three months; the cabin is vacuumed, steamed and wiped down to the rails.',
        photo: 'handWaxGarage',
        detailPhoto: 'dashboardBrush',
        bestFor: [
            'A twice-a-year reset for a car that is used every day',
            'Getting a car ready to sell, or to hand back at the end of a lease',
            'The first visit before switching to regular Express Washes',
        ],
        visit: [
            { title: 'Walkaround', text: 'We look over the car with you, note chips and scratches, and agree what matters most.' },
            { title: 'Exterior', text: 'Foam, two-bucket wash, iron remover and clay to pull out what washing leaves behind.' },
            { title: 'Seal', text: 'A spray sealant that beads water and makes the next wash easier.' },
            { title: 'Cabin', text: 'Vacuum, steam, trim and glass, while the sealant cures outside.' },
        ],
        needs: [
            'The car unlocked, or the key, and personal things out of the cabin.',
            'Four to five hours of the car staying put.',
        ],
        cadence: 'Twice a year for most cars, with Express Washes in between.',
        faq: [
            { question: 'What is clay bar decontamination?', answer: 'A soft clay that glides over lubricated paint and picks up bonded grit, tar and rail dust a wash cannot. Paint feels glass-smooth afterwards, and sealant bonds better to it.' },
            { question: 'Will it remove scratches?', answer: 'No. A full detail cleans and protects. Swirls and scratches need machine polishing: see paint correction.' },
            { question: 'Do I need to be home?', answer: 'Only at the start and the end. Most customers leave us the key and carry on with their day.' },
        ],
    },
    {
        slug: 'interior-deep-clean',
        title: 'Interior deep clean, at your door',
        description: 'Hot-water extraction, steam and leather care in your driveway: seats, carpets, vents and odors properly dealt with. Mobile interior detailing.',
        kicker: '03 / Cabin',
        headline: 'A cabin that smells like nothing at all',
        lead: 'For the car that carries kids, dogs, gym bags and lunch. Seats and carpets are extracted with hot water, every hard surface is steamed, and odors are treated, not perfumed.',
        photo: 'quiltedInterior',
        detailPhoto: 'redBlackInterior',
        bestFor: [
            'Family cars, after a summer of road trips',
            'Pet hair, spills and anything that has soaked into a seat',
            'A used car you have just bought and want to make your own',
        ],
        visit: [
            { title: 'Empty', text: 'Mats out, compressed air through every seam, rail and vent.' },
            { title: 'Extract', text: 'Hot water and a gentle shampoo flushed through fabric and pulled back out.' },
            { title: 'Steam', text: 'Consoles, cupholders, buttons and door cards, without soaking electronics.' },
            { title: 'Finish', text: 'Leather conditioned, enzyme odor treatment, glass and screens, doors open to dry.' },
        ],
        needs: [
            'The cabin emptied of personal things, child seats included if you can.',
            'About three to four hours, and a dry spell for the doors to stand open.',
        ],
        cadence: 'Once or twice a year, or whenever something spills.',
        faq: [
            { question: 'How long do the seats take to dry?', answer: 'Our extractor pulls most of the water back out, so cloth seats are usually dry to the touch in two to four hours, faster with the windows cracked.' },
            { question: 'Can you get rid of smoke smell?', answer: 'We can make a big difference with extraction, steam and an enzyme treatment, but heavy smoke soaks into the headliner and vents. We will tell you honestly what to expect before we start.' },
            { question: 'Do you take child seats out?', answer: 'We would rather you did, so they go back in exactly as you fit them. We can clean the seats themselves while they are out.' },
        ],
    },
    {
        slug: 'paint-correction',
        title: 'Paint correction and swirl removal',
        description: 'Machine polishing that removes swirls, haze and light scratches from your paint, measured and inspected under lights. Mobile, at your home.',
        kicker: '04 / Correction',
        headline: 'Swirls out, depth back',
        lead: 'Those spiderwebs you see in the sun are thousands of fine scratches in the clear coat. We level them out with machine polish, a few microns at a time, and check our work under our own lights.',
        photo: 'polisherBlueHood',
        detailPhoto: 'polisherCloseup',
        bestFor: [
            'Dark paint that looks grey and webbed in direct sun',
            'Cars that have been through years of brush washes',
            'The step before a ceramic coating, so the coating locks in a flawless finish',
        ],
        visit: [
            { title: 'Measure', text: 'Paint depth gauge on every panel, so we know how much clear coat there is to work with.' },
            { title: 'Prepare', text: 'Wash, iron, clay, then trim and edges taped so polish never stains them.' },
            { title: 'Correct', text: 'Compound to cut the defects, polish to refine, panel by panel under LED inspection lights.' },
            { title: 'Reveal', text: 'A panel wipe strips any oils, so what you see is the paint itself, then sealant on top.' },
        ],
        needs: [
            'A garage, carport or shaded spot: polish cannot be worked in direct sun or rain.',
            'A full day, sometimes two for a large or badly marked car.',
        ],
        cadence: 'Once, done right. Careful washing keeps it that way.',
        faq: [
            { question: 'Will it remove every scratch?', answer: 'Anything your fingernail does not catch on usually comes out. Deeper scratches can often be softened, but we will not polish through clear coat to chase one. We measure first and tell you what is realistic.' },
            { question: 'Can you do this outside?', answer: 'Under cover, yes. Polish dries too fast in direct sun and rain spoils the panel wipe. A garage, carport or a shaded office parking structure works well.' },
            { question: 'Is a one-step or a two-step correction better?', answer: 'It depends on the paint. Many cars look superb after a single polishing step. We test a section and show you before deciding.' },
        ],
    },
    {
        slug: 'ceramic-coating',
        title: 'Ceramic coating, applied at home',
        description: 'A five-year ceramic coating on paint, wheels and glass, applied in your garage after a polish and cured under infrared lamps. Port Alder.',
        kicker: '05 / Protection',
        headline: 'Five years of slick, glassy protection',
        lead: 'A ceramic coating is a hard, clear layer that bonds to your clear coat. Water sheets off, dirt lets go in a gentle wash, and the gloss stays deep. We polish first, then coat and cure on site.',
        photo: 'microfiberBlueHood',
        detailPhoto: 'redCoupeRain',
        bestFor: [
            'New cars, before the first winter on salted roads',
            'Owners who want washing to be quick and easy for years',
            'Cars that have just had paint correction',
        ],
        visit: [
            { title: 'Polish', text: 'A full decontamination and a one-step polish, because a coating seals in whatever is underneath.' },
            { title: 'Prep', text: 'A panel wipe removes every trace of oil so the coating bonds to bare clear coat.' },
            { title: 'Coat', text: 'Applied panel by panel in good light, then levelled before it flashes.' },
            { title: 'Cure', text: 'Infrared lamps set the first layer; it is rain-ready by the next morning.' },
        ],
        needs: [
            'A garage or covered space for the two days, with the car kept dry overnight.',
            'No washing for a week afterwards while the coating fully hardens.',
        ],
        cadence: 'Rated for five years with proper washing. We check it at three months, free.',
        faq: [
            { question: 'Does a coating mean I never wash the car?', answer: 'No. It means washing is quick and dirt lets go easily. Dirt still lands on it, and a coating still needs gentle, regular washing to keep performing.' },
            { question: 'Will a coating stop stone chips?', answer: 'No. It resists light marring, chemical stains and UV, but it is microns thick. For chips, ask about paint protection film.' },
            { question: 'Why do you need a garage?', answer: 'The coating must stay dry for the first night while it cures. A garage, carport or covered parking spot is enough.' },
        ],
    },
];
