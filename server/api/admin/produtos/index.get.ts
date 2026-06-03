import { usarBanco } from '../../../banco/conexao'
import { repositorioProdutos } from '../../../repositorios/produtos'
import { exigirAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  exigirAdmin(event)

  const produtos = await repositorioProdutos(usarBanco()).listar({
    somenteAtivos: false
  })

  return { produtos }
})
