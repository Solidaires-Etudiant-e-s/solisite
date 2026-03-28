import { cloneCmsValue, createPageContent } from '~~/lib/cms'

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

    return {
      ...fallback,
      ...parsed
    }
  } catch {
    return fallback
  }
}
