import { usarBanco } from '../../../banco/conexao'
import { repositorioProdutos } from '../../../repositorios/produtos'
import { produtoSchema } from '../../../servicos/produtos'
import { exigirAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  exigirAdmin(event)

  const corpo = await readBody(event)
  const dados = produtoSchema.parse(corpo)
  const produto = await repositorioProdutos(usarBanco()).criar(dados)

  setResponseStatus(event, 201)

  return { produto }
})
