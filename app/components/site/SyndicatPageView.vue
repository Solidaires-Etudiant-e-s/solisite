<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { VueDraggable } from 'vue-draggable-plus'
import { createEditableTarget, createHtmlTarget, createListItemTarget, createListTarget } from '~/utils/cmsEditor'
import { cmsTouchDragOptions } from '~/utils/cmsDrag'
import { toLinkTarget } from '~/utils/cmsUi'
import { formatSyndicatDisplayName } from '~~/lib/cms'

const props = defineProps<{
  syndicat: CmsSyndicat
  unionName?: string
}>()

const editor = useCmsPageLiveEditor()
const targetIdPrefix = computed(() => `syndicat:${props.syndicat.id || 'draft'}`)
const displayName = computed(() => formatSyndicatDisplayName(props.syndicat.name || 'Syndicat local', props.unionName))
const showCitySubtitle = computed(() => {
  const city = props.syndicat.city?.trim()
  const name = props.syndicat.name?.trim()

  if (!city) {
    return false
  }

  return city.localeCompare(name || '', undefined, { sensitivity: 'base' }) !== 0
})

const hasContactLinks = computed(() => Boolean(props.syndicat.email || props.syndicat.socials.some(social => social.href)))
</script>

<template>
  <UPage>
    <section class="border-b border-default">
      <div class="public-container public-section">
        <p class="text-sm font-semibold text-primary">
          Syndicat local
        </p>

        <CmsEditableNode
          tag="h1"
          class="mt-4 max-w-4xl text-5xl font-black text-highlighted"
          :target="createEditableTarget(`${targetIdPrefix}:name`, 'name', 'Nom du syndicat')"
        >
          {{ displayName }}
        </CmsEditableNode>

        <CmsEditableNode
          v-if="showCitySubtitle || editor"
          tag="p"
          class="mt-4 max-w-3xl text-lg text-toned"
          :target="createEditableTarget(`${targetIdPrefix}:city-subtitle`, 'city', 'Ville')"
        >
          {{ syndicat.city || 'Ville à préciser' }}
        </CmsEditableNode>
      </div>
    </section>

    <UPageBody class="!mt-0 !space-y-0">
      <div class="public-container grid items-start gap-8 pt-4 pb-10 sm:pt-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <UCard class="self-start">
          <div class="space-y-5">
            <div>
              <p class="text-sm font-medium text-muted">
                Ville
              </p>
              <CmsEditableNode
                tag="p"
                class="mt-1 text-base text-highlighted"
                :target="createEditableTarget(`${targetIdPrefix}:city`, 'city', 'Ville')"
              >
                {{ syndicat.city || 'À préciser' }}
              </CmsEditableNode>
            </div>

            <div>
              <p class="text-sm font-medium text-muted">
                Contacts
              </p>

              <div class="mt-3 flex flex-col gap-2">
                <CmsEditableNode
                  v-if="syndicat.email || editor"
                  tag="div"
                  :target="createEditableTarget(`${targetIdPrefix}:email`, 'email', 'E-mail')"
                >
                  <UButton
                    label="Mail"
                    :href="editor ? undefined : (syndicat.email ? `mailto:${syndicat.email}` : undefined)"
                    color="neutral"
                    variant="outline"
                    icon="mingcute:mail-line"
                    trailing
                    block
                  />
                </CmsEditableNode>

                <VueDraggable
                  v-if="editor"
                  :model-value="syndicat.socials"
                  v-bind="cmsTouchDragOptions"
                  tag="div"
                  class="flex flex-col gap-2"
                  :animation="180"
                  ghost-class="opacity-60"
                  chosen-class="scale-[1.02]"
                  @update:model-value="editor.updateField('socials', $event)"
                  @start="editor.closeTarget()"
                >
                  <CmsEditableNode
                    v-for="(social, index) in syndicat.socials"
                    :key="index"
                    tag="div"
                    :target="createListItemTarget(targetIdPrefix, 'social', index, 'socials', 'Lien social')"
                  >
                    <UButton
                      :label="social.label || social.href || `Lien ${index + 1}`"
                      color="neutral"
                      variant="outline"
                      :icon="social.icon || 'mingcute:link-line'"
                      trailing
                      block
                    />
                  </CmsEditableNode>
                </VueDraggable>

                <template v-else>
                  <UButton
                    v-for="(social, index) in syndicat.socials"
                    :key="index"
                    :label="social.label || social.href || `Lien ${index + 1}`"
                    :href="social.href"
                    :target="toLinkTarget(social.href || '')"
                    color="neutral"
                    variant="outline"
                    :icon="social.icon || 'mingcute:link-line'"
                    trailing
                    block
                  />
                </template>

                <CmsEditableNode
                  v-if="editor"
                  tag="div"
                  :target="createListTarget(targetIdPrefix, 'social', 'socials', 'Réseaux sociaux')"
                >
                  <UButton
                    label="Ajouter un lien"
                    icon="mingcute:plus-line"
                    color="neutral"
                    variant="outline"
                    block
                  />
                </CmsEditableNode>

                <p
                  v-else-if="!hasContactLinks"
                  class="text-sm text-muted"
                >
                  Aucun contact renseigné.
                </p>
              </div>
            </div>

            <div>
              <p class="text-sm font-medium text-muted">
                Adresse
              </p>
              <CmsEditableNode
                tag="p"
                class="mt-1 whitespace-pre-line text-sm leading-6 text-toned"
                :target="createEditableTarget(`${targetIdPrefix}:address`, 'address', 'Adresse du local', true)"
              >
                {{ syndicat.address || 'Adresse à préciser' }}
              </CmsEditableNode>
            </div>
          </div>
        </UCard>

        <div class="space-y-6">
          <CmsEditableNode
            tag="div"
            :target="createHtmlTarget(`${targetIdPrefix}:content`, 'content', 'Contenu')"
          >
            <UCard v-if="!syndicat.content">
              <p class="text-sm text-muted">
                Ajoute une présentation pour ce syndicat.
              </p>
            </UCard>

            <div
              v-else
              class="prose-content max-w-none text-base leading-8"
              v-html="syndicat.content"
            />
          </CmsEditableNode>
        </div>
      </div>
    </UPageBody>
  </UPage>
</template>
