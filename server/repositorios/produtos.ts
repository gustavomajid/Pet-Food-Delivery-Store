import { and, asc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm'
import { categorias, produtos } from '../banco/esquema'
import type { Banco } from '../banco/tipos'

export type FiltrosProduto = {
  busca?: string
  categoriaId?: number
  marca?: string
  somenteAtivos?: boolean
}

export type DadosProduto = {
  nome: string
  descricao: string
  categoriaId: number
  marca: string
  precoCentavos: number
  estoque: number
  peso: string
  imagemUrl: string
  destaque: boolean
  promocao: boolean
  ativo: boolean
}

export function repositorioProdutos(banco: Banco) {
  const selecao = {
    id: produtos.id,
    nome: produtos.nome,
    descricao: produtos.descricao,
    categoriaId: produtos.categoriaId,
    categoriaNome: categorias.nome,
    marca: produtos.marca,
    precoCentavos: produtos.precoCentavos,
    estoque: produtos.estoque,
    peso: produtos.peso,
    imagemUrl: produtos.imagemUrl,
    destaque: produtos.destaque,
    promocao: produtos.promocao,
    ativo: produtos.ativo
  }

  return {
    async listar(filtros: FiltrosProduto = {}) {
      const condicoes: SQL[] = []

      if (filtros.somenteAtivos !== false) {
        condicoes.push(eq(produtos.ativo, true))
      }

      if (filtros.categoriaId) {
        condicoes.push(eq(produtos.categoriaId, filtros.categoriaId))
      }

      if (filtros.marca) {
        condicoes.push(ilike(produtos.marca, `%${filtros.marca}%`))
      }

      if (filtros.busca) {
        const busca = `%${filtros.busca}%`
        const condicaoBusca = or(
          ilike(produtos.nome, busca),
          ilike(produtos.descricao, busca),
          ilike(produtos.marca, busca)
        )

        if (condicaoBusca) {
          condicoes.push(condicaoBusca)
        }
      }

      let consulta = banco
        .select(selecao)
        .from(produtos)
        .innerJoin(categorias, eq(produtos.categoriaId, categorias.id))
        .$dynamic()

      if (condicoes.length > 0) {
        consulta = consulta.where(and(...condicoes))
      }

      return consulta.orderBy(asc(categorias.nome), asc(produtos.nome))
    },

    async buscarPorIds(ids: number[]) {
      if (ids.length === 0) {
        return []
      }

      return banco
        .select()
        .from(produtos)
        .where(and(eq(produtos.ativo, true), inArray(produtos.id, ids)))
    },

    async criar(dados: DadosProduto) {
      const [produto] = await banco.insert(produtos).values(dados).returning()
      return produto
    },

    async atualizar(id: number, dados: DadosProduto) {
      const [produto] = await banco
        .update(produtos)
        .set({ ...dados, atualizadoEm: new Date() })
        .where(eq(produtos.id, id))
        .returning()

      return produto
    },

    async inativar(id: number) {
      const [produto] = await banco
        .update(produtos)
        .set({ ativo: false, atualizadoEm: new Date() })
        .where(eq(produtos.id, id))
        .returning()

      return produto
    }
  }
}
