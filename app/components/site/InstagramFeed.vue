<script setup lang="ts">
const props = withDefaults(defineProps<{
  username: string
  columns?: number
}>(), {
  columns: 3
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))`
}))

const { data: feed } = await useFetch<CmsInstagramFeed>(
  () => `/api/instagram/${encodeURIComponent(props.username)}`
)

const visiblePosts = computed(() => (feed.value?.posts || []).slice(0, 6))
const show = computed(() => Boolean(feed.value?.posts?.length))
</script>

<template>
  <div
    v-if="show"
    class="overflow-hidden rounded-xl border border-default bg-surface"
  >
    <div class="flex items-center gap-3 border-b border-default px-4 py-3">
      <NuxtImg
        v-if="feed?.profilePictureUrl"
        :src="feed.profilePictureUrl"
        :alt="feed?.profileName"
        format="webp"
        class="h-10 w-10 rounded-full object-cover"
      />

      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-highlighted">
          {{ feed?.profileName }}
        </p>
        <p class="truncate text-xs text-muted">
          @{{ feed?.username }}
        </p>
      </div>

      <a
        :href="`https://www.instagram.com/${feed?.username}/`"
        target="_blank"
        rel="noopener"
        aria-label="Voir le profil Instagram"
        class="cursor-pointer"
      >
        <UButton
          icon="mingcute:instagram-line"
          color="neutral"
          variant="outline"
          square
          size="xl"
          class="cursor-pointer"
        />
      </a>
    </div>

    <div
      class="grid gap-1"
      :style="gridStyle"
    >
      <a
        v-for="post in visiblePosts"
        :key="post.id"
        :href="post.permalink"
        target="_blank"
        rel="noopener"
        class="group relative aspect-[4/5] overflow-hidden bg-muted/20"
        :title="post.caption"
      >
        <NuxtImg
          :src="post.imageUrl"
          :alt="post.alt || post.caption || post.shortcode"
          format="webp"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div class="absolute inset-0 flex items-center justify-center gap-4 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span
            v-if="post.isVideo"
            class="absolute top-2 right-2 text-white"
          >
            <UIcon
              name="mingcute:video-line"
              class="h-4 w-4"
            />
          </span>

          <span class="flex items-center gap-1 text-sm font-semibold text-white">
            <UIcon
              name="mingcute:heart-line"
              class="h-4 w-4"
            />
            {{ post.likes }}
          </span>
          <span class="flex items-center gap-1 text-sm font-semibold text-white">
            <UIcon
              name="mingcute:message-2-line"
              class="h-4 w-4"
            />
            {{ post.comments }}
          </span>
        </div>
      </a>
    </div>
  </div>
</template>
