import { createHash, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

function gerarHash(valor: string) {
  return createHash('sha256').update(valor).digest()
}

export function exigirWms(event: H3Event) {
  const config = useRuntimeConfig()
  const tokenConfigurado = config.wmsApiToken

  if (!tokenConfigurado) {
    throw createError({
      statusCode: 503,
      statusMessage: 'A integracao WMS nao foi configurada.'
    })
  }

  const autorizacao = getHeader(event, 'authorization')
  const tokenBearer = autorizacao?.match(/^Bearer\s+(.+)$/i)?.[1]
  const tokenRecebido = tokenBearer ?? getHeader(event, 'x-api-key')

  if (!tokenRecebido || !timingSafeEqual(gerarHash(tokenRecebido), gerarHash(tokenConfigurado))) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credencial WMS invalida.'
    })
  }
}
