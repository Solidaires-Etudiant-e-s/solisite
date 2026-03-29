<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { createEditableTarget, createListItemTarget, createListTarget } from '~/utils/cmsEditor'
import { cmsTouchDragOptions } from '~/utils/cmsDrag'
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
const compactSectionUi = {
  container: 'px-3 py-10 sm:px-4 sm:py-14 lg:px-5 lg:py-16 gap-6 sm:gap-10',
  body: 'mt-6 sm:mt-10'
}

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
      :ui="{ root: 'sm:h-192 flex items-center', title: 'sm:!text-8xl' }"
    >
      <template #top>
        <div
          class="absolute inset-0 -z-10 overflow-hidden"
          aria-hidden="true"
        >
          <picture class="block h-full w-full">
            <source
              srcset="/hero/hero-home.avif"
              type="image/avif"
            >
            <source
              srcset="/hero/hero-home.webp"
              type="image/webp"
            >
            <img
              src="/hero/hero-home.png"
              alt=""
              class="h-full w-full object-cover"
              loading="eager"
              decoding="async"
              fetchpriority="high"
              style="filter: saturate(0%) contrast(134%) brightness(115%);"
            >
          </picture>

          <div class="hero-accent-overlay absolute inset-0" />
          <div class="hero-accent-overlay-soft absolute inset-0 mix-blend-overlay" />

          <div
            class="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-30"
            style="background-image: url('/noise.png'); background-repeat: repeat; background-size: 128px 128px;"
          />

          <div class="hero-scrim-overlay absolute inset-0" />
        </div>
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
            v-bind="cmsTouchDragOptions"
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
                :class="button.variant === 'primary' ? 'text-inverted' : 'outline-none'"
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
            :class="button.variant === 'primary' ? 'text-inverted' : 'outline-none'"
          />
        </template>
      </template>
    </UPageHero>

    <UPageSection
      id="features"
      :ui="{ ...compactSectionUi, features: 'lg:grid-cols-2' }"
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
            v-bind="cmsTouchDragOptions"
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

    <UPageSection
      id="articles"
      :ui="compactSectionUi"
    >
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

    <UPageSection
      id="partners"
      :ui="compactSectionUi"
    >
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
            v-bind="cmsTouchDragOptions"
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

    <SiteSocialLinksSection :socials="socials" />
  </div>
</template>
