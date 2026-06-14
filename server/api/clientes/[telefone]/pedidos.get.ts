import { z } from 'zod'
import { usarBanco } from '../../../banco/conexao'
import { listarHistoricoPedidosCliente } from '../../../servicos/pedidos'

const telefoneSchema = z.string().regex(/^\d{8,14}$/)

export default defineEventHandler(async (event) => {
  const telefone = telefoneSchema.parse(getRouterParam(event, 'telefone') || '')
  const pedidos = await listarHistoricoPedidosCliente(usarBanco(), telefone)

  return { pedidos }
})
