<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { createEditableTarget, createHtmlTarget } from '~/utils/cmsEditor'
import type { CmsInternationalPageContent } from '~~/lib/cms'

const props = defineProps<{
  page: CmsPage
}>()

const content = computed(() => props.page.content as CmsInternationalPageContent)
const body = computed(() => content.value.body || '<p>Lorem ipsum dolor sit amet.</p>')
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
    </UPageBody>
  </UPage>
</template>
