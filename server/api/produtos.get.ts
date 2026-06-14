import { usarBanco } from '../banco/conexao'
import { repositorioProdutos } from '../repositorios/produtos'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const categoriaId = Number(query.categoriaId)
  const pagina = Number(query.pagina)
  const porPagina = Number(query.porPagina)

  return repositorioProdutos(usarBanco()).listarPaginado({
    busca: typeof query.busca === 'string' ? query.busca : undefined,
    marca: typeof query.marca === 'string' ? query.marca : undefined,
    categoriaId: Number.isFinite(categoriaId) && categoriaId > 0 ? categoriaId : undefined,
    pagina: Number.isFinite(pagina) && pagina > 0 ? pagina : undefined,
    porPagina: Number.isFinite(porPagina) && porPagina > 0 ? porPagina : undefined
  })
})
