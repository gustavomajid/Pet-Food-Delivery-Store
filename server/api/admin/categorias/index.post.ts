import { usarBanco } from '../../../banco/conexao'
import { repositorioCategorias } from '../../../repositorios/categorias'
import { categoriaSchema } from '../../../servicos/categorias'
import { exigirAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  exigirAdmin(event)

  const corpo = await readBody(event)
  const dados = categoriaSchema.parse(corpo)
  const categoria = await repositorioCategorias(usarBanco()).criar(dados)

  setResponseStatus(event, 201)

  return { categoria }
})
