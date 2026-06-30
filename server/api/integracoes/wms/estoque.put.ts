import { usarBanco } from '../../../banco/conexao'
import { sincronizacaoEstoqueWmsSchema, sincronizarEstoqueWms } from '../../../servicos/estoque'
import { exigirWms } from '../../../utils/wms'

export default defineEventHandler(async (event) => {
  exigirWms(event)

  const corpo = await readBody(event)
  const entrada = sincronizacaoEstoqueWmsSchema.parse(corpo)
  const itens = await sincronizarEstoqueWms(usarBanco(), entrada)

  return { itens }
})
