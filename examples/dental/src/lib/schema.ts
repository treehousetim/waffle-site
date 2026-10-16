/**
 * The structured data this practice needs that the core does not build:
 * a MedicalProcedure for each treatment page and a Person for each dentist.
 * Plain objects, added to a page's graph through Base's `jsonLd` prop.
 *
 * No claims of outcome go in here: a procedure's description says what it
 * is and how it is done, in general terms, and nothing about results.
 */

export interface ProcedureFacts {
    url: string;
    name: string;
    description: string;
    procedureType: 'NoninvasiveProcedure' | 'SurgicalProcedure';
    howPerformed: string;
    preparation: string;
    followup: string;
    image: string;
}

export function medicalProcedure(facts: ProcedureFacts): Record<string, unknown> {
    return {
        '@type': 'MedicalProcedure',
        '@id': `${facts.url}#procedure`,
        name: facts.name,
        description: facts.description,
        url: facts.url,
        image: facts.image,
        procedureType: `https://schema.org/${facts.procedureType}`,
        bodyLocation: 'Mouth and teeth',
        howPerformed: facts.howPerformed,
        preparation: facts.preparation,
        followup: facts.followup,
        relevantSpecialty: 'https://schema.org/Dentistry',
        subjectOf: { '@id': `${facts.url}#webpage` },
    };
}

export interface PersonFacts {
    url: string;
    name: string;
    jobTitle: string;
    description: string;
    image: string;
    languages: readonly string[];
    knowsAbout: readonly string[];
}

export function dentistPerson(facts: PersonFacts, siteUrl: string): Record<string, unknown> {
    return {
        '@type': 'Person',
        '@id': `${facts.url}#person`,
        name: facts.name,
        jobTitle: facts.jobTitle,
        description: facts.description,
        url: facts.url,
        image: facts.image,
        knowsLanguage: [...facts.languages],
        knowsAbout: [...facts.knowsAbout],
        worksFor: { '@id': `${siteUrl}/#organization` },
    };
}
