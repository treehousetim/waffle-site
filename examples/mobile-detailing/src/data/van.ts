/**
 * What every van carries, and the four steps of a visit: shared by the
 * home page, How it works and About. Example details for a fictional crew;
 * replace them with the real kit and process.
 */
import type { IconName } from '../components/Icon.astro';

export const kit: { icon: IconName; name: string; spec: string; text: string }[] = [
    { icon: 'drop', name: 'Deionised water', spec: '120 gal', text: 'Filtered through resin until nothing is dissolved in it, so it dries without a single spot.' },
    { icon: 'bolt', name: 'Inverter generator', spec: '3.5 kW', text: 'Quieter than a conversation at the curb. We never ask for your outlet.' },
    { icon: 'recycle', name: 'Reclaim mat and tank', spec: '60 gal', text: 'A bermed mat under the car; a pump lifts the used water back into the van.' },
    { icon: 'spark', name: 'Inspection lights', spec: '6500 K', text: 'Daylight-balanced LED panels that show every swirl, so none hide from us.' },
    { icon: 'clock', name: 'Infrared lamps', spec: '2 × 1 kW', text: 'They cure ceramic coatings in hours, so the car is rain-ready by morning.' },
    { icon: 'car', name: 'Extractor and steamer', spec: '95 °C', text: 'Hot water to flush fabric, dry steam for every button and seam.' },
];

export const visitSteps: { title: string; text: string }[] = [
    { title: 'Book', text: 'Tell us the car, the address and a few days that suit. We reply within one working day with a time slot.' },
    { title: 'We arrive', text: 'The van parks at your curb or beside your space. We walk round the car with you, or with your note.' },
    { title: 'We detail', text: 'Our water, our power, our lights. You carry on with your day; the car stays exactly where it is.' },
    { title: 'Walkaround', text: 'We show you the finish, take the photos, and you pay by card on the spot. That is it.' },
];
