import { usarBanco } from '../../../banco/conexao'
import { repositorioCategorias } from '../../../repositorios/categorias'
import { categoriaSchema } from '../../../servicos/categorias'
import { exigirAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  exigirAdmin(event)

  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Categoria invalida.' })
  }

  const corpo = await readBody(event)
  const dados = categoriaSchema.parse(corpo)
  const categoria = await repositorioCategorias(usarBanco()).atualizar(id, dados)

  return { categoria }
})
