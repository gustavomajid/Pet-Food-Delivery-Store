import type { ConfiguracoesLoja } from '~/types/loja'

export const FUNCIONAMENTO_LOJA_PADRAO = {
  aberta: true,
  modo: 'automatico',
  manual: false,
  horario: 'Todos os dias, das 08h as 18h. Domingo somente retirada.',
  mensagem: 'Loja aberta.',
  entregaDisponivel: true,
  mensagemEntrega: 'Entregas disponiveis de segunda a sexta ate as 17h e sabado ate as 14h.'
} as const

export function criarConfiguracoesLojaPadrao(): ConfiguracoesLoja {
  return {
    modalIdentificacaoAtivo: true,
    aceitarPedidosAutomaticamente: true,
    modoFuncionamentoOnline: 'automatico',
    funcionamento: { ...FUNCIONAMENTO_LOJA_PADRAO }
  }
}
