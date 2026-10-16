/**
 * The core range: the beers brewed all year, each with its own page at
 * /beers/<slug>/ (src/pages/beers/[slug].astro). What is pouring today comes
 * from the waffle app's tap list instead (src/lib/taplist.ts); a tap that
 * pours one of these names its slug, and the tap board links here.
 *
 * `tone` picks the can's label colours (src/components/CanCard.astro): the
 * site writes no inline styles, so a beer chooses from a fixed set.
 */
import type { PhotoName } from './photos';

export type CanTone = 'gold' | 'amber' | 'haze' | 'stout' | 'copper' | 'straw';

export interface Beer {
    slug: string;
    name: string;
    style: string;
    abv: number;
    ibu: number;
    tone: CanTone;
    /** One line, for cards and the page's description. */
    summary: string;
    /** Why it is called what it is called, and how it came about. */
    story: string[];
    notes: { aroma: string; palate: string; finish: string };
    malts: string[];
    hops: string[];
    yeast: string;
    glass: string;
    /** Serving temperature, °F. */
    serveAt: number;
    pairings: string[];
    available: string;
    photo: PhotoName;
}

export const beers: Beer[] = [
    {
        slug: 'pour-line-pilsner',
        name: 'Pour Line Pilsner',
        style: 'Czech-style pilsner',
        abv: 4.9,
        ibu: 34,
        tone: 'gold',
        summary: 'Soft bready malt, spicy Saaz and a long dry snap. Lagered six weeks, and worth every one of them.',
        story: [
            'The pour line was the channel cut into the foundry floor that carried molten iron from the cupola to the moulds. It is still there, under the epoxy, running straight past the bar. It seemed the right name for the beer we pour more of than any other.',
            'Pour Line is brewed the slow way: a decoction mash, where part of the mash is pulled off and boiled, then returned, and six weeks of cold conditioning in the tank before it goes anywhere near a keg. It takes three times as long to make as an IPA, and it is the beer our brewers drink after a shift.',
        ],
        notes: {
            aroma: 'Fresh bread crust, wildflower honey and a peppery, herbal hop lift.',
            palate: 'Round and soft up front, then crisp; carbonation fine enough to feel like silk.',
            finish: 'Dry, clean, with a firm bitter snap that asks for the next sip.',
        },
        malts: ['Floor-malted Bohemian pilsner'],
        hops: ['Saaz, in three additions'],
        yeast: 'Czech lager yeast, fermented at 50°F',
        glass: 'Tall tapered pils glass',
        serveAt: 42,
        pairings: ['Pierogi with brown butter', 'Fried perch on Fridays', 'A warm pretzel and mustard'],
        available: 'Year round, on tap and in 16 oz cans',
        photo: 'goldenPour',
    },
    {
        slug: 'cupola-ipa',
        name: 'Cupola IPA',
        style: 'West Coast IPA',
        abv: 6.8,
        ibu: 62,
        tone: 'amber',
        summary: 'Pine resin, pink grapefruit and a dry, assertive bitterness. Clear, bright and unapologetic.',
        story: [
            'The cupola was the tall furnace at the north end of the foundry, where pig iron, scrap and coke went in at the top and liquid iron came out of the bottom. It ran hotter than anything else in the building, and so does this beer.',
            'Cupola is our answer to the hazy wave: a clear, dry, properly bitter IPA in the style the West Coast made famous. A lean malt bill, a big addition of hops in the whirlpool and two rounds of dry hopping, with the yeast dropped out cold so it pours bright.',
        ],
        notes: {
            aroma: 'Pine needles, grapefruit pith, a little tangerine and dank resin.',
            palate: 'Light caramel at the edges, then a wave of citrus and pine.',
            finish: 'Bone dry, bitter and lingering. No sweetness to hide behind.',
        },
        malts: ['Two-row pale', 'A touch of light crystal', 'Dextrose, to dry it out'],
        hops: ['Columbus', 'Centennial', 'Simcoe', 'Chinook'],
        yeast: 'Clean American ale yeast',
        glass: 'Nonic pint',
        serveAt: 45,
        pairings: ['Smash burgers', 'Spicy fried chicken', 'Sharp cheddar'],
        available: 'Year round, on tap and in 16 oz cans',
        photo: 'tapPour',
    },
    {
        slug: 'tamsen-haze',
        name: 'Tamsen Haze',
        style: 'hazy pale ale',
        abv: 5.6,
        ibu: 28,
        tone: 'haze',
        summary: 'Mango, orange juice and a pillowy oat body, named for the fog that sits on the river most mornings.',
        story: [
            'Most mornings from September to May, a fog lifts off the Tamsen River and sits in the valley until about ten. You can watch it from the brewhouse windows while the mash is resting. This beer looks like it.',
            'Tamsen Haze is soft rather than bitter: oats and wheat for body, hops added late and after fermentation for juice, and a yeast that leaves a little stone fruit of its own. It is the beer we hand to people who say they do not like hoppy beer, and it usually changes their mind.',
        ],
        notes: {
            aroma: 'Ripe mango, orange juice, a little peach and fresh-cut grass.',
            palate: 'Pillowy and smooth from the oats; juicy without being sweet.',
            finish: 'Soft, gentle bitterness, gone quickly. Dangerously drinkable.',
        },
        malts: ['Two-row pale', 'Malted oats', 'Flaked oats', 'White wheat'],
        hops: ['Citra', 'Mosaic', 'El Dorado'],
        yeast: 'London ale yeast, fermented warm for fruit',
        glass: 'Stemmed tulip',
        serveAt: 44,
        pairings: ['Fish tacos', 'Thai green curry', 'Goat cheese salad'],
        available: 'Year round, on tap and in 16 oz cans',
        photo: 'hazyFlight',
    },
    {
        slug: 'cast-iron-stout',
        name: 'Cast Iron Stout',
        style: 'oatmeal stout',
        abv: 6.2,
        ibu: 38,
        tone: 'stout',
        summary: 'Dark chocolate, roast coffee and a velvet oat body. Black as the foundry sand, poured on nitro.',
        story: [
            'The foundry cast stoves for most of the Ohio valley for forty years, in black iron that the sand moulds left rough and dark. Cast Iron is the beer of that colour: opaque, heavy-looking, and a lot gentler than it appears.',
            'Seven malts go into it, including a generous dose of oats for the velvet and a pinch of black malt for the coffee-ground edge. It pours on nitrogen, so it cascades in the glass and settles under a tight tan head. Give it a minute before you drink it. It is worth the wait.',
        ],
        notes: {
            aroma: 'Dark chocolate, fresh espresso, toasted bread and a hint of dried fig.',
            palate: 'Velvety and full from the oats and the nitro pour; roast without harshness.',
            finish: 'Dry cocoa and coffee, a gentle bitterness that fades slowly.',
        },
        malts: ['Maris Otter', 'Flaked oats', 'Chocolate malt', 'Roasted barley', 'Black malt', 'Crystal 60', 'Brown malt'],
        hops: ['East Kent Goldings', 'Fuggle'],
        yeast: 'English ale yeast',
        glass: 'Imperial pint, on nitro',
        serveAt: 50,
        pairings: ['Oysters, if a truck has them', 'Beef chili', 'Chocolate anything'],
        available: 'Year round, on nitro tap; cans in winter',
        photo: 'hopTasters',
    },
    {
        slug: 'ferrymans-rye',
        name: "Ferryman's Rye",
        style: 'rye amber ale',
        abv: 5.4,
        ibu: 30,
        tone: 'copper',
        summary: 'Toffee, rye-bread spice and a dry, peppery finish. The colour of the old ferry rope, and as reliable.',
        story: [
            'Before the iron bridge went up in 1902, the only way across the Tamsen at Wrenford was the rope ferry that ran from the foot of Foundry Row. The ferry house is a bakery now. The rope is coiled above our bar.',
            'Ferryman’s is a rye amber: a fifth of the grist is malted rye, which brings a peppery, slightly oily spice and a long dry finish to the caramel of the crystal malts. It is the beer we brew for autumn, and that people ask for all year, so we stopped arguing.',
        ],
        notes: {
            aroma: 'Toffee, rye bread, a little orange peel and black pepper.',
            palate: 'Medium body, caramel balanced by grainy rye spice.',
            finish: 'Dry and peppery, with a light, earthy hop bitterness.',
        },
        malts: ['Two-row pale', 'Malted rye', 'Crystal 40', 'Crystal 120', 'Biscuit malt'],
        hops: ['Northern Brewer', 'Willamette'],
        yeast: 'Clean American ale yeast',
        glass: 'Nonic pint',
        serveAt: 48,
        pairings: ['Smoked brisket', 'Roast chicken', 'Apple pie with cheddar'],
        available: 'Year round, on tap',
        photo: 'flightSteel',
    },
    {
        slug: 'bellows-saison',
        name: 'Bellows Saison',
        style: 'farmhouse saison',
        abv: 6.1,
        ibu: 26,
        tone: 'straw',
        summary: 'Peppery, lemony and bone dry, with a fizz like a struck match. A farmhouse beer for a factory floor.',
        story: [
            'Bellows fed air to the cupola, and the cupola fed the foundry. Ours fed the brewery: Bellows was the first beer we sold, out of a garage in 2016, and it paid for the first fermenter.',
            'It is a saison: brewed with a temperamental Belgian farmhouse yeast that we let run hot, so it throws pepper, lemon and clove and ferments almost every sugar there is. The result is very dry, very lively and much more refreshing than its strength suggests.',
        ],
        notes: {
            aroma: 'Cracked black pepper, lemon zest, clove and a little hay.',
            palate: 'Light, effervescent, with a soft wheat body and citrus.',
            finish: 'Bone dry and spritzy, with a gentle herbal bitterness.',
        },
        malts: ['Pilsner malt', 'Wheat malt', 'Spelt', 'A little Munich'],
        hops: ['Saaz', 'Styrian Goldings'],
        yeast: 'Belgian farmhouse yeast, fermented up to 90°F',
        glass: 'Stemmed tulip',
        serveAt: 46,
        pairings: ['Mussels and fries', 'Herby roast pork', 'A cheese board with soft goat cheese'],
        available: 'Year round, on tap and in 750 ml bottles',
        photo: 'brewersTasting',
    },
];

export const beerUrl = (slug: string) => `/beers/${slug}/`;

export const beerBySlug = (slug: string | null) => (slug === null ? undefined : beers.find((beer) => beer.slug === slug));

/** "4.9%", the way it is printed everywhere. */
export const abv = (value: number) => `${value.toFixed(1)}%`;
