import { createError } from 'h3'
import { inArray } from 'drizzle-orm'
import { z } from 'zod'
import { produtos } from '../banco/esquema'
import type { Banco } from '../banco/tipos'
import { repositorioPedidos } from '../repositorios/pedidos'

export const pedidoSchema = z.object({
  nomeCliente: z.string().trim().min(2).max(160),
  telefoneCliente: z.string().trim().min(8).max(40),
  enderecoEntrega: z.string().trim().min(4).max(500),
  tipoEntrega: z.enum(['retirada', 'entrega_local', 'agendada']),
  formaPagamento: z.enum(['pix', 'dinheiro', 'cartao_entrega']),
  observacoes: z.string().trim().max(500).optional().or(z.literal('')),
  itens: z
    .array(
      z.object({
        produtoId: z.number().int().positive(),
        quantidade: z.number().int().min(1).max(99)
      })
    )
    .min(1)
})

export const statusPedidoSchema = z.enum([
  'novo',
  'confirmado',
  'em_separacao',
  'saiu_para_entrega',
  'pronto_para_retirada',
  'finalizado',
  'cancelado'
])

export type PedidoEntrada = z.infer<typeof pedidoSchema>

const TAXA_ENTREGA_CENTAVOS = 1200
const FRETE_GRATIS_A_PARTIR_DE = 25000

export async function criarPedido(banco: Banco, entrada: PedidoEntrada) {
  const ids = [...new Set(entrada.itens.map((item) => item.produtoId))]
  const produtosEncontrados = await banco
    .select()
    .from(produtos)
    .where(inArray(produtos.id, ids))

  const produtosPorId = new Map(produtosEncontrados.map((produto) => [produto.id, produto]))

  const itens = entrada.itens.map((item) => {
    const produto = produtosPorId.get(item.produtoId)

    if (!produto || !produto.ativo) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Produto indisponível.'
      })
    }

    if (produto.estoque < item.quantidade) {
      throw createError({
        statusCode: 409,
        statusMessage: `${produto.nome} não tem estoque suficiente.`
      })
    }

    return {
      produtoId: produto.id,
      nomeProduto: produto.nome,
      quantidade: item.quantidade,
      precoUnitarioCentavos: produto.precoCentavos,
      subtotalCentavos: produto.precoCentavos * item.quantidade
    }
  })

  const subtotalCentavos = itens.reduce((total, item) => total + item.subtotalCentavos, 0)
  const taxaEntregaCentavos =
    entrada.tipoEntrega === 'retirada' || subtotalCentavos >= FRETE_GRATIS_A_PARTIR_DE
      ? 0
      : TAXA_ENTREGA_CENTAVOS
  const descontoCentavos = 0
  const totalCentavos = subtotalCentavos + taxaEntregaCentavos - descontoCentavos

  const pedido = await repositorioPedidos(banco).criar({
    nomeCliente: entrada.nomeCliente,
    telefoneCliente: entrada.telefoneCliente,
    enderecoEntrega: entrada.enderecoEntrega,
    tipoEntrega: entrada.tipoEntrega,
    formaPagamento: entrada.formaPagamento,
    subtotalCentavos,
    taxaEntregaCentavos,
    descontoCentavos,
    totalCentavos,
    observacoes: entrada.observacoes || undefined,
    itens
  })

  return {
    id: pedido.id,
    nomeCliente: pedido.nomeCliente,
    telefoneCliente: pedido.telefoneCliente,
    enderecoEntrega: pedido.enderecoEntrega,
    tipoEntrega: pedido.tipoEntrega,
    formaPagamento: pedido.formaPagamento,
    status: pedido.status,
    subtotalCentavos: pedido.subtotalCentavos,
    taxaEntregaCentavos: pedido.taxaEntregaCentavos,
    descontoCentavos: pedido.descontoCentavos,
    totalCentavos: pedido.totalCentavos,
    observacoes: pedido.observacoes,
    criadoEm: pedido.criadoEm.toISOString()
  }
}
