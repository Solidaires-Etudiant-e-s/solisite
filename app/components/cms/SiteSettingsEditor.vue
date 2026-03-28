<script setup lang="ts">
import { createEmptySocialLink } from '~~/lib/cms'

const siteSettings = defineModel<CmsSiteSettings>('siteSettings', {
  required: true
})

function addSocial() {
  siteSettings.value.socials.push(createEmptySocialLink())
}

function removeSocial(index: number) {
  siteSettings.value.socials.splice(index, 1)
}
</script>

<template>
  <div class="space-y-5">
    <div class="grid gap-4">
      <UFormField label="Nom global du syndicat">
        <UInput v-model="siteSettings.unionName" />
      </UFormField>

      <UFormField label="Description globale">
        <UTextarea
          v-model="siteSettings.siteDescription"
          :rows="3"
        />
      </UFormField>

      <div class="grid gap-4 md:grid-cols-2">
        <UFormField label="Email de contact">
          <UInput v-model="siteSettings.contactEmail" />
        </UFormField>

        <UFormField label="Téléphone de contact">
          <UInput v-model="siteSettings.contactPhone" />
        </UFormField>
      </div>

      <UFormField label="Adresse">
        <UTextarea
          v-model="siteSettings.address"
          :rows="4"
        />
      </UFormField>

      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <UFormField
            label="Réseaux sociaux"
            description="Chaque entrée alimente la liste d’icônes affichée dans l’en-tête."
          />

          <UButton
            label="Ajouter un réseau"
            icon="mingcute:plus-line"
            color="neutral"
            variant="outline"
            @click="addSocial"
          />
        </div>

        <div
          v-if="siteSettings.socials.length"
          class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <div
            v-for="(social, index) in siteSettings.socials"
            :key="`${index}-${social.label}`"
            class="rounded-lg border border-default p-4"
          >
            <div class="mb-4 flex items-center justify-between gap-3">
              <p class="font-medium text-highlighted">
                Réseau {{ index + 1 }}
              </p>

              <UButton
                icon="mingcute:delete-2-line"
                color="error"
                variant="ghost"
                square
                @click="removeSocial(index)"
              />
            </div>

            <div class="grid gap-4">
              <UFormField label="Nom">
                <UInput
                  v-model="social.label"
                  placeholder="Instagram"
                />
              </UFormField>

              <UFormField label="Lien">
                <UInput
                  v-model="social.href"
                  placeholder="https://…"
                />
              </UFormField>

              <UFormField label="Icône">
                <CmsIconPicker
                  v-model="social.icon"
                  label="Rechercher une icône Mingcute..."
                />
              </UFormField>
            </div>
          </div>
        </div>

        <p
          v-else
          class="text-sm text-dimmed"
        >
          Aucun réseau social configuré.
        </p>
      </div>
    </div>
  </div>
</template>
