import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const bancoLocal = 'postgresql://postgres:postgres@localhost:5434/fazendinha'

export default defineConfig({
  schema: './server/banco/esquema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || bancoLocal
  },
  strict: true,
  verbose: true
})
