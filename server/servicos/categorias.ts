import { z } from 'zod'

export const categoriaSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  descricao: z.string().trim().max(500).optional().or(z.literal('')),
  ativo: z.boolean().default(true)
})
