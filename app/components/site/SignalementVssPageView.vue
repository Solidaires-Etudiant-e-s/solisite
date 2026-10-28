<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { createEditableTarget, createHtmlTarget } from '~/utils/cmsEditor'
import { toLinkHref, toLinkTarget, toLinkTo } from '~/utils/cmsUi'
import type { CmsSignalementVssPageContent } from '~~/lib/cms'

const props = defineProps<{
  page: CmsPage
}>()

const content = computed(() => props.page.content as CmsSignalementVssPageContent)
const body = computed(() => content.value.body || '<p>Contenu en cours de rédaction.</p>')
const editor = useCmsPageLiveEditor()
const formHref = computed(() => content.value.formHref || 'https://framaforms.org/formulaire-de-signalement-vssoppression-sesl-1788696868')
const emailHref = computed(() => content.value.emailHref || 'mailto:vss@solidaires-etudiant-e-s.org')
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

        <div class="mt-6 flex flex-wrap gap-3">
          <CmsEditableNode
            tag="div"
            :target="{
              id: `${page.slug}:form-cta`,
              kind: 'link',
              path: 'content',
              label: 'Bouton formulaire de signalement',
              fields: [
                { key: 'formHref', label: 'Lien du formulaire', kind: 'text' }
              ]
            }"
          >
            <UButton
              label="Accéder au formulaire de signalement"
              icon="mingcute:clipboard-line"
              size="xl"
              :to="editor ? undefined : toLinkTo(formHref)"
              :href="editor ? undefined : toLinkHref(formHref)"
              :target="editor ? undefined : toLinkTarget(formHref)"
            />
          </CmsEditableNode>

          <CmsEditableNode
            tag="div"
            :target="{
              id: `${page.slug}:email-cta`,
              kind: 'link',
              path: 'content',
              label: 'Bouton mail de signalement',
              fields: [
                { key: 'emailHref', label: 'Lien e-mail', kind: 'text' }
              ]
            }"
          >
            <UButton
              label="Envoyer un mail à la référence VSS"
              icon="mingcute:mail-line"
              size="xl"
              color="neutral"
              variant="outline"
              :to="editor ? undefined : toLinkTo(emailHref)"
              :href="editor ? undefined : toLinkHref(emailHref)"
              :target="editor ? undefined : toLinkTarget(emailHref)"
            />
          </CmsEditableNode>
        </div>
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
