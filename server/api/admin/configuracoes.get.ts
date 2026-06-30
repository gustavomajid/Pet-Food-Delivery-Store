import { usarBanco } from '../../banco/conexao'
import { repositorioConfiguracoes } from '../../repositorios/configuracoes'
import {
  normalizarModoFuncionamentoOnline,
  obterFuncionamentoLoja
} from '../../servicos/funcionamento'
import { exigirAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  exigirAdmin(event)

  const configuracoes = await repositorioConfiguracoes(usarBanco()).obter()
  const modoFuncionamentoOnline = normalizarModoFuncionamentoOnline(
    configuracoes?.modoFuncionamentoOnline
  )

  return {
    configuracoes: {
      modalIdentificacaoAtivo: configuracoes?.modalIdentificacaoAtivo ?? true,
      aceitarPedidosAutomaticamente: configuracoes?.aceitarPedidosAutomaticamente ?? false,
      modoFuncionamentoOnline,
      funcionamento: obterFuncionamentoLoja(modoFuncionamentoOnline)
    }
  }
})
