import { usarBanco } from '../banco/conexao'
import { repositorioProdutos } from '../repositorios/produtos'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const categoriaId = Number(query.categoriaId)

  const produtos = await repositorioProdutos(usarBanco()).listar({
    busca: typeof query.busca === 'string' ? query.busca : undefined,
    marca: typeof query.marca === 'string' ? query.marca : undefined,
    categoriaId: Number.isFinite(categoriaId) && categoriaId > 0 ? categoriaId : undefined
  })

  return { produtos }
})
