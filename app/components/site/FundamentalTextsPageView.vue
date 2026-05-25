<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import type { AccordionItem } from '@nuxt/ui'
import { createEditableTarget, createHtmlTarget, createListItemTarget, createListTarget } from '~/utils/cmsEditor'
import type { CmsFundamentalText, CmsFundamentalTextsPageContent } from '~~/lib/cms'

const props = defineProps<{
  page: CmsPage
}>()

const content = computed(() => props.page.content as CmsFundamentalTextsPageContent)
const texts = computed(() => content.value.texts || [])
const editor = useCmsPageLiveEditor()
const accordionItems = computed<AccordionItem[]>(() => texts.value.map((text, index) => ({
  label: text.title || `Texte ${index + 1}`,
  value: String(index),
  icon: 'mingcute:file-certificate-line'
})))
const defaultOpenValues = computed(() => texts.value.length ? ['0'] : [])

function textByItem(item: AccordionItem) {
  const index = Number(item.value)

  return Number.isInteger(index) && index >= 0 ? texts.value[index] : null
}

function textIndex(item: AccordionItem) {
  const index = Number(item.value)

  return Number.isInteger(index) && index >= 0 ? index : 0
}

function fallbackBody(text: CmsFundamentalText | null | undefined) {
  return text?.body || '<p>Ajoute le contenu de ce texte depuis l’administration.</p>'
}
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
          tag="p"
          class="mb-8 text-base leading-8 text-toned"
          :target="createEditableTarget(`${page.slug}:intro`, 'content.intro', 'Introduction', true)"
        >
          {{ content.intro }}
        </CmsEditableNode>

        <UAccordion
          type="multiple"
          :items="accordionItems"
          :default-value="defaultOpenValues"
          :unmount-on-hide="false"
          :ui="{
            item: 'border-b border-default last:border-b',
            trigger: 'py-5 text-left text-lg font-bold text-highlighted',
            leadingIcon: 'size-5 text-primary',
            trailingIcon: 'size-5 text-primary',
            body: 'pb-8'
          }"
        >
          <template #body="{ item }">
            <div class="space-y-5">
              <CmsEditableNode
                v-if="editor"
                tag="div"
                class="inline-flex"
                :target="createListItemTarget(page.slug, 'fundamental-text', textIndex(item), 'content.texts', 'Texte fondamental')"
              >
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="mingcute:edit-2-line"
                  label="Modifier le titre"
                />
              </CmsEditableNode>

              <CmsEditableNode
                tag="div"
                :target="createHtmlTarget(`${page.slug}:text:${textIndex(item)}:body`, `content.texts[${textIndex(item)}].body`, `Contenu de ${textByItem(item)?.title || 'ce texte'}`)"
              >
                <div
                  class="prose-content max-w-none text-base leading-8"
                  v-html="fallbackBody(textByItem(item))"
                />
              </CmsEditableNode>
            </div>
          </template>
        </UAccordion>

        <CmsEditableNode
          v-if="editor"
          tag="div"
          class="mt-6"
          :target="createListTarget(page.slug, 'fundamental-text', 'content.texts', 'Textes fondamentaux')"
        >
          <UPageCard
            title="Ajouter un texte"
            description="Créer un nouveau volet accordéon."
            icon="mingcute:plus-line"
            class="opacity-70"
          />
        </CmsEditableNode>
      </div>
    </UPageBody>
  </UPage>
</template>
