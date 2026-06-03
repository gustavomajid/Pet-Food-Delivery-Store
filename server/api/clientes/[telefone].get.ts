import { desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import { usarBanco } from '../../banco/conexao'
import { pedidos } from '../../banco/esquema'

const telefoneSchema = z.string().regex(/^\d{8,14}$/)

export default defineEventHandler(async (event) => {
  const telefone = telefoneSchema.parse(getRouterParam(event, 'telefone') || '')

  const [pedido] = await usarBanco()
    .select({
      telefoneCliente: pedidos.telefoneCliente,
      nomeCliente: pedidos.nomeCliente,
      enderecoEntrega: pedidos.enderecoEntrega,
      tipoEntrega: pedidos.tipoEntrega,
      criadoEm: pedidos.criadoEm
    })
    .from(pedidos)
    .where(sql`regexp_replace(${pedidos.telefoneCliente}, '[^0-9]', '', 'g') = ${telefone}`)
    .orderBy(desc(pedidos.criadoEm))
    .limit(1)

  if (!pedido) {
    return { cliente: null }
  }

  return {
    cliente: {
      telefoneCliente: pedido.telefoneCliente,
      telefoneNormalizado: telefone,
      nomeCliente: pedido.nomeCliente,
      enderecoEntrega: pedido.enderecoEntrega,
      tipoEntrega: pedido.tipoEntrega,
      atualizadoEm: pedido.criadoEm.toISOString()
    }
  }
})
