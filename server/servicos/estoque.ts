import { and, asc, eq, gte, inArray } from 'drizzle-orm'
import { createError } from 'h3'
import { z } from 'zod'
import { movimentacoesEstoque, produtos } from '../banco/esquema'
import type { Banco } from '../banco/tipos'

export const sincronizacaoEstoqueWmsSchema = z.object({
  itens: z.array(z.object({
    codigoExterno: z.string().trim().min(1).max(120),
    quantidadeDisponivel: z.number().int().min(0)
  })).min(1).max(500)
}).superRefine(({ itens }, contexto) => {
  const codigos = new Set<string>()

  itens.forEach((item, indice) => {
    if (codigos.has(item.codigoExterno)) {
      contexto.addIssue({
        code: 'custom',
        path: ['itens', indice, 'codigoExterno'],
        message: 'Codigo externo duplicado na mesma sincronizacao.'
      })
    }

    codigos.add(item.codigoExterno)
  })
})

type SincronizacaoEstoqueWms = z.infer<typeof sincronizacaoEstoqueWmsSchema>

export async function sincronizarEstoqueWms(banco: Banco, entrada: SincronizacaoEstoqueWms) {
  return banco.transaction(async (tx) => {
    const codigos = entrada.itens.map((item) => item.codigoExterno)
    const produtosEncontrados = await tx
      .select()
      .from(produtos)
      .where(and(
        eq(produtos.fonteEstoque, 'wms'),
        inArray(produtos.codigoExterno, codigos)
      ))
      .orderBy(asc(produtos.id))
      .for('update')
    const produtosPorCodigo = new Map(
      produtosEncontrados.map((produto) => [produto.codigoExterno, produto])
    )
    const codigosInvalidos = codigos.filter((codigo) => !produtosPorCodigo.has(codigo))

    if (codigosInvalidos.length > 0) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Existem codigos nao cadastrados ou nao controlados pelo WMS.',
        data: { codigosInvalidos }
      })
    }

    const agora = new Date()
    const atualizados = []

    for (const item of entrada.itens) {
      const produtoAnterior = produtosPorCodigo.get(item.codigoExterno)!
      const [produtoAtualizado] = await tx
        .update(produtos)
        .set({
          estoque: item.quantidadeDisponivel,
          estoqueAtualizadoEm: agora,
          atualizadoEm: agora
        })
        .where(eq(produtos.id, produtoAnterior.id))
        .returning({
          id: produtos.id,
          codigoExterno: produtos.codigoExterno,
          quantidadeDisponivel: produtos.estoque,
          atualizadoEm: produtos.estoqueAtualizadoEm
        })

      if (produtoAnterior.estoque !== item.quantidadeDisponivel) {
        await tx.insert(movimentacoesEstoque).values({
          produtoId: produtoAnterior.id,
          quantidadeAnterior: produtoAnterior.estoque,
          quantidadeNova: item.quantidadeDisponivel,
          diferenca: item.quantidadeDisponivel - produtoAnterior.estoque,
          origem: 'wms',
          referencia: item.codigoExterno
        })
      }

      if (produtoAtualizado) {
        atualizados.push(produtoAtualizado)
      }
    }

    return atualizados
  })
}

export async function listarEstoqueWms(banco: Banco, atualizadoDesde?: Date) {
  return banco
    .select({
      id: produtos.id,
      codigoExterno: produtos.codigoExterno,
      nome: produtos.nome,
      quantidadeDisponivel: produtos.estoque,
      ativo: produtos.ativo,
      atualizadoEm: produtos.estoqueAtualizadoEm
    })
    .from(produtos)
    .where(and(
      eq(produtos.fonteEstoque, 'wms'),
      atualizadoDesde ? gte(produtos.estoqueAtualizadoEm, atualizadoDesde) : undefined
    ))
}
