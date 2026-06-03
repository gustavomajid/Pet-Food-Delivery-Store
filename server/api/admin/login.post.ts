import { criarSessaoAdmin, senhaAdminCorreta } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const corpo = await readBody<{ senha?: string }>(event)

  if (!corpo.senha || !senhaAdminCorreta(corpo.senha)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Senha inválida.'
    })
  }

  criarSessaoAdmin(event, corpo.senha)

  return { ok: true }
})
