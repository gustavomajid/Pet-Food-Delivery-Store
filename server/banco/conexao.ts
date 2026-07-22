import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as esquema from './esquema'

const { Pool } = pg

let pool: pg.Pool | undefined

function usarSsl(url: string, configuracao: string) {
  if (configuracao === 'true' || configuracao === 'require') {
    return { rejectUnauthorized: false }
  }

  if (configuracao === 'false' || configuracao === 'disable') {
    return undefined
  }

  return /(?:supabase\.(?:com|co)|pooler\.supabase\.com)/i.test(url)
    ? { rejectUnauthorized: false }
    : undefined
}

export function usarBanco() {
  const config = useRuntimeConfig()

  if (!config.databaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'DATABASE_URL não foi configurada.'
    })
  }

  pool ||= new Pool({
    connectionString: config.databaseUrl,
    ssl: usarSsl(config.databaseUrl, config.databaseSsl)
  })

  return drizzle(pool, { schema: esquema })
}
