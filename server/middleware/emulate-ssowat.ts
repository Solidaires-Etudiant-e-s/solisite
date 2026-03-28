import { createMiddlewareHandler } from 'nitro-conditional-middleware'
import type { H3Event } from 'h3'

const isEmulating = (_event: H3Event) => process.env.EMULATE_SSOWAT === 'true'

const defineMiddlewareHandler = createMiddlewareHandler(isEmulating)

export default defineMiddlewareHandler((event) => {
  const useFirstProfile = event.node.req.headers.debug === '1'
  const uid = useFirstProfile
    ? process.env.EMULATE_SSOWAT_UID1
    : process.env.EMULATE_SSOWAT_UID2
  const password = useFirstProfile
    ? process.env.EMULATE_SSOWAT_PWD1
    : process.env.EMULATE_SSOWAT_PWD2

  if (!uid || !password) {
    return
  }

  event.node.req.headers.authorization = `Basic ${Buffer.from(`${uid}:${password}`).toString('base64')}`

  if (!event.node.req.headers.ynh_user) {
    event.node.req.headers.ynh_user = String(uid)
  }
})
