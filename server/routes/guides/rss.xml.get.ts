export default defineEventHandler(async (event) => {
  return sendRedirect(event, '/rss/guides.xml', 301)
})
