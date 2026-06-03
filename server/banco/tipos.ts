import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type * as esquema from './esquema'

export type Banco = NodePgDatabase<typeof esquema>
