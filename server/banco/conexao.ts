import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as esquema from './esquema'

const { Pool } = pg

let pool: pg.Pool | undefined

export function usarBanco() {
  const config = useRuntimeConfig()

  if (!config.databaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'DATABASE_URL não foi configurada.'
    })
  }

  pool ||= new Pool({
    connectionString: config.databaseUrl
  })

  return drizzle(pool, { schema: esquema })
}
