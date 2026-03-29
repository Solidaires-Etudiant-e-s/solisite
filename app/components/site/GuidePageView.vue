<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { createEditableTarget, createFieldTarget, createHtmlTarget } from '~/utils/cmsEditor'
import { formatFrenchDate } from '~/utils/cmsUi'

const props = defineProps<{
  guide: CmsGuide
}>()

const targetIdPrefix = computed(() => `guide:${props.guide.id || 'draft'}`)
const publishedLabel = computed(() => formatFrenchDate(props.guide.publishedAt))
const title = computed(() => props.guide.title || 'Guide sans titre')
const excerpt = computed(() => props.guide.excerpt || 'Ajoute un extrait pour résumer le contenu de ce guide.')
const content = computed(() => props.guide.content || '<p>Commence à écrire pour prévisualiser le guide.</p>')
const coverImage = computed(() => props.guide.coverImage || '/hero.jpg')
const pdfFile = computed(() => props.guide.pdfFile || '')
</script>

<template>
  <UPage>
    <div class="border-b border-default px-6 py-12">
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <CmsEditableNode
          tag="span"
          class="inline-flex text-sm"
          :target="createFieldTarget(`${targetIdPrefix}:published-at`, '', 'Date de publication', [{
            key: 'publishedAt',
            label: 'Date de publication',
            kind: 'datetime'
          }])"
        >
          {{ publishedLabel }}
        </CmsEditableNode>

        <CmsEditableNode
          tag="h1"
          class="text-4xl font-bold tracking-tight text-highlighted sm:text-5xl"
          :target="createEditableTarget(`${targetIdPrefix}:title`, 'title', 'Titre')"
        >
          {{ title }}
        </CmsEditableNode>

        <CmsEditableNode
          tag="div"
          class="text-lg text-toned"
          :target="createEditableTarget(`${targetIdPrefix}:excerpt`, 'excerpt', 'Extrait', true)"
        >
          {{ excerpt }}
        </CmsEditableNode>
      </div>
    </div>

    <UPageBody class="py-10">
      <div class="mx-auto max-w-3xl space-y-10 px-4 sm:px-0">
        <CmsEditableNode
          tag="div"
          :target="createFieldTarget(`${targetIdPrefix}:cover-image`, '', 'Image de couverture', [{
            key: 'coverImage',
            label: 'Image de couverture',
            kind: 'image',
            uploadEndpoint: '/api/cms/uploads/article-cover'
          }])"
        >
          <div class="overflow-hidden rounded-2xl border border-default bg-muted">
            <img
              :src="coverImage"
              :alt="title"
              class="h-96 w-full object-cover"
            >
          </div>
        </CmsEditableNode>

        <CmsEditableNode
          tag="div"
          :target="createFieldTarget(`${targetIdPrefix}:pdf-file`, '', 'Fichier PDF', [{
            key: 'pdfFile',
            label: 'PDF du guide',
            kind: 'file',
            uploadEndpoint: '/api/cms/uploads/content-file'
          }])"
        >
          <UButton
            block
            size="xl"
            color="primary"
            variant="solid"
            icon="mingcute:download-2-line"
            :href="pdfFile || undefined"
            :disabled="!pdfFile"
            target="_blank"
          >
            {{ pdfFile ? 'Télécharger le guide en PDF' : 'Ajoute un PDF pour activer le téléchargement' }}
          </UButton>
        </CmsEditableNode>

        <CmsEditableNode
          tag="div"
          :target="createHtmlTarget(`${targetIdPrefix}:content`, 'content', 'Contenu')"
        >
          <div
            class="prose-content max-w-none text-base leading-8"
            v-html="content"
          />
        </CmsEditableNode>
      </div>
    </UPageBody>
  </UPage>
</template>
