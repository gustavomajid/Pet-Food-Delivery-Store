import { usarBanco } from '../../../banco/conexao'
import { repositorioCategorias } from '../../../repositorios/categorias'
import { exigirAdmin } from '../../../utils/admin'

export default defineEventHandler(async (event) => {
  exigirAdmin(event)

  const categorias = await repositorioCategorias(usarBanco()).listarTodas()

  return { categorias }
})
