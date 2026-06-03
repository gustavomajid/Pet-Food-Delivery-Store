import { usarBanco } from '../../../banco/conexao'
import { repositorioPedidos } from '../../../repositorios/pedidos'
import { exigirAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  exigirAdmin(event)

  const pedidos = await repositorioPedidos(usarBanco()).listarComItens()

  return { pedidos }
})
