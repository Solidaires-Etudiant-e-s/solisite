<template>
  <div>
    <UPageHero
      class="dark"
      title="Solidaires Étudiant•e•s"
      description="Syndicats de luttes, militant pour une université gratuite, ouverte à tous·tes,  de  qualité,  émancipatrice  et  autogérée."
      :links="[{
        label: 'Adhérer',
        to: '/syndicats',
        trailingIcon: 'mingcute:arrow-right-line',
        size: 'xl',
        class: 'text-white bg-[#d20808]'
      }, {
        label: 'Articles',
        to: '/articles',
        icon: 'mingcute:github-line',
        size: 'xl',
        color: 'neutral',
        variant: 'subtle',
        class: 'outline-none'
      }]"
      :ui="{ root: 'min-h-[70vh] flex items-center' }"
    >
      <template #top>
        <div class="absolute inset-0 -z-10 bg-[url(/hero.jpg)] bg-cover bg-center" />
        <div class="absolute inset-0 -z-10 bg-black/50" />
      </template>
    </UPageHero>

    <UPageSection
      id="features"
      title="Qui sommes nous ?"
      :features="[{
        icon: 'mingcute:sitemap-line',
        title: 'Fédération de syndicats',
        description: 'Syndicats au pluriel car nous sommes une fédération regroupant plus de 30 syndicats répartis sur des dizaines d’universités aux réalités locales variées. Lʼautonomie des syndicats permet ainsi une adéquation à ce terrain. Nous sommes réunis en fédération afin de nous coordonner car les attaques qui nous touchent sont nationales ou internationales. Nous souhaitons ainsi nous donner les moyens de lutter collectivement, tout en adoptant un fonctionnement démocratique.'
      }, {
        icon: 'mingcute:mortarboard-line',
        title: 'Syndicats étudiants',
        description: 'Étudiant·e·s au pluriel, car lʼétudiant·e nʼest pas un concept universel. Les étudiant·e·s sont divers·e·s dans leurs genres, dans leurs conditions sociales, dans leurs choix dʼétudes, dans leurs âges. Cette fédération se donne pour objectif de rassembler tous·es les étudiant·e·s quʼiels étudient en BTS, DUT, licence, Master, Doctorat ou formations spécifiques (soins infirmiers, travail social, etc.). Solidaires étudiant·e·s travaille à devenir le lieu de rassemblement de tous·tes les étudiant·e·s, que nous considérons comme travailleur·euse·s en période de formation.'
      }, {
        icon: 'mingcute:bomb-line',
        title: 'Syndicats de luttes',
        description: 'Luttes au pluriel, car les luttes sont diverses, multiples dans leurs formes, que nous sommes partie prenante des luttes hors des lieux dʼétudes mais aussi parce que nous développons des luttes dans les lieux dʼétudes y compris sur les questions écologiques, féministes, anti-impérialistes ou antiracistes.'
      }, {
        icon: 'mingcute:heart-hand-line',
        title: '&quot;Solidaires&quot; Étudiant·e·s',
        description: 'Solidaires car nous sommes membres de lʼUnion Syndicale Solidaires : nous avons fait le choix dʼun travail interprofessionnel qui traduit à la fois notre volonté dʼêtre au côté des salarié·e·s dans leurs combats, et la nécessité de faire entendre notre combat dʼétudiant·e·s aux salarié·e·s.'
      }]"
      :ui="{ features: 'lg:grid-cols-2' }"
    />

    <UPageSection
      id="articles"
      title="Derniers articles"
    >
      <UCarousel
        v-slot="{ item }"
        :items="articles"
        :ui="{ item: 'lg:basis-1/3 md:basis-1/2', container: 'items-stretch' }"
        arrows
      >
        <ULink :to="item.href">
          <UCard
            variant="solid"
            :ui="{ root: 'bg-white h-full' }"
          >
            <img
              :src="item.imageUrl"
              :alt="item.title"
            >
            <template #footer>
              <strong>{{ item.title }}</strong>
            </template>
          </UCard>
        </ULink>
      </UCarousel>
    </UPageSection>

    <UPageSection>
      <UPageCTA
        title="Alors, convaincu·e ?"
        description="Prends contact avec le syndicat le plus proche de chez toi pour rejoindre la lutte !"
        variant="subtle"
        :links="[{
          label: 'Prendre contact',
          to: '/syndicats',
          trailingIcon: 'mingcute:arrow-right-line',
          color: 'neutral'
        }]"
      />
    </UPageSection>
  </div>
</template>

<script lang="ts" setup>
type Article = {
  title: string
  date: Date
  tags: string[]
  imageUrl: string
  href: string
}

const articles: Article[] = [{
  title: 'L’état affame les étudiant-e-s précaires',
  date: new Date('2026-01-07'),
  tags: ['Communiqués nationaux', 'Enseignement supérieur'],
  imageUrl: 'https://solidaires-etudiant-e-s.org/site/wp-content/uploads/2026/01/Letat_affame_les_etudiant-e-s_precaires-500x625.webp',
  href: 'https://www.instagram.com/p/DTM8iU_jH8B'
}, {
  title: 'Israël attaque une nouvelle fois une université et continue sa colonisation en Palestine',
  date: new Date('2026-01-06'),
  tags: ['Communiqués nationaux', 'International'],
  imageUrl: 'https://solidaires-etudiant-e-s.org/site/wp-content/webpc-passthru.php?src=https://solidaires-etudiant-e-s.org/site/wp-content/uploads/2026/01/Communique-attaque-universite-palestinienne--500x625.png&nocache=1',
  href: 'https://www.instagram.com/p/DTLnoOSjBCD'
}, {
  title: 'Soutien au peuple vénézuélien face à l’attaque impérialiste des états unis !',
  date: new Date('2026-01-03'),
  tags: ['Communiqués nationaux', 'International'],
  imageUrl: 'https://solidaires-etudiant-e-s.org/site/wp-content/uploads/2026/01/1-500x625.webp',
  href: 'https://www.instagram.com/p/DTDsGEjDLro'
}, {
  title: 'Face au programme d’islamophobie d’État, organisons la riposte !',
  date: new Date('2025-12-01'),
  tags: ['Antiracisme', 'Communiqués nationaux', 'Enseignement supérieur'],
  imageUrl: 'https://solidaires-etudiant-e-s.org/site/wp-content/webpc-passthru.php?src=https://solidaires-etudiant-e-s.org/site/wp-content/uploads/2025/12/Face-au-programme-dislamophobie-dEtat-organisons-la-riposte--500x625.png&nocache=1',
  href: 'https://www.instagram.com/p/DRt3QluDEEA'
}]
</script>
