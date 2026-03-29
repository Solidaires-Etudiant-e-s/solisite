<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { createEditableTarget, createFieldTarget, createHtmlTarget } from '~/utils/cmsEditor'
import { formatFrenchDate } from '~/utils/cmsUi'

const props = defineProps<{
  article: CmsArticle
}>()

const targetIdPrefix = computed(() => `article:${props.article.id || 'draft'}`)
const publishedLabel = computed(() => formatFrenchDate(props.article.publishedAt))
const title = computed(() => props.article.title || 'Article sans titre')
const excerpt = computed(() => props.article.excerpt || 'Ajoute un extrait pour résumer le contenu de cet article.')
const content = computed(() => props.article.content || '<p>Commence à écrire pour prévisualiser l’article.</p>')
const coverImage = computed(() => props.article.coverImage || '/hero.jpg')
</script>

<template>
  <UPage>
    <div class="border-b border-default public-section">
      <div class="public-container public-container--narrow flex flex-col gap-6">
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

    <UPageBody>
      <div class="public-container public-container--narrow public-section space-y-10">
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
