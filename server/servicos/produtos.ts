import { z } from 'zod'

export const produtoSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  descricao: z.string().trim().min(2).max(1000),
  categoriaId: z.number().int().positive(),
  marca: z.string().trim().min(1).max(120),
  precoCentavos: z.number().int().min(0),
  estoque: z.number().int().min(0),
  peso: z.string().trim().min(1).max(60),
  imagemUrl: z.string().trim().url(),
  destaque: z.boolean().default(false),
  promocao: z.boolean().default(false),
  ativo: z.boolean().default(true)
})
