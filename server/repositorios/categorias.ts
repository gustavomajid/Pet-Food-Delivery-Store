import { asc, eq } from 'drizzle-orm'
import { categorias } from '../banco/esquema'
import type { Banco } from '../banco/tipos'

export type DadosCategoria = {
  nome: string
  descricao?: string | null
  ativo: boolean
}

export function repositorioCategorias(banco: Banco) {
  return {
    async listarAtivas() {
      return banco
        .select()
        .from(categorias)
        .where(eq(categorias.ativo, true))
        .orderBy(asc(categorias.nome))
    },

    async listarTodas() {
      return banco.select().from(categorias).orderBy(asc(categorias.nome))
    },

    async criar(dados: DadosCategoria) {
      const [categoria] = await banco
        .insert(categorias)
        .values({
          nome: dados.nome,
          descricao: dados.descricao || null,
          ativo: dados.ativo
        })
        .returning()

      return categoria
    },

    async atualizar(id: number, dados: DadosCategoria) {
      const [categoria] = await banco
        .update(categorias)
        .set({
          nome: dados.nome,
          descricao: dados.descricao || null,
          ativo: dados.ativo
        })
        .where(eq(categorias.id, id))
        .returning()

      return categoria
    },

    async inativar(id: number) {
      const [categoria] = await banco
        .update(categorias)
        .set({ ativo: false })
        .where(eq(categorias.id, id))
        .returning()

      return categoria
    }
  }
}
