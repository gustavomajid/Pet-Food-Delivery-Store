import { usarBanco } from '../banco/conexao'
import { repositorioConfiguracoes } from '../repositorios/configuracoes'

export default defineEventHandler(async () => {
  const configuracoes = await repositorioConfiguracoes(usarBanco()).obter()

  return {
    configuracoes: {
      modalIdentificacaoAtivo: configuracoes?.modalIdentificacaoAtivo ?? true
    }
  }
})
