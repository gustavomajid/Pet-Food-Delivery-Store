import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'

const COOKIE_ADMIN = 'fazendinha_admin'

function gerarToken(senha: string) {
  return createHash('sha256').update(`fazendinha:${senha}`).digest('hex')
}

export function criarSessaoAdmin(event: H3Event, senha: string) {
  setCookie(event, COOKIE_ADMIN, gerarToken(senha), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/'
  })
}

export function limparSessaoAdmin(event: H3Event) {
  deleteCookie(event, COOKIE_ADMIN, { path: '/' })
}

export function exigirAdmin(event: H3Event) {
  const config = useRuntimeConfig()
  const token = getCookie(event, COOKIE_ADMIN)
  const tokenEsperado = gerarToken(config.adminSenha)

  if (!token || token !== tokenEsperado) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Acesso administrativo necessário.'
    })
  }
}

export function senhaAdminCorreta(senha: string) {
  const config = useRuntimeConfig()
  return gerarToken(senha) === gerarToken(config.adminSenha)
}
