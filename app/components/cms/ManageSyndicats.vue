<script setup lang="ts">
import type { CmsSyndicat } from '~~/lib/cms'

interface LdapSyndicat {
  uid: string
  cn: string
  mail: string
  description: string
}

interface CmsSyndicatWithLink extends CmsSyndicat {
  linkedIntranetUid: string | null
  linkedIntranetEmail: string | null
}

interface AdminSyndicatsData {
  syndicats: CmsSyndicatWithLink[]
  unlinkedLdapUsers: LdapSyndicat[]
}

const { data, refresh: refreshData } = await useFetch<AdminSyndicatsData>('/api/admin/syndicats')

const toast = useToast()
const syncing = ref<string | null>(null)
const linkModal = ref(false)
const linkTarget = ref<CmsSyndicatWithLink | null>(null)
const selectedLdapUid = ref('')
const selectedLdapItem = computed({
  get() {
    return ldapSelectItems.value.find(i => i.value === selectedLdapUid.value) ?? undefined
  },
  set(item: { label: string, value: string } | undefined) {
    selectedLdapUid.value = item?.value ?? ''
  }
})

const syndicats = computed(() => data.value?.syndicats ?? [])
const unlinkedLdapUsers = computed(() => data.value?.unlinkedLdapUsers ?? [])

async function doRefresh() {
  await refreshData()
}

function getCmsSyndicatDisplay(syndicat: CmsSyndicatWithLink): string {
  const parts = [syndicat.name]
  if (syndicat.city) parts.push(syndicat.city)
  return parts.join(' - ') || 'Sans nom'
}

function openLinkModal(syndicat: CmsSyndicatWithLink) {
  linkTarget.value = syndicat
  selectedLdapUid.value = ''
  linkModal.value = true
}

function closeLinkModal() {
  linkModal.value = false
  linkTarget.value = null
  selectedLdapUid.value = ''
}

async function linkSyndicat() {
  if (!linkTarget.value || !selectedLdapUid.value) return

  syncing.value = `link-${linkTarget.value.id}`
  try {
    await $fetch('/api/admin/syndicats/link', {
      method: 'POST',
      body: { syndicatId: linkTarget.value.id, ldapUid: selectedLdapUid.value }
    })
    toast.add({ title: 'Syndicat lié avec succès', color: 'success' })
    closeLinkModal()
    await doRefresh()
  } catch (error: unknown) {
    toast.add({ title: (error as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Erreur lors du lien', color: 'error' })
  } finally {
    syncing.value = null
  }
}

async function unlinkSyndicat(syndicatId: number) {
  syncing.value = `unlink-${syndicatId}`
  try {
    await $fetch('/api/admin/syndicats/unlink', {
      method: 'POST',
      body: { cmsId: syndicatId }
    })
    toast.add({ title: 'Syndicat délié', color: 'success' })
    await doRefresh()
  } catch (error: unknown) {
    toast.add({ title: (error as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Erreur', color: 'error' })
  } finally {
    syncing.value = null
  }
}

async function toggleEnabled(syndicatId: number, enabled: boolean) {
  syncing.value = `toggle-${syndicatId}`
  try {
    await $fetch(`/api/admin/syndicats/${syndicatId}/toggle`, {
      method: 'POST',
      body: { enabled }
    })
    toast.add({ title: `Syndicat ${enabled ? 'activé' : 'désactivé'}`, color: 'success' })
    await doRefresh()
  } catch (error: unknown) {
    toast.add({ title: (error as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Erreur', color: 'error' })
  } finally {
    syncing.value = null
  }
}

async function createFromLdap(ldapUid: string) {
  syncing.value = `create-${ldapUid}`
  try {
    await $fetch('/api/admin/syndicats/create-from-ldap', {
      method: 'POST',
      body: { ldapUid }
    })
    toast.add({ title: 'Syndicat créé depuis Intranet', color: 'success' })
    await doRefresh()
  } catch (error: unknown) {
    toast.add({ title: (error as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Erreur', color: 'error' })
  } finally {
    syncing.value = null
  }
}

const ldapSelectItems = computed(() =>
  unlinkedLdapUsers.value.map(l => ({ label: `${l.cn} (${l.mail})`, value: l.uid }))
)
</script>

<template>
  <UDashboardPanel
    id="cms-manage-syndicats"
    class="min-w-0 overflow-y-auto bg-default"
  >
    <template #header>
      <div class="flex items-center justify-between gap-3 px-4 py-4">
        <div>
          <h1 class="text-2xl text-highlighted">
            Gestion des syndicats
          </h1>
          <p class="text-sm text-dimmed">
            Gère les comptes Intranet liés, l'activation et la création de syndicats.
          </p>
        </div>

        <UButton
          icon="mingcute:refresh-2-line"
          variant="ghost"
          @click="doRefresh"
        >
          Actualiser
        </UButton>
      </div>
    </template>

    <template #body>
      <div class="space-y-6 p-4">
        <UAlert
          v-if="unlinkedLdapUsers.length > 0"
          color="warning"
          icon="mingcute:alert-line"
          :title="`${unlinkedLdapUsers.length} syndicat(s) Intranet non lié(s) au CMS`"
          description="Ces comptes YunoHost ne sont pas encore associés à un syndicat dans le CMS."
        />

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="mingcute:group-line"
                class="text-lg"
              />
              <h2 class="text-lg font-semibold">
                Syndicats Intranet disponibles
              </h2>
            </div>
          </template>

          <div
            v-if="unlinkedLdapUsers.length === 0"
            class="text-center py-8 text-muted"
          >
            Tous les syndicats Intranet sont liés au CMS
          </div>
          <UTable
            v-else
            :data="unlinkedLdapUsers"
            :columns="[
              { accessorFn: (row: LdapSyndicat) => row.cn, header: 'Nom (CN)', id: 'cn' },
              { accessorFn: (row: LdapSyndicat) => row.mail, header: 'Email', id: 'mail' },
              { accessorFn: (row: LdapSyndicat) => row.description?.split('\n')[0] || '—', header: 'Description / Ville', id: 'description' },
              { id: 'actions', header: '' }
            ]"
          >
            <template #actions-cell="{ row }">
              <UButton
                size="xs"
                :loading="syncing === `create-${row.original.uid}`"
                @click="createFromLdap(row.original.uid)"
              >
                Créer dans le CMS
              </UButton>
            </template>
          </UTable>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="mingcute:map-pin-line"
                class="text-lg"
              />
              <h2 class="text-lg font-semibold">
                Syndicats dans le CMS ({{ syndicats.length }})
              </h2>
            </div>
          </template>

          <div
            v-if="syndicats.length === 0"
            class="text-center py-8 text-muted"
          >
            Aucun syndicat dans le CMS
          </div>
          <UTable
            v-else
            :data="syndicats"
            :columns="[
              { accessorFn: (row: CmsSyndicatWithLink) => row.name, header: 'Nom', id: 'name' },
              { accessorFn: (row: CmsSyndicatWithLink) => row.city || '—', header: 'Ville', id: 'city' },
              { accessorFn: (row: CmsSyndicatWithLink) => row.enabled, header: 'État', id: 'enabled' },
              { accessorFn: (row: CmsSyndicatWithLink) => row.linkedIntranetEmail || row.email, header: 'Email', id: 'email' },
              { id: 'actions', header: '' }
            ]"
          >
            <template #enabled-cell="{ row }">
              <USwitch
                :model-value="row.original.enabled"
                :label="row.original.enabled ? 'Actif' : 'Désactivé'"
                :loading="syncing === `toggle-${row.original.id}`"
                @update:model-value="toggleEnabled(row.original.id, !row.original.enabled)"
              />
            </template>
            <template #email-cell="{ row }">
              <UBadge
                :label="row.original.linkedIntranetUid ? 'Lié' : 'Non lié'"
                :color="row.original.linkedIntranetUid ? 'success' : 'warning'"
                variant="subtle"
              />
              <span
                v-if="row.original.linkedIntranetEmail"
                class="ml-2 text-xs text-muted"
              >
                {{ row.original.linkedIntranetEmail }}
              </span>
            </template>
            <template #actions-cell="{ row }">
              <div class="flex items-center gap-1">
                <UButton
                  v-if="!row.original.linkedIntranetUid"
                  size="xs"
                  color="primary"
                  icon="mingcute:link-line"
                  :loading="syncing === `link-${row.original.id}`"
                  @click="openLinkModal(row.original)"
                >
                  Lier
                </UButton>
                <UButton
                  v-else
                  size="xs"
                  color="error"
                  variant="soft"
                  icon="mingcute:unlink-line"
                  :loading="syncing === `unlink-${row.original.id}`"
                  @click="unlinkSyndicat(row.original.id)"
                >
                  Délier
                </UButton>
              </div>
            </template>
          </UTable>
        </UCard>

        <UModal
          v-model:open="linkModal"
          title="Lier un syndicat Intranet"
        >
          <template #body>
            <div class="space-y-4">
              <p
                v-if="linkTarget"
                class="text-sm text-muted"
              >
                Syndicat CMS: <strong>{{ getCmsSyndicatDisplay(linkTarget) }}</strong>
              </p>
              <USelectMenu
                v-model="selectedLdapItem"
                :items="ldapSelectItems"
                placeholder="Choisir un syndicat Intranet..."
              />
            </div>
          </template>
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                variant="ghost"
                @click="closeLinkModal"
              >
                Annuler
              </UButton>
              <UButton
                :disabled="!selectedLdapUid"
                :loading="syncing?.startsWith('link-')"
                @click="linkSyndicat"
              >
                Lier
              </UButton>
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
