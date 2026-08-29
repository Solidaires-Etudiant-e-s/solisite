export default defineEventHandler(async (event) => {
  return sendRedirect(event, '/rss/articles.xml', 301)
})
