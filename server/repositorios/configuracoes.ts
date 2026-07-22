import { eq } from 'drizzle-orm'
import { configuracoesLoja } from '../banco/esquema'
import type { Banco } from '../banco/tipos'

const ID_CONFIGURACOES = 1
export const MODO_FUNCIONAMENTO_PADRAO = 'automatico'

export type ModoFuncionamentoOnline = 'automatico' | 'aberta' | 'fechada'

export type DadosConfiguracoes = {
  modalIdentificacaoAtivo: boolean
  aceitarPedidosAutomaticamente: boolean
  modoFuncionamentoOnline: ModoFuncionamentoOnline
}

export function repositorioConfiguracoes(banco: Banco) {
  async function criarPadrao() {
    const [configuracoes] = await banco
      .insert(configuracoesLoja)
      .values({
        id: ID_CONFIGURACOES,
        modalIdentificacaoAtivo: true,
        aceitarPedidosAutomaticamente: true,
        modoFuncionamentoOnline: MODO_FUNCIONAMENTO_PADRAO
      })
      .onConflictDoNothing()
      .returning()

    return configuracoes
  }

  return {
    async obter() {
      const [configuracoes] = await banco
        .select()
        .from(configuracoesLoja)
        .where(eq(configuracoesLoja.id, ID_CONFIGURACOES))
        .limit(1)

      if (configuracoes) {
        return configuracoes
      }

      const criadas = await criarPadrao()

      if (criadas) {
        return criadas
      }

      const [existentes] = await banco
        .select()
        .from(configuracoesLoja)
        .where(eq(configuracoesLoja.id, ID_CONFIGURACOES))
        .limit(1)

      return existentes
    },

    async salvar(dados: DadosConfiguracoes) {
      const [configuracoes] = await banco
        .insert(configuracoesLoja)
        .values({
          id: ID_CONFIGURACOES,
          modalIdentificacaoAtivo: dados.modalIdentificacaoAtivo,
          aceitarPedidosAutomaticamente: dados.aceitarPedidosAutomaticamente,
          modoFuncionamentoOnline: dados.modoFuncionamentoOnline,
          atualizadoEm: new Date()
        })
        .onConflictDoUpdate({
          target: configuracoesLoja.id,
          set: {
            modalIdentificacaoAtivo: dados.modalIdentificacaoAtivo,
            aceitarPedidosAutomaticamente: dados.aceitarPedidosAutomaticamente,
            modoFuncionamentoOnline: dados.modoFuncionamentoOnline,
            atualizadoEm: new Date()
          }
        })
        .returning()

      return configuracoes
    }
  }
}
