import { and, asc, count, eq, inArray, or, sql, type SQL, type SQLWrapper } from 'drizzle-orm'
import { categorias, movimentacoesEstoque, produtos } from '../banco/esquema'
import type { Banco } from '../banco/tipos'

export type FiltrosProduto = {
  busca?: string
  categoriaId?: number
  marca?: string
  somenteAtivos?: boolean
  pagina?: number
  porPagina?: number
}

export type DadosProduto = {
  nome: string
  descricao: string
  categoriaId: number
  marca: string
  precoCentavos: number
  estoque: number
  fonteEstoque: 'sistema' | 'wms'
  codigoExterno?: string | null
  peso: string
  imagemUrl: string
  destaque: boolean
  promocao: boolean
  ativo: boolean
}

const ACENTOS = 'áàâãäéèêëíìîïóòôõöúùûüç'
const SEM_ACENTOS = 'aaaaaeeeeiiiiooooouuuuc'
const LIMITE_TERMOS_BUSCA = 8

function normalizarTexto(valor: string) {
  return valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function quebrarTermos(valor?: string) {
  if (!valor) {
    return []
  }

  return normalizarTexto(valor).split(/\s+/).filter(Boolean).slice(0, LIMITE_TERMOS_BUSCA)
}

function escaparLike(valor: string) {
  return valor.replace(/[\\%_]/g, '\\$&')
}

function escaparRegex(valor: string) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function contemTermo(coluna: SQLWrapper, termo: string) {
  const colunaNormalizada = sql`translate(lower(${coluna}), ${ACENTOS}, ${SEM_ACENTOS})`

  if (termo.length < 3) {
    const padrao = `%${escaparLike(termo)}%`

    return sql`${colunaNormalizada} like ${padrao} escape '\\'`
  }

  return sql`${colunaNormalizada} ~ ${`(^|[^a-z0-9])${escaparRegex(termo)}`}`
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
    fonteEstoque: produtos.fonteEstoque,
    codigoExterno: produtos.codigoExterno,
    estoqueAtualizadoEm: produtos.estoqueAtualizadoEm,
    peso: produtos.peso,
    imagemUrl: produtos.imagemUrl,
    destaque: produtos.destaque,
    promocao: produtos.promocao,
    ativo: produtos.ativo
  }

  function montarCondicoes(filtros: FiltrosProduto = {}) {
    const condicoes: SQL[] = []

    if (filtros.somenteAtivos !== false) {
      condicoes.push(eq(produtos.ativo, true))
    }

    if (filtros.categoriaId) {
      condicoes.push(eq(produtos.categoriaId, filtros.categoriaId))
    }

    for (const termo of quebrarTermos(filtros.marca)) {
      condicoes.push(contemTermo(produtos.marca, termo))
    }

    for (const termo of quebrarTermos(filtros.busca)) {
      const condicaoBusca = or(
        contemTermo(produtos.nome, termo),
        contemTermo(produtos.descricao, termo),
        contemTermo(produtos.marca, termo),
        contemTermo(produtos.peso, termo),
        contemTermo(categorias.nome, termo)
      )

      if (condicaoBusca) {
        condicoes.push(condicaoBusca)
      }
    }

    return condicoes
  }

  return {
    async listar(filtros: FiltrosProduto = {}) {
      const condicoes = montarCondicoes(filtros)
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

    async listarPaginado(filtros: FiltrosProduto = {}) {
      const condicoes = montarCondicoes(filtros)
      const paginaRecebida =
        filtros.pagina && Number.isFinite(filtros.pagina) ? Math.floor(filtros.pagina) : 1
      const porPaginaRecebida =
        filtros.porPagina && Number.isFinite(filtros.porPagina)
          ? Math.floor(filtros.porPagina)
          : 12
      const porPagina = Math.min(Math.max(porPaginaRecebida, 1), 48)

      let consultaTotal = banco
        .select({ total: count() })
        .from(produtos)
        .innerJoin(categorias, eq(produtos.categoriaId, categorias.id))
        .$dynamic()

      if (condicoes.length > 0) {
        consultaTotal = consultaTotal.where(and(...condicoes))
      }

      const [resultadoTotal] = await consultaTotal
      const total = Number(resultadoTotal?.total ?? 0)
      const totalPaginas = Math.ceil(total / porPagina)
      const pagina =
        totalPaginas > 0 ? Math.min(Math.max(paginaRecebida, 1), totalPaginas) : 1
      const deslocamento = (pagina - 1) * porPagina

      let consultaProdutos = banco
        .select(selecao)
        .from(produtos)
        .innerJoin(categorias, eq(produtos.categoriaId, categorias.id))
        .$dynamic()

      if (condicoes.length > 0) {
        consultaProdutos = consultaProdutos.where(and(...condicoes))
      }

      const produtosPaginados = await consultaProdutos
        .orderBy(asc(categorias.nome), asc(produtos.nome))
        .limit(porPagina)
        .offset(deslocamento)

      return {
        produtos: produtosPaginados,
        paginacao: {
          pagina,
          porPagina,
          total,
          totalPaginas
        }
      }
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
      return banco.transaction(async (tx) => {
        const agora = new Date()
        const [produto] = await tx
          .insert(produtos)
          .values({ ...dados, estoqueAtualizadoEm: agora })
          .returning()

        if (!produto) {
          throw new Error('Nao foi possivel criar o produto.')
        }

        if (produto.estoque > 0) {
          await tx.insert(movimentacoesEstoque).values({
            produtoId: produto.id,
            quantidadeAnterior: 0,
            quantidadeNova: produto.estoque,
            diferenca: produto.estoque,
            origem: 'cadastro'
          })
        }

        return produto
      })
    },

    async atualizar(id: number, dados: DadosProduto) {
      return banco.transaction(async (tx) => {
        const [produtoAnterior] = await tx
          .select()
          .from(produtos)
          .where(eq(produtos.id, id))
          .for('update')

        if (!produtoAnterior) {
          return undefined
        }

        const estoque = produtoAnterior.fonteEstoque === 'wms' && dados.fonteEstoque === 'wms'
          ? produtoAnterior.estoque
          : dados.estoque
        const agora = new Date()
        const estoqueMudou = estoque !== produtoAnterior.estoque
        const [produto] = await tx
          .update(produtos)
          .set({
            ...dados,
            estoque,
            atualizadoEm: agora,
            estoqueAtualizadoEm: estoqueMudou ? agora : produtoAnterior.estoqueAtualizadoEm
          })
          .where(eq(produtos.id, id))
          .returning()

        if (estoqueMudou) {
          await tx.insert(movimentacoesEstoque).values({
            produtoId: id,
            quantidadeAnterior: produtoAnterior.estoque,
            quantidadeNova: estoque,
            diferenca: estoque - produtoAnterior.estoque,
            origem: 'ajuste_admin'
          })
        }

        return produto
      })
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
