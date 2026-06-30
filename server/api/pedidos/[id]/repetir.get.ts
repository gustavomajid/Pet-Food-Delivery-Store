import { z } from 'zod'
import type { ItemCarrinho, ResultadoRepetirPedido } from '../../../../types/loja'
import { usarBanco } from '../../../banco/conexao'
import { repositorioPedidos } from '../../../repositorios/pedidos'
import { repositorioProdutos } from '../../../repositorios/produtos'

const pedidoIdSchema = z.string().uuid()

export default defineEventHandler(async (event): Promise<ResultadoRepetirPedido> => {
  const resultado = pedidoIdSchema.safeParse(getRouterParam(event, 'id') || '')

  if (!resultado.success) {
    throw createError({ statusCode: 400, statusMessage: 'Pedido invalido.' })
  }

  const banco = usarBanco()
  const pedido = await repositorioPedidos(banco).obterComItens(resultado.data)

  if (!pedido) {
    throw createError({ statusCode: 404, statusMessage: 'Pedido nao encontrado.' })
  }

  const produtos = await repositorioProdutos(banco)
    .buscarPorIds(pedido.itens.map((item) => item.produtoId))
  const produtosPorId = new Map(produtos.map((produto) => [produto.id, produto]))
  const itens: ItemCarrinho[] = []
  const indisponiveis: string[] = []
  const quantidadesAjustadas: string[] = []

  for (const itemPedido of pedido.itens) {
    const produto = produtosPorId.get(itemPedido.produtoId)

    if (!produto || produto.estoque <= 0) {
      indisponiveis.push(itemPedido.nomeProduto)
      continue
    }

    const quantidade = Math.min(itemPedido.quantidade, produto.estoque)

    if (quantidade < itemPedido.quantidade) {
      quantidadesAjustadas.push(produto.nome)
    }

    itens.push({
      produtoId: produto.id,
      nome: produto.nome,
      marca: produto.marca,
      precoCentavos: produto.precoCentavos,
      imagemUrl: produto.imagemUrl,
      quantidade,
      estoque: produto.estoque
    })
  }

  return { itens, indisponiveis, quantidadesAjustadas }
})
