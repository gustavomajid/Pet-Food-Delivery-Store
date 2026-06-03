import { desc, eq, inArray, sql } from 'drizzle-orm'
import { itensPedido, pedidos, produtos } from '../banco/esquema'
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
  observacoes?: string
  itens: ItemNovoPedido[]
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

        for (const item of dados.itens) {
          await tx
            .update(produtos)
            .set({
              estoque: sql`${produtos.estoque} - ${item.quantidade}`,
              atualizadoEm: new Date()
            })
            .where(eq(produtos.id, item.produtoId))
        }

        return pedido
      })
    },

    async listarComItens() {
      const listaPedidos = await banco
        .select()
        .from(pedidos)
        .orderBy(desc(pedidos.criadoEm))

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
    },

    async atualizarStatus(id: string, status: StatusPedido) {
      const [pedido] = await banco
        .update(pedidos)
        .set({ status, atualizadoEm: new Date() })
        .where(eq(pedidos.id, id))
        .returning()

      if (!pedido) {
        throw new Error('Pedido não encontrado.')
      }

      return pedido
    }
  }
}
