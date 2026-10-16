/**
 * The food trucks that park on Foundry Row through the week. The taproom
 * serves no kitchen food of its own (pretzels and snacks at the bar), and
 * you are welcome to bring your own or order in. Invented, like everything
 * else here: replace with the real rota.
 */
export interface Truck {
    day: string;
    name: string;
    food: string;
}

export const trucks: Truck[] = [
    { day: 'Wednesday', name: 'Ferry Street Pierogi Wagon', food: 'Hand-pinched pierogi, kielbasa, sauerkraut' },
    { day: 'Thursday', name: 'La Plancha', food: 'Tacos al pastor, quesabirria, elote' },
    { day: 'Friday', name: 'Smoke Signal BBQ', food: 'Brisket, pulled pork, smoked wings, mac and cheese' },
    { day: 'Saturday', name: 'Ember & Crust', food: 'Wood-fired pizza from a trailer oven' },
    { day: 'Sunday', name: 'Rotating guest truck', food: 'Check the events page for who is parked up' },
];
