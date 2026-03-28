export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = String(query.q || '').trim()

  if (search.length < 2) {
    return {
      icons: []
    }
  }

  const response = await $fetch<{ icons?: string[] }>('https://api.iconify.design/search', {
    query: {
      query: search,
      limit: 32,
      prefix: 'mingcute'
    }
  })

  return {
    icons: response.icons || []
  }
})
