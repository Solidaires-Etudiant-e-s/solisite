<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { createEditableTarget, createHtmlTarget } from '~/utils/cmsEditor'
import { toLinkHref, toLinkTarget, toLinkTo } from '~/utils/cmsUi'
import type { CmsSignalementVssPageContent } from '~~/lib/cms'

const props = defineProps<{
  page: CmsPage
}>()

const content = computed(() => props.page.content as CmsSignalementVssPageContent)
const lockedBody = computed(() => content.value.body || '<p>Contenu en cours de rédaction.</p>')
const editor = useCmsPageLiveEditor()
const isPreview = computed(() => !!editor)

// Real links are only revealed after solving the captcha (or in CMS preview).
const revealedFormHref = ref('')
const revealedEmailHref = ref('')
const revealedBody = ref('')
const unlocked = computed(() => isPreview.value || revealedFormHref.value !== '')

const displayBody = computed(() => (unlocked.value && revealedBody.value) || lockedBody.value)
const formHref = computed(() => (isPreview.value ? content.value.formHref : revealedFormHref.value) || '')
const emailHref = computed(() => (isPreview.value ? content.value.emailHref : revealedEmailHref.value) || '')

const captchaToken = ref('')
const captchaQuestion = ref('')
const captchaAnswer = ref('')
const captchaLoading = ref(false)
const captchaError = ref('')

async function loadChallenge() {
  captchaLoading.value = true
  captchaError.value = ''

  try {
    const challenge = await $fetch<{ token: string, question: string }>('/api/signalement-vss/captcha')

    captchaToken.value = challenge.token
    captchaQuestion.value = challenge.question
    captchaAnswer.value = ''
  } catch {
    captchaError.value = 'Impossible de charger la vérification, réessayez.'
  } finally {
    captchaLoading.value = false
  }
}

async function verifyCaptcha() {
  if (!captchaAnswer.value.trim() || !captchaToken.value) {
    return
  }

  captchaLoading.value = true
  captchaError.value = ''

  try {
    const result = await $fetch<{ formHref: string, emailHref: string, body: string }>('/api/signalement-vss/unlock', {
      method: 'POST',
      body: { token: captchaToken.value, answer: captchaAnswer.value }
    })

    revealedFormHref.value = result.formHref
    revealedEmailHref.value = result.emailHref
    revealedBody.value = result.body
  } catch (error) {
    const message = (error as { data?: { message?: string } })?.data?.message

    captchaError.value = message || 'Mauvaise réponse, réessayez.'

    if (!message || !message.includes('Mauvaise réponse')) {
      await loadChallenge()
    }
  } finally {
    captchaLoading.value = false
  }
}

onMounted(() => {
  if (!isPreview.value) {
    void loadChallenge()
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

        <div
          v-if="unlocked"
          class="mt-6 flex flex-wrap gap-3"
        >
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

        <UCard
          v-else
          class="mt-6 max-w-xl"
        >
          <template #header>
            <p class="flex items-center gap-2 font-semibold">
              <UIcon name="mingcute:shield-line" />
              Vérification anti-spam
            </p>
          </template>

          <p class="text-sm text-toned">
            Pour limiter les signalements automatiques abusifs, répondez à cette petite question pour révéler les liens de signalement.
          </p>

          <form
            class="mt-4 flex flex-wrap items-end gap-3"
            @submit.prevent="verifyCaptcha"
          >
            <div class="min-w-48 flex-1">
              <label
                v-if="captchaQuestion"
                class="mb-1 block text-sm font-medium"
                for="signalement-captcha-answer"
              >
                {{ captchaQuestion }}
              </label>
              <USkeleton
                v-else
                class="h-5 w-48"
              />
              <UInput
                id="signalement-captcha-answer"
                v-model="captchaAnswer"
                placeholder="Votre réponse"
                inputmode="numeric"
                autocomplete="off"
                :disabled="captchaLoading || !captchaToken"
              />
            </div>

            <UButton
              type="submit"
              label="Révéler les liens"
              icon="mingcute:check-line"
              :loading="captchaLoading"
              :disabled="!captchaAnswer.trim() || !captchaToken"
            />

            <UButton
              icon="mingcute:refresh-line"
              color="neutral"
              variant="ghost"
              aria-label="Nouvelle question"
              :disabled="captchaLoading"
              @click="loadChallenge"
            />
          </form>

          <p
            v-if="captchaError"
            class="mt-3 text-sm text-error"
          >
            {{ captchaError }}
          </p>
        </UCard>
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
            v-html="displayBody"
          />
        </CmsEditableNode>
      </div>
    </UPageBody>
  </UPage>
</template>
