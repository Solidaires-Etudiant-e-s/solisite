import { cloneCmsValue, createPageContent } from '~~/lib/cms'
import { defaultFundamentalTextsContent } from './fundamentalTextsContent'

const defaultHomeContent = {
  heroButtons: [{
    label: 'Adherer',
    href: '/articles',
    icon: 'mingcute:arrow-right-line',
    variant: 'primary'
  }, {
    label: 'Administration',
    href: '/admin',
    icon: 'mingcute:edit-2-line',
    variant: 'secondary'
  }],
  featuresTitle: 'Qui sommes nous ?',
  features: [{
    icon: 'mingcute:sitemap-line',
    title: 'Réseau de syndicats',
    description: 'Syndicats au pluriel car nous regroupons plus de 30 syndicats repartis sur des dizaines d’universites aux realites locales variees.'
  }, {
    icon: 'mingcute:mortarboard-line',
    title: 'Syndicats etudiants',
    description: 'Les etudiant·e·s sont divers·e·s dans leurs genres, dans leurs conditions sociales, dans leurs choix d’etudes, dans leurs ages.'
  }, {
    icon: 'mingcute:bomb-line',
    title: 'Syndicats de luttes',
    description: 'Les luttes sont diverses, multiples dans leurs formes, et se developpent autant dans les lieux d’etudes qu’au-dela.'
  }, {
    icon: 'mingcute:heart-hand-line',
    title: 'Solidaires etudiant·e·s',
    description: 'Solidaires car nous avons fait le choix d’un travail interprofessionnel et d’une lutte collective.'
  }],
  articlesTitle: 'Derniers articles',
  partnersTitle: 'Partenaires',
  partners: [{
    name: 'FCPE',
    logo: '/partners/fcpe.svg',
    href: 'https://www.fcpe.asso.fr'
  }, {
    name: 'Unione degli studenti',
    logo: '/partners/uds.svg',
    href: 'https://www.unionedeglistudenti.net'
  }, {
    name: 'Ronahi',
    logo: '/partners/ronahi.svg',
    href: 'https://ronahi.org'
  }, {
    name: 'OBESSU',
    logo: '/partners/obessu.svg',
    href: 'https://obessu.org'
  }, {
    name: 'VISA',
    logo: '/partners/visa.svg',
    href: 'https://visa-isa.org'
  }, {
    name: 'Solidaires',
    logo: '/partners/solidaires.svg',
    href: 'https://solidaires.org'
  }],
  ctaTitle: 'Alors, convaincu·e ?',
  ctaDescription: 'Prends contact avec le syndicat le plus proche de chez toi pour rejoindre la lutte !',
  ctaLabel: 'Prendre contact',
  ctaHref: '/articles',
  ctaTrailingIcon: 'mingcute:arrow-right-line'
}

const defaultArticlesContent = {
  emptyStateText: 'Aucun article n’est disponible pour le moment.'
}

const defaultGuidesContent = {
  emptyStateText: 'Aucun guide n’est disponible pour le moment.'
}

const defaultSyndicatsContent = {
  searchPlaceholder: 'Rechercher un syndicat ou une ville',
  emptyStateText: 'Aucun syndicat ne correspond à votre recherche.'
}

const defaultAboutContent = {
  heroImage: '/hero.jpg',
  heroImageAlt: 'Manifestation de Solidaires Étudiant·e·s',
  networkTitle: 'Où sommes-nous ?',
  networkBody1: '{unionName} fédère aujourd’hui {syndicatCount} syndicats locaux répartis dans {cityCount} villes. Le réseau se construit à partir des réalités locales des campus, avec des collectifs qui s’organisent dans les universités, les CROUS et les lieux de vie étudiante.',
  networkBody2: 'Notre force tient à cette implantation locale: chaque syndicat mène ses propres campagnes, tout en participant à une orientation nationale commune et à des solidarités interpro.',
  networkStatOneLabel: 'Réseau local',
  networkStatOneDescription: 'syndicats actifs recensés dans le CMS.',
  networkStatTwoLabel: 'Implantation',
  networkStatTwoDescription: 'villes couvertes actuellement par le réseau.',
  missionsTitle: 'Nos missions',
  missionsIntro: 'Nous défendons les intérêts matériels et politiques des étudiant·e·s en articulant syndicalisme de lutte, entraide et auto-organisation.',
  missions: [{
    icon: 'mingcute:group-3-line',
    title: 'Organiser',
    description: 'Construire un rapport de force sur les campus, faire vivre les syndicats locaux et donner aux étudiant·e·s des outils pour défendre leurs droits.'
  }, {
    icon: 'mingcute:megaphone-line',
    title: 'Informer',
    description: 'Rendre lisibles les réformes, les procédures administratives et les attaques contre l’université pour permettre des ripostes collectives.'
  }, {
    icon: 'mingcute:rocket-line',
    title: 'Transformer',
    description: 'Porter un projet d’université gratuite, ouverte à tou·tes, émancipatrice, autogérée et tournée vers la solidarité plutôt que la sélection.'
  }],
  functioningTitle: 'Fonctionnement interne',
  functioningBody1: 'Le syndicat repose sur la démocratie directe, les mandats collectifs et l’autonomie des structures locales. Les orientations nationales sont discutées et construites avec les syndicats, pas imposées depuis le haut.',
  functioningBody2: 'Cette organisation permet d’articuler campagnes nationales, caisse de solidarité, formations militantes et réponses rapides aux attaques locales contre les étudiant·e·s.',
  functioningImage: '/hero.jpg',
  functioningImageAlt: 'Rassemblement militant',
  historyTitle: 'Notre histoire',
  historyBody1: 'Solidaires Étudiant·e·s s’inscrit dans une tradition de syndicalisme étudiant combatif, féministe, antiraciste et interprofessionnel. Notre histoire est celle d’implantations locales construites dans les luttes, de collectifs qui se fédèrent, et d’un choix clair en faveur d’une organisation indépendante des directions universitaires comme des appareils partisans.',
  historyBody2: 'Cette continuité se retrouve dans les campagnes contre la sélection, pour de meilleures conditions d’études, pour la justice sociale, et dans le soutien aux mobilisations qui dépassent les seuls campus.',
  historyImage: '/hero.jpg',
  historyImageAlt: 'Cortège étudiant',
  networkCtaLabel: 'Trouver un syndicat',
  networkCtaHref: '/syndicats',
  functioningCtaLabel: 'Nous contacter',
  functioningCtaHref: 'mailto:contact@solidaires-etudiant-e-s.org'
}

const defaultInternationalContent = {
  partnersTitle: 'our international partners',
  partners: defaultHomeContent.partners,
  body: `
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.</p>
<p>Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.</p>
<p>Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue.</p>
`.trim()
}

export const defaultSignalementVssFormHref = 'https://framaforms.org/formulaire-de-signalement-vssoppression-sesl-1788696868'
export const defaultSignalementVssEmailHref = 'mailto:vss@solidaires-etudiant-e-s.org'

const defaultSignalementVssContent = {
  formHref: defaultSignalementVssFormHref,
  emailHref: defaultSignalementVssEmailHref,
  body: `
<p>Notre milieu syndical ne s'extrait pas des systèmes oppressifs de notre société, des logiques de domination (sexiste, raciste, transphobe, lgbtqi-phobe, validiste..) peuvent s'y reproduire.</p>
<p>Il est donc essentiel que notre fédération dispose d'outils pour prévenir ces situations de domination, tels que les formations et les espaces d'échanges en non-mixité, mais également d'outils pour assurer la prise en charge des victimes : les cellules VSS et oppressions.</p>
<p>Toute personne ayant subi-e des violences sexistes et sexuelles, des discriminations et autres logiques oppressives, au sein du syndicat/par un.e membre de la fédération, peut saisir la référence de lutte contre les VSS et les oppressions pour demander à ouvrir une cellule.</p>
<h2>C'est quoi une cellule ?</h2>
<p>Une cellule fédérale est composée de 5 membres issu-es de 5 syndicats de notre fédération, et d'un-e référent-e. Elle peut fonctionner en non mixité si la/les victime-s le demande-nt.</p>
<p>Une cellule a pour but de recueillir le témoignage de la/des victime-s, d'entendre ses/leurs besoins, d'enquêter si elle l'estime nécessaire, puis de prendre une décision collective qui sera ensuite votée par les syndicats.</p>
<p>Elle peut ainsi sanctionner l'auteur.ice des violences, le suspendre temporairement, l'exclure, lui imposer des formations obligatoires...</p>
<p>Une cellule peut également sanctionner un syndicat ou toute personne qui aurait fait obstruction au témoignage de la victime et au bon déroulement du protocole.</p>
<p>Le but principal des cellules est d'assurer la sécurité des victimes : celles-ci sont donc anonymisées dans toute information qui sort de la cellule et les membres de la cellule doivent respecter une stricte confidentialité.</p>
<h2>Comment on saisit une cellule ?</h2>
<p>Les cellules peuvent exister au niveau local, au sein de l'union départementale du syndicat (se référer aux protocoles locaux). L'Union syndicale Solidaires en dispose aussi d'une (saisissable via le site internet).</p>
<p>Pour saisir une cellule au niveau fédéral, il faut émettre un signalement auprès de la référence VSS et oppression.</p>
<p>Vous pouvez passer par <a href="https://framaforms.org/formulaire-de-signalement-vssoppression-sesl-1788696868" target="_blank" rel="noopener noreferrer">ce formulaire de signalement</a>, ou envoyer un mail à la référence VSS et oppressions (<a href="mailto:vss@solidaires-etudiant-e-s.org">vss@solidaires-etudiant-e-s.org</a>).</p>
<p>Si vous avez des questions, les référent-es VSS et oppressions (Margot de Bordeaux et Solstice de Grenoble) sont également joignable sur Discord.</p>
`.trim()
}

export const defaultPages = [
  {
    slug: 'home',
    name: 'Accueil',
    title: 'Solidaires Etudiant·es',
    description: 'Syndicats de luttes, militant pour une universite gratuite, ouverte a tous·tes, de qualite, emancipatrice et autogeree.',
    headline: 'Solidaires Etudiant•e•s',
    subheadline: 'Syndicats de luttes, militant pour une universite gratuite, ouverte a tous·tes, de qualite, emancipatrice et autogeree.',
    ctaLabel: 'Articles',
    ctaHref: '/articles',
    content: defaultHomeContent
  },
  {
    slug: 'a-propos',
    name: 'À propos',
    title: 'À propos',
    description: 'Découvre Solidaires Étudiant·e·s, son réseau, ses missions et son fonctionnement.',
    headline: 'À propos',
    subheadline: 'Qui nous sommes, comment nous nous organisons et ce que nous défendons sur nos lieux d’études.',
    ctaLabel: 'Trouver un syndicat',
    ctaHref: '/syndicats',
    content: defaultAboutContent
  },
  {
    slug: 'international',
    name: 'International',
    title: 'International',
    description: 'International version placeholder page.',
    headline: 'International',
    subheadline: 'A temporary international landing page managed in the CMS.',
    ctaLabel: 'Home',
    ctaHref: '/',
    content: defaultInternationalContent
  },
  {
    slug: 'textes-fondamentaux',
    name: 'Textes fondamentaux',
    title: 'Textes fondamentaux',
    description: 'Les textes politiques et syndicaux de référence de Solidaires Étudiant·e·s.',
    headline: 'Textes fondamentaux',
    subheadline: 'Charte d’Amiens, charte de SUD PTT et charte de Solidaires étudiant-e-s réunies dans une lecture par volets.',
    ctaLabel: 'À propos',
    ctaHref: '/a-propos',
    content: defaultFundamentalTextsContent
  },
  {
    slug: 'signalement-vss',
    name: 'Signalement VSS',
    title: 'Signalement VSS',
    description: 'Signaler des violences sexistes et sexuelles, des discriminations et autres logiques oppressives au sein de la fédération.',
    headline: 'Signalement VSS et oppressions',
    subheadline: 'Toute personne ayant subi des violences sexistes et sexuelles, des discriminations et autres logiques oppressives au sein du syndicat peut saisir la référence de lutte contre les VSS et les oppressions.',
    ctaLabel: 'Accéder au formulaire',
    ctaHref: defaultSignalementVssFormHref,
    content: defaultSignalementVssContent
  },
  {
    slug: 'articles',
    name: 'Liste des articles',
    title: 'Articles',
    description: 'Les derniers articles publiés par Solidaires Étudiant·e·s.',
    headline: 'Articles',
    subheadline: 'Les derniers articles publiés depuis l’administration.',
    ctaLabel: 'Ouvrir l’administration',
    ctaHref: '/admin',
    content: defaultArticlesContent
  },
  {
    slug: 'guides',
    name: 'Liste des guides',
    title: 'Guides',
    description: 'Les guides et brochures publiés par Solidaires Étudiant·e·s.',
    headline: 'Guides',
    subheadline: 'Des ressources longues à lire en ligne et à télécharger en PDF.',
    ctaLabel: 'Ouvrir l’administration',
    ctaHref: '/admin',
    content: defaultGuidesContent
  },
  {
    slug: 'syndicats',
    name: 'Syndicats',
    title: 'Syndicats',
    description: 'Trouve le syndicat le plus proche de ton lieu d’études.',
    headline: 'Syndicats',
    subheadline: 'Trouve ton syndicat local sur la carte et consulte sa fiche.',
    ctaLabel: 'Articles',
    ctaHref: '/articles',
    content: defaultSyndicatsContent
  }
] as const

export function getDefaultPageContent(slug: string) {
  return cloneCmsValue(createPageContent(slug))
}

function normalizeHomeContent(raw: Record<string, unknown> | null | undefined) {
  const fallback = cloneCmsValue(defaultHomeContent)
  const parsed = raw || {}
  const heroButtons = Array.isArray(parsed.heroButtons)
    ? parsed.heroButtons.map((value) => {
        const button = (value && typeof value === 'object') ? value as Record<string, unknown> : {}

        return {
          label: String(button.label || ''),
          href: String(button.href || ''),
          icon: String(button.icon || ''),
          variant: button.variant === 'secondary' ? 'secondary' : 'primary'
        }
      })
    : fallback.heroButtons

  return {
    ...fallback,
    ...parsed,
    heroButtons,
    features: Array.isArray(parsed.features) ? parsed.features : fallback.features,
    partners: Array.isArray(parsed.partners) ? parsed.partners : fallback.partners
  }
}

function normalizeAboutContent(raw: Record<string, unknown> | null | undefined) {
  const fallback = cloneCmsValue(defaultAboutContent)
  const parsed = raw || {}

  return {
    ...fallback,
    ...parsed,
    missions: Array.isArray(parsed.missions) ? parsed.missions : fallback.missions
  }
}

function normalizeInternationalContent(raw: Record<string, unknown> | null | undefined) {
  const fallback = cloneCmsValue(defaultInternationalContent)
  const parsed = raw || {}

  return {
    ...fallback,
    ...parsed,
    partners: Array.isArray(parsed.partners) ? parsed.partners : fallback.partners
  }
}

function normalizeFundamentalTextsContent(raw: Record<string, unknown> | null | undefined) {
  const fallback = cloneCmsValue(defaultFundamentalTextsContent)
  const parsed = raw || {}

  return {
    ...fallback,
    ...parsed,
    texts: Array.isArray(parsed.texts) ? parsed.texts : fallback.texts
  }
}

function normalizeSignalementVssContent(raw: Record<string, unknown> | null | undefined) {
  const fallback = cloneCmsValue(defaultSignalementVssContent)
  const parsed = raw || {}

  return {
    ...fallback,
    ...parsed,
    body: typeof parsed.body === 'string' && parsed.body.trim() ? parsed.body : fallback.body,
    formHref: typeof parsed.formHref === 'string' && parsed.formHref.trim() ? parsed.formHref : fallback.formHref,
    emailHref: typeof parsed.emailHref === 'string' && parsed.emailHref.trim() ? parsed.emailHref : fallback.emailHref
  }
}

export function parsePageContent(slug: string, raw: string | null | undefined) {
  const fallback = getDefaultPageContent(slug)

  if (!raw) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw)

    if (slug === 'home') {
      return normalizeHomeContent(parsed)
    }

    if (slug === 'a-propos') {
      return normalizeAboutContent(parsed)
    }

    if (slug === 'international') {
      return normalizeInternationalContent(parsed)
    }

    if (slug === 'textes-fondamentaux') {
      return normalizeFundamentalTextsContent(parsed)
    }

    if (slug === 'signalement-vss') {
      return normalizeSignalementVssContent(parsed)
    }

    return {
      ...fallback,
      ...parsed
    }
  } catch {
    return fallback
  }
}
