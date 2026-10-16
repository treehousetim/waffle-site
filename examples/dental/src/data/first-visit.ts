/**
 * "Your first visit", step by step: the path on the home page and on
 * /new-patients/. Keep it true to how the practice actually runs a first
 * appointment.
 */
import type { IconName } from '../components/Icon.astro';

export const firstVisit: { title: string; text: string; icon: IconName; note?: string }[] = [
    {
        title: 'Say hello',
        text: 'Book online or call. If you tell us you are nervous, Jo calls you back first, just to say hello and answer anything you want to ask.',
        icon: 'chat',
        note: 'Takes two minutes',
    },
    {
        title: 'A short form, at home',
        text: 'We email a health form to fill in on your sofa, not on a clipboard in the waiting room. Bring your insurance card, or a photo of it.',
        icon: 'mail',
    },
    {
        title: 'Tea, not a waiting room',
        text: 'Arrive and we will offer you a cup of something. We run to time, so you will not be sitting there working yourself up for half an hour.',
        icon: 'leaf',
        note: 'We run on time',
    },
    {
        title: 'Talk first, chair second',
        text: 'Your dentist sits with you, upright, and asks what you want from today. Then a gentle look, x-rays only if they are due, and a clean.',
        icon: 'hand',
        note: 'Raise a hand and we stop',
    },
    {
        title: 'Your plan, in plain words',
        text: 'We show you what we saw on the screen, explain any choices and costs, and you take it home to think about. No decisions in the chair.',
        icon: 'heart',
    },
];
