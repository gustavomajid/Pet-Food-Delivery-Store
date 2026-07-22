import { eq } from 'drizzle-orm'
import { createError } from 'h3'
import { z } from 'zod'
import { categorias, movimentacoesEstoque, produtos } from '../banco/esquema'
import type { Banco } from '../banco/tipos'

const produtoOnePetSchema = z.object({
  idonepet: z.union([z.string(), z.number()]).transform(String),
  descricao: z.string().trim().min(1),
  estoque: z.union([z.string(), z.number()]),
  preco: z.union([z.string(), z.number()]).optional().default(0),
  precoajustado: z.union([z.string(), z.number()]).optional().default(0),
  embalagem: z.string().nullish(),
  peso: z.union([z.string(), z.number()]).nullish(),
  status: z.union([z.string(), z.number()]).optional().default('1'),
  id_integracao: z.union([z.string(), z.number()]).nullish()
}).passthrough()

function numero(valor: string | number | null | undefined) {
  const convertido = Number(String(valor ?? 0).replace(',', '.'))
  return Number.isFinite(convertido) ? convertido : 0
}

async function buscarProdutosOnePet() {
  const config = useRuntimeConfig()

  if (!config.onepetTokenMatriz || !config.onepetTokenFilial) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Configure ONEPET_TOKEN_MATRIZ e ONEPET_TOKEN_FILIAL.'
    })
  }

  const produtosOnePet: Array<z.infer<typeof produtoOnePetSchema>> = []

  for (let pagina = 1; pagina <= 1000; pagina += 1) {
    const resposta = await $fetch<unknown[]>(`${config.onepetBaseUrl}/protheus/listar_produtos.json`, {
      query: { pagina, servico: 'N', status: '1' },
      headers: {
        Authorization: `token=${config.onepetTokenMatriz}`,
        'Content-Type': 'application/json',
        'Authorization-Token': config.onepetTokenFilial,
        'Authentication-Token': config.onepetTokenFilial,
        'Store-Token': config.onepetTokenFilial
      },
      timeout: 30000
    })
    const paginaValidada = z.array(produtoOnePetSchema).parse(resposta)
    produtosOnePet.push(...paginaValidada)

    if (paginaValidada.length < 100) {
      break
    }
  }

  return produtosOnePet
}

export async function sincronizarCatalogoOnePet(banco: Banco) {
  const catalogo = await buscarProdutosOnePet()
  const [categoria] = await banco
    .insert(categorias)
    .values({ nome: 'OnePet', descricao: 'Produtos sincronizados com o sistema OnePet.', ativo: true })
    .onConflictDoUpdate({ target: categorias.nome, set: { ativo: true } })
    .returning()

  if (!categoria) {
    throw createError({ statusCode: 500, statusMessage: 'Nao foi possivel preparar a categoria OnePet.' })
  }

  let criados = 0
  let atualizados = 0
  const agora = new Date()

  for (const item of catalogo) {
    const codigoExterno = String(item.id_integracao || item.idonepet).trim()
    const [anterior] = await banco.select().from(produtos).where(eq(produtos.codigoExterno, codigoExterno)).limit(1)
    const estoque = Math.max(0, Math.floor(numero(item.estoque)))
    const preco = numero(item.precoajustado) > 0 ? numero(item.precoajustado) : numero(item.preco)
    const precoCentavos = Math.max(0, Math.round(preco * 100))
    const peso = numero(item.peso) > 0
      ? `${item.peso} ${item.embalagem || ''}`.trim()
      : item.embalagem?.trim() || 'unidade'

    const [salvo] = await banco
      .insert(produtos)
      .values({
        nome: item.descricao,
        descricao: item.descricao,
        categoriaId: categoria.id,
        marca: 'OnePet',
        precoCentavos,
        estoque,
        fonteEstoque: 'wms',
        codigoExterno,
        peso,
        imagemUrl: '/img/produto-sem-imagem.svg',
        destaque: false,
        promocao: false,
        ativo: String(item.status) !== '0',
        estoqueAtualizadoEm: agora,
        atualizadoEm: agora
      })
      .onConflictDoUpdate({
        target: produtos.codigoExterno,
        set: {
          nome: item.descricao,
          descricao: item.descricao,
          categoriaId: categoria.id,
          precoCentavos,
          estoque,
          fonteEstoque: 'wms',
          peso,
          ativo: String(item.status) !== '0',
          estoqueAtualizadoEm: agora,
          atualizadoEm: agora
        }
      })
      .returning()

    if (!salvo) continue
    anterior ? atualizados += 1 : criados += 1

    if (!anterior || anterior.estoque !== estoque) {
      await banco.insert(movimentacoesEstoque).values({
        produtoId: salvo.id,
        quantidadeAnterior: anterior?.estoque ?? 0,
        quantidadeNova: estoque,
        diferenca: estoque - (anterior?.estoque ?? 0),
        origem: 'wms',
        referencia: codigoExterno
      })
    }
  }

  return { recebidos: catalogo.length, criados, atualizados, sincronizadoEm: agora.toISOString() }
}
