import { z } from 'zod'
import { usarBanco } from '../../banco/conexao'
import { repositorioPedidos } from '../../repositorios/pedidos'

const pedidoIdSchema = z.string().uuid()

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || ''
  const resultado = pedidoIdSchema.safeParse(id)

  if (!resultado.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pedido invalido.'
    })
  }

  const pedido = await repositorioPedidos(usarBanco()).obterComItens(resultado.data)

  if (!pedido) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pedido nao encontrado.'
    })
  }

  return { pedido }
})
