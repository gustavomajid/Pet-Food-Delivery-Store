import { usarBanco } from '../../../banco/conexao'
import { repositorioProdutos } from '../../../repositorios/produtos'
import { exigirAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  exigirAdmin(event)

  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Produto inválido.' })
  }

  const produto = await repositorioProdutos(usarBanco()).inativar(id)

  return { produto }
})