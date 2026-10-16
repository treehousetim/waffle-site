/**
 * The people behind the counter, for /bakers/ and the home page. Fictional,
 * like the bakery: replace every one with the real team (with their
 * permission, and their own words).
 */
export interface Baker {
    name: string;
    role: string;
    /** Since when. */
    since: number;
    /** What they make, in a few words. */
    makes: string;
    bio: string;
    /** Their bake, if they had to choose one. */
    favourite: string;
    doodle: 'loaf' | 'boule' | 'croissant' | 'cup' | 'whisk' | 'slice' | 'wheat';
}

export const bakers: Baker[] = [
    {
        name: 'Hattie Marsh',
        role: 'Founder and head baker',
        since: 2014,
        makes: 'The sourdough, and the schedule',
        bio: 'Hattie baked bread in her apartment for six years before she baked it for anyone else. She started Crumb & Kettle with one deck oven, a borrowed mixer and a starter she still feeds every night at nine. She mixes the first dough at four.',
        favourite: 'Country sourdough, the heel, with salted butter',
        doodle: 'boule',
    },
    {
        name: 'Teo Albarran',
        role: 'Pastry',
        since: 2017,
        makes: 'Croissants, danishes, knots',
        bio: 'Teo came for one summer to help with the laminating and never left. He keeps the butter at exactly the right temperature by feel, and the croissant dough on a three-day rhythm that he defends against all comers.',
        favourite: 'Kouign-amann, still warm',
        doodle: 'croissant',
    },
    {
        name: 'Priya Okafor',
        role: 'Cakes and celebration orders',
        since: 2019,
        makes: 'Every birthday and wedding cake',
        bio: 'Priya answers every cake order herself. She will talk you out of fondant and into seasonal fruit, and she has never once missed a pickup time. Her lemon drizzle recipe is the one on the counter.',
        favourite: 'Brown butter and pear layer cake',
        doodle: 'whisk',
    },
    {
        name: 'Sam Lindqvist',
        role: 'Front of house and coffee',
        since: 2021,
        makes: 'Your flat white, and the chai',
        bio: 'Sam runs the counter, the coffee bar and the queue on a Saturday, which is the hardest job in the building. Sam picks the filter of the week and simmers the chai on the stove from whole spices each morning.',
        favourite: 'A cardamom knot and a black filter',
        doodle: 'cup',
    },
    {
        name: 'June Abernathy',
        role: 'Wholesale and the early van',
        since: 2016,
        makes: 'Deliveries before dawn',
        bio: 'June packs the wholesale orders at five and has the van on the road by half past, so the cafés we bake for open with bread that was in the oven an hour before. She knows every back door between here and Upper Wending.',
        favourite: 'Seeded rye, toasted, with honey',
        doodle: 'loaf',
    },
];
