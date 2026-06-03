import { limparSessaoAdmin } from '../../utils/admin'

export default defineEventHandler((event) => {
  limparSessaoAdmin(event)
  return { ok: true }
})
