<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { createCtaTarget, createEditableTarget, createListItemTarget, createListTarget } from '~/utils/cmsEditor'
import { createStableItemKeyResolver } from '~/utils/cmsUi'

const props = defineProps<{
  page: CmsPage
  articles: CmsArticle[]
  siteSettings: CmsSiteSettings
}>()

const editor = useCmsPageLiveEditor()
const content = computed(() => props.page.content as CmsHomePageContent)
const featuredArticles = computed(() => props.articles.slice(0, 6))
const heroButtons = computed(() => content.value.heroButtons || [])
const socials = computed(() => (props.siteSettings.socials || []).filter(social => social.href))
const getItemKey = createStableItemKeyResolver()

const heroButtonsModel = computed({
  get: () => content.value.heroButtons,
  set: (value) => {
    content.value.heroButtons = value
  }
})
const featuresModel = computed({
  get: () => content.value.features,
  set: (value) => {
    content.value.features = value
  }
})
const partnersModel = computed({
  get: () => content.value.partners,
  set: (value) => {
    content.value.partners = value
  }
})
</script>

<template>
  <div>
    <UPageHero
      class="dark"
      :ui="{ root: 'h-192 flex items-center', title: '!text-8xl' }"
    >
      <template #top>
        <svg
          class="absolute inset-0 -z-10 h-full w-full"
          viewBox="0 0 1440 960"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <image
            href="/hero.jpg"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            style="filter: saturate(0%) contrast(134%) brightness(115%);"
          />
          <rect
            width="100%"
            height="100%"
            fill="#d20808"
            fill-opacity="0.22"
          />
          <rect
            width="100%"
            height="100%"
            fill="#d20808"
            fill-opacity="0.14"
            style="mix-blend-mode: overlay;"
          />
          <image
            href="/noise.png"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            opacity="0.55"
            style="mix-blend-mode: overlay;"
          />
          <rect
            width="100%"
            height="100%"
            fill="#000000"
            fill-opacity="0.24"
          />
        </svg>
      </template>

      <template #title>
        <CmsEditableNode
          tag="div"
          class="inline-block"
          :target="createEditableTarget(`${page.slug}:headline`, 'headline', 'Titre principal')"
        >
          {{ page.headline }}
        </CmsEditableNode>
      </template>

      <template #description>
        <CmsEditableNode
          tag="div"
          :target="createEditableTarget(`${page.slug}:subheadline`, 'subheadline', 'Sous-titre', true)"
        >
          {{ page.subheadline }}
        </CmsEditableNode>
      </template>

      <template #links>
        <div
          v-if="editor"
          class="flex flex-wrap items-center gap-3"
        >
          <VueDraggable
            v-model="heroButtonsModel"
            tag="div"
            class="contents"
            :animation="180"
            ghost-class="opacity-60"
            chosen-class="scale-[1.02]"
            @start="editor.closeTarget()"
          >
            <CmsEditableNode
              v-for="(button, index) in heroButtons"
              :key="getItemKey(button, 'hero-button', index)"
              tag="div"
              :target="createListItemTarget(page.slug, 'hero-button', index, 'content.heroButtons', 'Bouton du hero')"
            >
              <UButton
                :label="button.label || 'Bouton sans titre'"
                :icon="button.variant === 'secondary' ? button.icon || undefined : undefined"
                :trailing-icon="button.variant === 'primary' ? button.icon || undefined : undefined"
                size="xl"
                :color="button.variant === 'secondary' ? 'neutral' : 'primary'"
                :variant="button.variant === 'secondary' ? 'subtle' : 'solid'"
                :to="undefined"
                :class="button.variant === 'primary' ? 'text-white bg-[#d20808]' : 'outline-none'"
                @click.prevent="undefined"
              />
            </CmsEditableNode>
          </VueDraggable>

          <CmsEditableNode
            tag="div"
            :target="createListTarget(page.slug, 'hero-button', 'content.heroButtons', 'Boutons du hero')"
          >
            <UButton
              icon="mingcute:plus-line"
              color="neutral"
              variant="outline"
              size="xl"
              square
            />
          </CmsEditableNode>
        </div>

        <template v-else>
          <UButton
            v-for="(button, index) in heroButtons"
            :key="getItemKey(button, 'hero-button', index)"
            :label="button.label || 'Bouton sans titre'"
            :icon="button.variant === 'secondary' ? button.icon || undefined : undefined"
            :trailing-icon="button.variant === 'primary' ? button.icon || undefined : undefined"
            size="xl"
            :color="button.variant === 'secondary' ? 'neutral' : 'primary'"
            :variant="button.variant === 'secondary' ? 'subtle' : 'solid'"
            :to="button.href"
            :class="button.variant === 'primary' ? 'text-white bg-[#d20808]' : 'outline-none'"
          />
        </template>
      </template>
    </UPageHero>

    <UPageSection
      id="features"
      :ui="{ features: 'lg:grid-cols-2' }"
    >
      <template #title>
        <CmsEditableNode
          tag="div"
          class="inline-block"
          :target="createEditableTarget(`${page.slug}:features-title`, 'content.featuresTitle', 'Titre des points forts')"
        >
          {{ content.featuresTitle }}
        </CmsEditableNode>
      </template>

      <template #body>
        <ul
          v-if="editor"
          class="grid gap-8 lg:grid-cols-2"
        >
          <VueDraggable
            v-model="featuresModel"
            tag="div"
            class="contents"
            :animation="180"
            ghost-class="opacity-60"
            chosen-class="scale-[1.02]"
            @start="editor.closeTarget()"
          >
            <CmsEditableNode
              v-for="(feature, index) in content.features"
              :key="getItemKey(feature, 'feature', index)"
              tag="li"
              :target="createListItemTarget(page.slug, 'feature', index, 'content.features', 'Point fort')"
            >
              <UPageFeature
                :icon="feature.icon || 'mingcute:sparkles-line'"
                :title="feature.title || 'Point fort sans titre'"
                :description="feature.description"
              />
            </CmsEditableNode>
          </VueDraggable>

          <CmsEditableNode
            tag="li"
            :target="createListTarget(page.slug, 'feature', 'content.features', 'Points forts')"
          >
            <UPageFeature
              icon="mingcute:plus-line"
              title="Ajouter un point fort"
              description="Créer un nouveau bloc de présentation."
              class="opacity-70"
            />
          </CmsEditableNode>
        </ul>

        <ul
          v-else
          class="grid gap-8 lg:grid-cols-2"
        >
          <li
            v-for="(feature, index) in content.features"
            :key="getItemKey(feature, 'feature', index)"
          >
            <UPageFeature
              :icon="feature.icon || 'mingcute:sparkles-line'"
              :title="feature.title || 'Point fort sans titre'"
              :description="feature.description"
            />
          </li>
        </ul>
      </template>
    </UPageSection>

    <UPageSection id="articles">
      <template #title>
        <CmsEditableNode
          tag="div"
          class="inline-block"
          :target="createEditableTarget(`${page.slug}:articles-title`, 'content.articlesTitle', 'Titre des articles')"
        >
          {{ content.articlesTitle }}
        </CmsEditableNode>
      </template>

      <template #body>
        <div
          v-if="!featuredArticles.length"
          class="text-sm text-muted"
        >
          Aucun article n’est disponible pour le moment.
        </div>

        <UCarousel
          v-else
          :items="featuredArticles"
          arrows
          dots
          :ui="{
            item: 'basis-full md:basis-1/2 xl:basis-1/3',
            prev: 'left-3',
            next: 'right-3',
            dots: 'relative inset-auto bottom-auto mt-6'
          }"
        >
          <template #default="{ item: article }">
            <CmsArticleSummaryCard
              :article="article"
              immersive
            />
          </template>
        </UCarousel>
      </template>
    </UPageSection>

    <UPageSection id="partners">
      <template #title>
        <CmsEditableNode
          tag="div"
          class="inline-block"
          :target="createEditableTarget(`${page.slug}:partners-title`, 'content.partnersTitle', 'Titre des partenaires')"
        >
          {{ content.partnersTitle }}
        </CmsEditableNode>
      </template>

      <template #body>
        <div
          v-if="editor"
          class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        >
          <VueDraggable
            v-model="partnersModel"
            tag="div"
            class="contents"
            :animation="180"
            ghost-class="opacity-60"
            chosen-class="scale-[1.02]"
            @start="editor.closeTarget()"
          >
            <CmsEditableNode
              v-for="(partner, index) in content.partners"
              :key="getItemKey(partner, 'partner', index)"
              tag="div"
              :target="createListItemTarget(page.slug, 'partner', index, 'content.partners', 'Partenaire')"
            >
              <UPageCard
                :title="partner.name || 'Partenaire sans titre'"
                :to="undefined"
                class="h-full"
              >
                <template #leading>
                  <div class="flex h-16 w-full items-center justify-center">
                    <img
                      v-if="partner.logo"
                      :src="partner.logo"
                      :alt="partner.name"
                      class="h-12 object-contain"
                    >
                    <span
                      v-else
                      class="text-sm text-muted"
                    >
                      Aucun logo
                    </span>
                  </div>
                </template>
              </UPageCard>
            </CmsEditableNode>
          </VueDraggable>

          <CmsEditableNode
            tag="div"
            :target="createListTarget(page.slug, 'partner', 'content.partners', 'Partenaires')"
          >
            <UPageCard
              title="Ajouter un partenaire"
              description="Ajouter un nouveau bloc logo."
              icon="mingcute:plus-line"
              class="h-full opacity-70"
            />
          </CmsEditableNode>
        </div>

        <UPageGrid
          v-else
          class="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        >
          <UPageCard
            v-for="(partner, index) in content.partners"
            :key="getItemKey(partner, 'partner', index)"
            :title="partner.name || 'Partenaire sans titre'"
            :to="partner.href || undefined"
            :target="partner.href?.startsWith('http') ? '_blank' : undefined"
            class="h-full text-center"
            :ui="{ wrapper: 'flex items-center justify-center gap-2' }"
          >
            <template #leading>
              <div class="flex h-16 items-center justify-center">
                <img
                  v-if="partner.logo"
                  :src="partner.logo"
                  :alt="partner.name"
                  class="h-18 object-contain"
                >
                <span
                  v-else
                  class="text-sm text-muted"
                >
                  Aucun logo
                </span>
              </div>
            </template>
          </UPageCard>
        </UPageGrid>
      </template>
    </UPageSection>

    <UPageSection>
      <UPageCTA variant="subtle">
        <template #title>
          <CmsEditableNode
            tag="div"
            class="inline-block"
            :target="createEditableTarget(`${page.slug}:cta-title`, 'content.ctaTitle', 'Titre de l’appel à l’action')"
          >
            {{ content.ctaTitle }}
          </CmsEditableNode>
        </template>

        <template #description>
          <CmsEditableNode
            tag="div"
            :target="createEditableTarget(`${page.slug}:cta-description`, 'content.ctaDescription', 'Description de l’appel à l’action', true)"
          >
            {{ content.ctaDescription }}
          </CmsEditableNode>
        </template>

        <template #links>
          <CmsEditableNode
            tag="div"
            :target="createCtaTarget(page.slug)"
          >
            <UButton
              :label="content.ctaLabel || page.ctaLabel || 'Articles'"
              :to="editor ? undefined : content.ctaHref || page.ctaHref || '/articles'"
              :trailing-icon="content.ctaTrailingIcon || 'mingcute:arrow-right-line'"
              color="neutral"
              @click.prevent="undefined"
            />
          </CmsEditableNode>
        </template>
      </UPageCTA>
    </UPageSection>

    <SiteSocialLinksSection :socials="socials" />
  </div>
</template>
