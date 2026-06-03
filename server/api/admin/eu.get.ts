import { exigirAdmin } from '../../utils/admin'

export default defineEventHandler((event) => {
  exigirAdmin(event)
  return { ok: true }
})
