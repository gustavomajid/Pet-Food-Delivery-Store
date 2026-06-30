import { usarBanco } from '../../../banco/conexao'
import { listarEstoqueWms } from '../../../servicos/estoque'
import { exigirWms } from '../../../utils/wms'

export default defineEventHandler(async (event) => {
  exigirWms(event)

  const query = getQuery(event)
  let atualizadoDesde: Date | undefined

  if (typeof query.atualizadoDesde === 'string') {
    atualizadoDesde = new Date(query.atualizadoDesde)

    if (Number.isNaN(atualizadoDesde.getTime())) {
      throw createError({ statusCode: 400, statusMessage: 'atualizadoDesde invalido.' })
    }
  }

  const itens = await listarEstoqueWms(usarBanco(), atualizadoDesde)

  return { itens }
})
