import type { ConfiguracoesLoja } from '~/types/loja'

export const FUNCIONAMENTO_LOJA_PADRAO = {
  aberta: true,
  modo: 'automatico',
  manual: false,
  horario: 'Segunda a sabado, das 08h as 18h.',
  mensagem: 'Loja aberta.'
} as const

export function criarConfiguracoesLojaPadrao(): ConfiguracoesLoja {
  return {
    modalIdentificacaoAtivo: true,
    aceitarPedidosAutomaticamente: false,
    modoFuncionamentoOnline: 'automatico',
    funcionamento: { ...FUNCIONAMENTO_LOJA_PADRAO }
  }
}
