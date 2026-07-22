import { usarBanco } from '../../../../banco/conexao'
import { sincronizarCatalogoOnePet } from '../../../../servicos/onepet'
import { exigirAdmin } from '../../../../utils/admin'

export default defineEventHandler(async (event) => {
  exigirAdmin(event)
  return sincronizarCatalogoOnePet(usarBanco())
})
