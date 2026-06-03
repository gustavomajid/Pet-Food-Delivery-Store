import { asc, eq } from 'drizzle-orm'
import { categorias } from '../banco/esquema'
import type { Banco } from '../banco/tipos'

export function repositorioCategorias(banco: Banco) {
  return {
    async listarAtivas() {
      return banco
        .select()
        .from(categorias)
        .where(eq(categorias.ativo, true))
        .orderBy(asc(categorias.nome))
    }
  }
}
