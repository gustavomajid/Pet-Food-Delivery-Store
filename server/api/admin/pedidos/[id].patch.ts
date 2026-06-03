import { usarBanco } from '../../../banco/conexao'
import { repositorioPedidos } from '../../../repositorios/pedidos'
import { statusPedidoSchema } from '../../../servicos/pedidos'
import { exigirAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  exigirAdmin(event)

  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Pedido inválido.' })
  }

  const corpo = await readBody(event)
  const status = statusPedidoSchema.parse(corpo.status)
  const pedido = await repositorioPedidos(usarBanco()).atualizarStatus(id, status)

  return { pedido }
})
