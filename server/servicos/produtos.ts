import { z } from 'zod'

const imagemProdutoSchema = z
  .string()
  .trim()
  .min(1)
  .max(1000)
  .refine((valor) => {
    if (valor.startsWith('/')) {
      return !valor.startsWith('//') && !valor.includes('..')
    }

    try {
      const url = new URL(valor)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }, 'Informe uma URL valida ou um caminho local iniciado com /.')

export const produtoSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  descricao: z.string().trim().min(2).max(1000),
  categoriaId: z.number().int().positive(),
  marca: z.string().trim().min(1).max(120),
  precoCentavos: z.number().int().min(0),
  estoque: z.number().int().min(0),
  fonteEstoque: z.enum(['sistema', 'wms']).default('sistema'),
  codigoExterno: z.string().trim().min(1).max(120).nullable().optional(),
  peso: z.string().trim().min(1).max(60),
  imagemUrl: imagemProdutoSchema,
  destaque: z.boolean().default(false),
  promocao: z.boolean().default(false),
  ativo: z.boolean().default(true)
}).superRefine((produto, contexto) => {
  if (produto.fonteEstoque === 'wms' && !produto.codigoExterno) {
    contexto.addIssue({
      code: 'custom',
      path: ['codigoExterno'],
      message: 'Informe o codigo externo para produtos controlados pelo WMS.'
    })
  }
})
