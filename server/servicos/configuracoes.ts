import { z } from 'zod'

export const configuracoesSchema = z.object({
  modalIdentificacaoAtivo: z.boolean(),
  aceitarPedidosAutomaticamente: z.boolean(),
  modoFuncionamentoOnline: z.enum(['automatico', 'aberta', 'fechada']).default('automatico')
})
