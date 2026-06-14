import { z } from 'zod'

export const configuracoesSchema = z.object({
  modalIdentificacaoAtivo: z.boolean(),
  aceitarPedidosAutomaticamente: z.boolean()
})
