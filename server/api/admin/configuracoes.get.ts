import { usarBanco } from '../../banco/conexao'
import { repositorioConfiguracoes } from '../../repositorios/configuracoes'
import { exigirAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  exigirAdmin(event)

  const configuracoes = await repositorioConfiguracoes(usarBanco()).obter()

  return {
    configuracoes: {
      modalIdentificacaoAtivo: configuracoes?.modalIdentificacaoAtivo ?? true,
      aceitarPedidosAutomaticamente: configuracoes?.aceitarPedidosAutomaticamente ?? false
    }
  }
})
