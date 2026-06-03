import { usarBanco } from '../../../banco/conexao'
import { repositorioProdutos } from '../../../repositorios/produtos'
import { produtoSchema } from '../../../servicos/produtos'
import { exigirAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  exigirAdmin(event)

  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Produto inválido.' })
  }

  const corpo = await readBody(event)
  const dados = produtoSchema.parse(corpo)
  const produto = await repositorioProdutos(usarBanco()).atualizar(id, dados)

  return { produto }
})
