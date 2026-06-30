import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { itensPedido, movimentacoesEstoque, pedidos, produtos } from '../banco/esquema'
import type { Banco } from '../banco/tipos'
import type { FormaPagamento, StatusPedido, TipoEntrega } from '../../types/loja'

type ItemNovoPedido = {
  produtoId: number
  nomeProduto: string
  quantidade: number
  precoUnitarioCentavos: number
  subtotalCentavos: number
}

type NovoPedido = {
  nomeCliente: string
  telefoneCliente: string
  enderecoEntrega: string
  tipoEntrega: TipoEntrega
  formaPagamento: FormaPagamento
  subtotalCentavos: number
  taxaEntregaCentavos: number
  descontoCentavos: number
  totalCentavos: number
  status?: StatusPedido
  observacoes?: string
  itens: ItemNovoPedido[]
}

const STATUS_PEDIDO_ATIVO: StatusPedido[] = [
  'novo',
  'confirmado',
  'em_separacao',
  'saiu_para_entrega',
  'pronto_para_retirada'
]

type PedidoBanco = typeof pedidos.$inferSelect

async function anexarItensPedido(banco: Banco, listaPedidos: PedidoBanco[]) {
  if (listaPedidos.length === 0) {
    return []
  }

  const ids = listaPedidos.map((pedido) => pedido.id)
  const itens = await banco
    .select()
    .from(itensPedido)
    .where(inArray(itensPedido.pedidoId, ids))

  return listaPedidos.map((pedido) => ({
    ...pedido,
    itens: itens.filter((item) => item.pedidoId === pedido.id)
  }))
}

function filtroTelefoneNormalizado(telefoneNormalizado: string) {
  return sql`regexp_replace(${pedidos.telefoneCliente}, '[^0-9]', '', 'g') = ${telefoneNormalizado}`
}

export function repositorioPedidos(banco: Banco) {
  return {
    async criar(dados: NovoPedido) {
      return banco.transaction(async (tx) => {
        const [pedido] = await tx
          .insert(pedidos)
          .values({
            nomeCliente: dados.nomeCliente,
            telefoneCliente: dados.telefoneCliente,
            enderecoEntrega: dados.enderecoEntrega,
            tipoEntrega: dados.tipoEntrega,
            formaPagamento: dados.formaPagamento,
            status: dados.status ?? 'novo',
            subtotalCentavos: dados.subtotalCentavos,
            taxaEntregaCentavos: dados.taxaEntregaCentavos,
            descontoCentavos: dados.descontoCentavos,
            totalCentavos: dados.totalCentavos,
            observacoes: dados.observacoes || null
          })
          .returning()

        if (!pedido) {
          throw new Error('Não foi possível criar o pedido.')
        }

        await tx.insert(itensPedido).values(
          dados.itens.map((item) => ({
            pedidoId: pedido.id,
            produtoId: item.produtoId,
            nomeProduto: item.nomeProduto,
            quantidade: item.quantidade,
            precoUnitarioCentavos: item.precoUnitarioCentavos,
            subtotalCentavos: item.subtotalCentavos
          }))
        )

        for (const item of [...dados.itens].sort((a, b) => a.produtoId - b.produtoId)) {
          const [produtoAtualizado] = await tx
            .update(produtos)
            .set({
              estoque: sql`${produtos.estoque} - ${item.quantidade}`,
              estoqueAtualizadoEm: new Date(),
              atualizadoEm: new Date()
            })
            .where(and(
              eq(produtos.id, item.produtoId),
              eq(produtos.ativo, true),
              gte(produtos.estoque, item.quantidade)
            ))
            .returning({ estoque: produtos.estoque })

          if (!produtoAtualizado) {
            throw createError({
              statusCode: 409,
              statusMessage: `${item.nomeProduto} nao tem estoque suficiente.`
            })
          }

          await tx.insert(movimentacoesEstoque).values({
            produtoId: item.produtoId,
            quantidadeAnterior: produtoAtualizado.estoque + item.quantidade,
            quantidadeNova: produtoAtualizado.estoque,
            diferenca: -item.quantidade,
            origem: 'pedido',
            referencia: pedido.id
          })
        }

        return pedido
      })
    },

    async listarComItens() {
      const listaPedidos = await banco
        .select()
        .from(pedidos)
        .orderBy(desc(pedidos.criadoEm))

      return anexarItensPedido(banco, listaPedidos)
    },

    async listarPorTelefoneNormalizado(telefoneNormalizado: string) {
      const listaPedidos = await banco
        .select()
        .from(pedidos)
        .where(filtroTelefoneNormalizado(telefoneNormalizado))
        .orderBy(desc(pedidos.criadoEm))

      return anexarItensPedido(banco, listaPedidos)
    },

    async obterAtivoPorTelefoneNormalizado(telefoneNormalizado: string) {
      const [pedido] = await banco
        .select()
        .from(pedidos)
        .where(and(
          filtroTelefoneNormalizado(telefoneNormalizado),
          inArray(pedidos.status, STATUS_PEDIDO_ATIVO)
        ))
        .orderBy(desc(pedidos.criadoEm))
        .limit(1)

      if (!pedido) {
        return null
      }

      const [pedidoComItens] = await anexarItensPedido(banco, [pedido])

      return pedidoComItens ?? null
    },

    async obterComItens(id: string) {
      const [pedido] = await banco
        .select()
        .from(pedidos)
        .where(eq(pedidos.id, id))

      if (!pedido) {
        return null
      }

      const itens = await banco
        .select()
        .from(itensPedido)
        .where(eq(itensPedido.pedidoId, id))

      return {
        ...pedido,
        itens
      }
    },

    async atualizarStatus(id: string, status: StatusPedido) {
      return banco.transaction(async (tx) => {
        const [pedidoAnterior] = await tx
          .select()
          .from(pedidos)
          .where(eq(pedidos.id, id))
          .for('update')

        if (!pedidoAnterior) {
          throw createError({ statusCode: 404, statusMessage: 'Pedido nao encontrado.' })
        }

        if (pedidoAnterior.status === 'cancelado' && status !== 'cancelado') {
          throw createError({
            statusCode: 409,
            statusMessage: 'Um pedido cancelado nao pode ser reaberto.'
          })
        }

        if (pedidoAnterior.status === 'finalizado' && status === 'cancelado') {
          throw createError({
            statusCode: 409,
            statusMessage: 'Um pedido finalizado nao pode ser cancelado.'
          })
        }

        if (pedidoAnterior.status !== 'cancelado' && status === 'cancelado') {
          const itens = await tx
            .select()
            .from(itensPedido)
            .where(eq(itensPedido.pedidoId, id))

          for (const item of [...itens].sort((a, b) => a.produtoId - b.produtoId)) {
            const [produtoAtualizado] = await tx
              .update(produtos)
              .set({
                estoque: sql`${produtos.estoque} + ${item.quantidade}`,
                estoqueAtualizadoEm: new Date(),
                atualizadoEm: new Date()
              })
              .where(eq(produtos.id, item.produtoId))
              .returning({ estoque: produtos.estoque })

            if (produtoAtualizado) {
              await tx.insert(movimentacoesEstoque).values({
                produtoId: item.produtoId,
                quantidadeAnterior: produtoAtualizado.estoque - item.quantidade,
                quantidadeNova: produtoAtualizado.estoque,
                diferenca: item.quantidade,
                origem: 'cancelamento',
                referencia: id
              })
            }
          }
        }

        const [pedido] = await tx
          .update(pedidos)
          .set({ status, atualizadoEm: new Date() })
          .where(eq(pedidos.id, id))
          .returning()

        return pedido!
      })
    }
  }
}
