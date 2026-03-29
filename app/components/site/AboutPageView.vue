<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { createEditableTarget, createListItemTarget, createListTarget } from '~/utils/cmsEditor'
import { cmsTouchDragOptions } from '~/utils/cmsDrag'
import { createStableItemKeyResolver, toLinkHref, toLinkTarget, toLinkTo } from '~/utils/cmsUi'
import type { CmsAboutPageContent } from '~~/lib/cms'

const props = defineProps<{
  page: CmsPage
  siteSettings: CmsSiteSettings
  syndicats: CmsSyndicat[]
}>()

const editor = useCmsPageLiveEditor()
const content = computed(() => props.page.content as CmsAboutPageContent)
const syndicatCount = computed(() => props.syndicats.length)
const cityCount = computed(() => new Set(props.syndicats.map(syndicat => syndicat.city).filter(Boolean)).size)
const contactHref = computed(() => content.value.functioningCtaHref || props.page.ctaHref || (props.siteSettings.contactEmail ? `mailto:${props.siteSettings.contactEmail}` : '/syndicats'))
const getItemKey = createStableItemKeyResolver()

function renderDynamicText(value: string) {
  return value
    .replaceAll('{unionName}', props.siteSettings.unionName || 'Solidaires Étudiant·e·s')
    .replaceAll('{syndicatCount}', String(syndicatCount.value))
    .replaceAll('{cityCount}', String(cityCount.value))
}

const missionsModel = computed({
  get: () => content.value.missions,
  set: (value) => {
    content.value.missions = value
  }
})
</script>

<template>
  <UPage>
    <section class="border-b border-default">
      <div class="public-container public-section grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_26rem] lg:items-center">
        <div class="space-y-6">
          <div class="space-y-4">
            <CmsEditableNode
              tag="h1"
              class="text-5xl font-black text-highlighted md:text-6xl"
              :target="createEditableTarget(`${page.slug}:headline`, 'headline', 'Titre principal')"
            >
              {{ page.headline }}
            </CmsEditableNode>
            <CmsEditableNode
              tag="p"
              class="max-w-3xl text-lg leading-relaxed text-toned"
              :target="createEditableTarget(`${page.slug}:subheadline`, 'subheadline', 'Sous-titre', true)"
            >
              {{ page.subheadline }}
            </CmsEditableNode>
          </div>

          <div class="flex flex-wrap gap-3">
            <CmsEditableNode
              tag="div"
              :target="{
                id: `${page.slug}:network-cta`,
                kind: 'link',
                path: 'content',
                label: 'Bouton réseau',
                fields: [
                  { key: 'networkCtaLabel', label: 'Libellé', kind: 'text' },
                  { key: 'networkCtaHref', label: 'Lien', kind: 'text' }
                ]
              }"
            >
              <UButton
                :label="content.networkCtaLabel || 'Trouver un syndicat'"
                icon="mingcute:map-pin-line"
                size="xl"
                :to="editor ? undefined : toLinkTo(content.networkCtaHref || '/syndicats')"
                :href="editor ? undefined : toLinkHref(content.networkCtaHref || '/syndicats')"
                :target="editor ? undefined : toLinkTarget(content.networkCtaHref || '/syndicats')"
              />
            </CmsEditableNode>
            <CmsEditableNode
              tag="div"
              :target="{
                id: `${page.slug}:functioning-cta`,
                kind: 'link',
                path: 'content',
                label: 'Bouton contact',
                fields: [
                  { key: 'functioningCtaLabel', label: 'Libellé', kind: 'text' },
                  { key: 'functioningCtaHref', label: 'Lien', kind: 'text' }
                ]
              }"
            >
              <UButton
                :label="content.functioningCtaLabel || 'Nous contacter'"
                icon="mingcute:mail-line"
                size="xl"
                color="neutral"
                variant="outline"
                :to="editor ? undefined : toLinkTo(contactHref)"
                :href="editor ? undefined : toLinkHref(contactHref)"
                :target="editor ? undefined : toLinkTarget(contactHref)"
              />
            </CmsEditableNode>
          </div>
        </div>

        <CmsEditableNode
          tag="div"
          class="media-frame relative overflow-hidden border border-default"
          :target="{
            id: `${page.slug}:hero-image`,
            kind: 'link',
            path: 'content',
            label: 'Image du hero',
            fields: [
              { key: 'heroImage', label: 'Image', kind: 'image', uploadEndpoint: '/api/cms/uploads/article-cover' },
              { key: 'heroImageAlt', label: 'Texte alternatif', kind: 'text' }
            ]
          }"
        >
          <img
            :src="content.heroImage || '/hero.jpg'"
            :alt="content.heroImageAlt || 'Manifestation de Solidaires Étudiant·e·s'"
            class="h-full min-h-[22rem] w-full object-cover opacity-70 grayscale"
          >
          <div class="about-image-hero-overlay absolute inset-0" />
          <div class="about-image-highlight-overlay absolute inset-0" />
        </CmsEditableNode>
      </div>
    </section>

    <section class="border-b border-default">
      <div class="public-container public-section grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="space-y-5">
          <CmsEditableNode
            tag="h2"
            class="text-4xl font-black text-highlighted md:text-5xl"
            :target="createEditableTarget(`${page.slug}:network-title`, 'content.networkTitle', 'Titre réseau')"
          >
            {{ content.networkTitle }}
          </CmsEditableNode>
          <CmsEditableNode
            tag="p"
            class="max-w-4xl text-lg leading-relaxed text-toned"
            :target="createEditableTarget(`${page.slug}:network-body-1`, 'content.networkBody1', 'Texte réseau 1', true)"
          >
            {{ renderDynamicText(content.networkBody1) }}
          </CmsEditableNode>
          <CmsEditableNode
            tag="p"
            class="max-w-4xl text-lg leading-relaxed text-toned"
            :target="createEditableTarget(`${page.slug}:network-body-2`, 'content.networkBody2', 'Texte réseau 2', true)"
          >
            {{ renderDynamicText(content.networkBody2) }}
          </CmsEditableNode>
          <CmsEditableNode
            tag="div"
            :target="{
              id: `${page.slug}:network-cta-secondary`,
              kind: 'link',
              path: 'content',
              label: 'Bouton réseau secondaire',
              fields: [
                { key: 'networkCtaLabel', label: 'Libellé', kind: 'text' },
                { key: 'networkCtaHref', label: 'Lien', kind: 'text' }
              ]
            }"
          >
            <UButton
              :label="content.networkCtaLabel || 'Trouver un syndicat'"
              icon="mingcute:map-pin-line"
              size="xl"
              :to="editor ? undefined : toLinkTo(content.networkCtaHref || '/syndicats')"
              :href="editor ? undefined : toLinkHref(content.networkCtaHref || '/syndicats')"
              :target="editor ? undefined : toLinkTarget(content.networkCtaHref || '/syndicats')"
            />
          </CmsEditableNode>
        </div>

        <div class="grid gap-4 self-start">
          <div class="border border-default bg-muted p-5">
            <CmsEditableNode
              tag="p"
              class="text-sm uppercase tracking-[0.2em] text-dimmed"
              :target="createEditableTarget(`${page.slug}:network-stat-one-label`, 'content.networkStatOneLabel', 'Label statistique 1')"
            >
              {{ content.networkStatOneLabel }}
            </CmsEditableNode>
            <p class="mt-3 text-5xl font-black text-highlighted">
              {{ syndicatCount }}
            </p>
            <CmsEditableNode
              tag="p"
              class="mt-2 text-base text-toned"
              :target="createEditableTarget(`${page.slug}:network-stat-one-description`, 'content.networkStatOneDescription', 'Description statistique 1', true)"
            >
              {{ renderDynamicText(content.networkStatOneDescription) }}
            </CmsEditableNode>
          </div>

          <div class="border border-default bg-muted p-5">
            <CmsEditableNode
              tag="p"
              class="text-sm uppercase tracking-[0.2em] text-dimmed"
              :target="createEditableTarget(`${page.slug}:network-stat-two-label`, 'content.networkStatTwoLabel', 'Label statistique 2')"
            >
              {{ content.networkStatTwoLabel }}
            </CmsEditableNode>
            <p class="mt-3 text-5xl font-black text-highlighted">
              {{ cityCount }}
            </p>
            <CmsEditableNode
              tag="p"
              class="mt-2 text-base text-toned"
              :target="createEditableTarget(`${page.slug}:network-stat-two-description`, 'content.networkStatTwoDescription', 'Description statistique 2', true)"
            >
              {{ renderDynamicText(content.networkStatTwoDescription) }}
            </CmsEditableNode>
          </div>
        </div>
      </div>
    </section>

    <section class="border-b border-default">
      <div class="public-container public-section">
        <div class="max-w-3xl space-y-4">
          <CmsEditableNode
            tag="h2"
            class="text-4xl font-black text-highlighted md:text-5xl"
            :target="createEditableTarget(`${page.slug}:missions-title`, 'content.missionsTitle', 'Titre missions')"
          >
            {{ content.missionsTitle }}
          </CmsEditableNode>
          <CmsEditableNode
            tag="p"
            class="text-lg leading-relaxed text-toned"
            :target="createEditableTarget(`${page.slug}:missions-intro`, 'content.missionsIntro', 'Introduction missions', true)"
          >
            {{ content.missionsIntro }}
          </CmsEditableNode>
        </div>

        <div class="mt-10 grid gap-6 lg:grid-cols-3">
          <template v-if="editor">
            <VueDraggable
              v-model="missionsModel"
              v-bind="cmsTouchDragOptions"
              tag="div"
              class="contents"
              :animation="180"
              ghost-class="opacity-60"
              chosen-class="scale-[1.02]"
              @start="editor.closeTarget()"
            >
              <CmsEditableNode
                v-for="(mission, index) in content.missions"
                :key="getItemKey(mission, 'mission', index)"
                tag="article"
                class="border border-default bg-muted p-6"
                :target="createListItemTarget(page.slug, 'feature', index, 'content.missions', 'Mission')"
              >
                <h3 class="text-2xl font-black text-highlighted">
                  {{ mission.title || 'Mission sans titre' }}
                </h3>
                <p class="mt-4 text-base leading-relaxed text-toned">
                  {{ mission.description }}
                </p>
              </CmsEditableNode>
            </VueDraggable>

            <CmsEditableNode
              tag="article"
              class="border border-dashed border-default bg-muted/60 p-6"
              :target="createListTarget(page.slug, 'feature', 'content.missions', 'Missions')"
            >
              <h3 class="text-2xl font-black text-highlighted">
                Ajouter une mission
              </h3>
              <p class="mt-4 text-base leading-relaxed text-toned">
                Créer une nouvelle carte de mission.
              </p>
            </CmsEditableNode>
          </template>

          <article
            v-for="(mission, index) in editor ? [] : content.missions"
            :key="getItemKey(mission, 'mission', index)"
            class="border border-default bg-muted p-6"
          >
            <h3 class="text-2xl font-black text-highlighted">
              {{ mission.title }}
            </h3>
            <p class="mt-4 text-base leading-relaxed text-toned">
              {{ mission.description }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="border-b border-default">
      <div class="public-container public-section grid gap-10 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-center">
        <div class="space-y-5">
          <CmsEditableNode
            tag="h2"
            class="text-4xl font-black text-highlighted md:text-5xl"
            :target="createEditableTarget(`${page.slug}:functioning-title`, 'content.functioningTitle', 'Titre fonctionnement')"
          >
            {{ content.functioningTitle }}
          </CmsEditableNode>
          <CmsEditableNode
            tag="p"
            class="max-w-4xl text-lg leading-relaxed text-toned"
            :target="createEditableTarget(`${page.slug}:functioning-body-1`, 'content.functioningBody1', 'Texte fonctionnement 1', true)"
          >
            {{ content.functioningBody1 }}
          </CmsEditableNode>
          <CmsEditableNode
            tag="p"
            class="max-w-4xl text-lg leading-relaxed text-toned"
            :target="createEditableTarget(`${page.slug}:functioning-body-2`, 'content.functioningBody2', 'Texte fonctionnement 2', true)"
          >
            {{ content.functioningBody2 }}
          </CmsEditableNode>
          <CmsEditableNode
            tag="div"
            :target="{
              id: `${page.slug}:functioning-cta-secondary`,
              kind: 'link',
              path: 'content',
              label: 'Bouton fonctionnement secondaire',
              fields: [
                { key: 'functioningCtaLabel', label: 'Libellé', kind: 'text' },
                { key: 'functioningCtaHref', label: 'Lien', kind: 'text' }
              ]
            }"
          >
            <UButton
              :label="content.functioningCtaLabel || 'Nous contacter'"
              icon="mingcute:mail-line"
              size="xl"
              color="neutral"
              variant="outline"
              :to="editor ? undefined : toLinkTo(contactHref)"
              :href="editor ? undefined : toLinkHref(contactHref)"
              :target="editor ? undefined : toLinkTarget(contactHref)"
            />
          </CmsEditableNode>
        </div>

        <CmsEditableNode
          tag="div"
          class="media-frame relative overflow-hidden border border-default"
          :target="{
            id: `${page.slug}:functioning-image`,
            kind: 'link',
            path: 'content',
            label: 'Image fonctionnement',
            fields: [
              { key: 'functioningImage', label: 'Image', kind: 'image', uploadEndpoint: '/api/cms/uploads/article-cover' },
              { key: 'functioningImageAlt', label: 'Texte alternatif', kind: 'text' }
            ]
          }"
        >
          <img
            :src="content.functioningImage || '/hero.jpg'"
            :alt="content.functioningImageAlt || 'Rassemblement militant'"
            class="h-full min-h-[24rem] w-full object-cover object-[58%_center] opacity-70 grayscale"
          >
          <div class="about-image-functioning-overlay absolute inset-0" />
        </CmsEditableNode>
      </div>
    </section>

    <section class="border-b border-default">
      <div class="public-container public-section grid gap-10 lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-center">
        <CmsEditableNode
          tag="div"
          class="media-frame relative overflow-hidden border border-default"
          :target="{
            id: `${page.slug}:history-image`,
            kind: 'link',
            path: 'content',
            label: 'Image histoire',
            fields: [
              { key: 'historyImage', label: 'Image', kind: 'image', uploadEndpoint: '/api/cms/uploads/article-cover' },
              { key: 'historyImageAlt', label: 'Texte alternatif', kind: 'text' }
            ]
          }"
        >
          <img
            :src="content.historyImage || '/hero.jpg'"
            :alt="content.historyImageAlt || 'Cortège étudiant'"
            class="h-full min-h-[22rem] w-full object-cover object-[40%_center] opacity-70 grayscale"
          >
          <div class="about-image-history-overlay absolute inset-0" />
        </CmsEditableNode>

        <div class="space-y-5">
          <CmsEditableNode
            tag="h2"
            class="text-4xl font-black text-highlighted md:text-5xl"
            :target="createEditableTarget(`${page.slug}:history-title`, 'content.historyTitle', 'Titre histoire')"
          >
            {{ content.historyTitle }}
          </CmsEditableNode>
          <CmsEditableNode
            tag="p"
            class="max-w-4xl text-lg leading-relaxed text-toned"
            :target="createEditableTarget(`${page.slug}:history-body-1`, 'content.historyBody1', 'Texte histoire 1', true)"
          >
            {{ content.historyBody1 }}
          </CmsEditableNode>
          <CmsEditableNode
            tag="p"
            class="max-w-4xl text-lg leading-relaxed text-toned"
            :target="createEditableTarget(`${page.slug}:history-body-2`, 'content.historyBody2', 'Texte histoire 2', true)"
          >
            {{ content.historyBody2 }}
          </CmsEditableNode>
        </div>
      </div>
    </section>

    <SiteSocialLinksSection :socials="siteSettings.socials" />
  </UPage>
</template>
