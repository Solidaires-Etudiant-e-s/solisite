<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { VueDraggable } from 'vue-draggable-plus'
import { createEditableTarget, createHtmlTarget, createListItemTarget, createListTarget } from '~/utils/cmsEditor'
import { cmsTouchDragOptions } from '~/utils/cmsDrag'
import { createStableItemKeyResolver } from '~/utils/cmsUi'
import type { CmsInternationalPageContent } from '~~/lib/cms'

const props = defineProps<{
  page: CmsPage
}>()

const content = computed(() => props.page.content as CmsInternationalPageContent)
const body = computed(() => content.value.body || '<p>Lorem ipsum dolor sit amet.</p>')
const editor = useCmsPageLiveEditor()
const getItemKey = createStableItemKeyResolver()
const partnersModel = computed({
  get: () => content.value.partners,
  set: (value) => {
    content.value.partners = value
  }
})
</script>

<template>
  <UPage>
    <section class="border-b border-default">
      <div class="public-container public-container--narrow public-section">
        <CmsEditableNode
          tag="h1"
          class="max-w-4xl text-5xl font-black text-highlighted"
          :target="createEditableTarget(`${page.slug}:headline`, 'headline', 'Titre principal')"
        >
          {{ page.headline }}
        </CmsEditableNode>

        <CmsEditableNode
          tag="p"
          class="mt-4 max-w-3xl text-lg text-toned"
          :target="createEditableTarget(`${page.slug}:subheadline`, 'subheadline', 'Sous-titre', true)"
        >
          {{ page.subheadline }}
        </CmsEditableNode>
      </div>
    </section>

    <UPageBody>
      <div class="public-container public-container--narrow public-section">
        <CmsEditableNode
          tag="div"
          :target="createHtmlTarget(`${page.slug}:body`, 'content.body', 'Contenu')"
        >
          <div
            class="prose-content max-w-none text-base leading-8"
            v-html="body"
          />
        </CmsEditableNode>
      </div>

      <UPageSection
        id="international-partners"
        class="border-t border-default"
        :ui="{
          container: 'public-container px-3 py-10 sm:px-4 sm:py-14 lg:px-5 lg:py-16 gap-6 sm:gap-10',
          body: 'mt-6 sm:mt-10'
        }"
      >
        <template #title>
          <CmsEditableNode
            tag="div"
            class="inline-block"
            :target="createEditableTarget(`${page.slug}:partners-title`, 'content.partnersTitle', 'Titre des partenaires internationaux')"
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
                :target="createListItemTarget(page.slug, 'partner', index, 'content.partners', 'Partenaire international')"
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
              :target="createListTarget(page.slug, 'partner', 'content.partners', 'Partenaires internationaux')"
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
    </UPageBody>
  </UPage>
</template>
