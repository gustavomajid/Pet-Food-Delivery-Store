import { sql } from 'drizzle-orm'
import { usarBanco } from '../banco/conexao'

export default defineEventHandler(async () => {
  const inicio = Date.now()
  const config = useRuntimeConfig()

  try {
    await usarBanco().execute(sql`select 1`)

    return {
      status: 'ok',
      environment: config.appEnvironment,
      database: 'connected',
      latencyMs: Date.now() - inicio,
      timestamp: new Date().toISOString()
    }
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Banco de dados indisponivel.',
      data: {
        status: 'error',
        environment: config.appEnvironment,
        database: 'disconnected',
        timestamp: new Date().toISOString()
      }
    })
  }
})
