import { usarBanco } from '../banco/conexao'
import { criarPedido, pedidoSchema } from '../servicos/pedidos'

export default defineEventHandler(async (event) => {
  const corpo = await readBody(event)
  const entrada = pedidoSchema.parse(corpo)
  const pedido = await criarPedido(usarBanco(), entrada)

  setResponseStatus(event, 201)

  return { pedido }
})
