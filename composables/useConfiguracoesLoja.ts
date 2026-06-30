import type { ConfiguracoesLoja } from '~/types/loja'

export const FUNCIONAMENTO_LOJA_PADRAO = {
  aberta: true,
  modo: 'automatico',
  manual: false,
  horario: 'Loja online aberta de segunda a sabado, das 08h as 18h. Domingo fechado.',
  mensagem: 'Loja online aberta para pedidos.'
} as const

export function criarConfiguracoesLojaPadrao(): ConfiguracoesLoja {
  return {
    modalIdentificacaoAtivo: true,
    aceitarPedidosAutomaticamente: false,
    modoFuncionamentoOnline: 'automatico',
    funcionamento: { ...FUNCIONAMENTO_LOJA_PADRAO }
  }
}
