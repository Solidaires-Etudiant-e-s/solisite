<script setup lang="ts">
import type { CmsAboutPageContent } from '~~/lib/cms'

const page = defineModel<CmsPage>('page', {
  required: true
})
</script>

<template>
  <UPopover>
    <UButton
      label="Paramètres de la page"
      color="neutral"
      variant="outline"
    />

    <template #content>
      <div class="w-[24rem] space-y-4 p-4">
        <UFormField label="Titre SEO">
          <UInput v-model="page.title" />
        </UFormField>

        <UFormField label="Description SEO">
          <UTextarea
            v-model="page.description"
            :rows="3"
          />
        </UFormField>

        <template v-if="page.slug === 'articles'">
          <UFormField label="Texte de l’état vide">
            <UTextarea
              v-model="(page.content as CmsArticlesPageContent).emptyStateText"
              :rows="3"
            />
          </UFormField>
        </template>

        <template v-if="page.slug === 'guides'">
          <UFormField label="Texte de l’état vide">
            <UTextarea
              v-model="(page.content as CmsGuidesPageContent).emptyStateText"
              :rows="3"
            />
          </UFormField>
        </template>

        <template v-if="page.slug === 'syndicats'">
          <UFormField label="Texte de l’état vide">
            <UTextarea
              v-model="(page.content as CmsSyndicatsPageContent).emptyStateText"
              :rows="3"
            />
          </UFormField>
        </template>

        <template v-if="page.slug === 'a-propos'">
          <UFormField label="Libellé CTA réseau">
            <UInput v-model="(page.content as CmsAboutPageContent).networkCtaLabel" />
          </UFormField>

          <UFormField label="Lien CTA réseau">
            <UInput v-model="(page.content as CmsAboutPageContent).networkCtaHref" />
          </UFormField>

          <UFormField label="Libellé CTA contact">
            <UInput v-model="(page.content as CmsAboutPageContent).functioningCtaLabel" />
          </UFormField>

          <UFormField label="Lien CTA contact">
            <UInput v-model="(page.content as CmsAboutPageContent).functioningCtaHref" />
          </UFormField>
        </template>
      </div>
    </template>
  </UPopover>
</template>
