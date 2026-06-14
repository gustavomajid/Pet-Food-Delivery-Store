import { usarBanco } from '../../banco/conexao'
import { repositorioConfiguracoes } from '../../repositorios/configuracoes'
import { configuracoesSchema } from '../../servicos/configuracoes'
import { exigirAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  exigirAdmin(event)

  const corpo = await readBody(event)
  const dados = configuracoesSchema.parse(corpo)
  const configuracoes = await repositorioConfiguracoes(usarBanco()).salvar(dados)

  return {
    configuracoes: {
      modalIdentificacaoAtivo: configuracoes?.modalIdentificacaoAtivo ?? true,
      aceitarPedidosAutomaticamente: configuracoes?.aceitarPedidosAutomaticamente ?? false
    }
  }
})
