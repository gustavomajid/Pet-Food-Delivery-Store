import { usarBanco } from '../banco/conexao'
import { repositorioCategorias } from '../repositorios/categorias'

export default defineEventHandler(async () => {
  const categorias = await repositorioCategorias(usarBanco()).listarAtivas()
  return { categorias }
})
