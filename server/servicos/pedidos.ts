import { createError } from 'h3'
import { inArray } from 'drizzle-orm'
import { z } from 'zod'
import { produtos } from '../banco/esquema'
import type { Banco } from '../banco/tipos'
import { repositorioConfiguracoes } from '../repositorios/configuracoes'
import { repositorioPedidos } from '../repositorios/pedidos'
import type { PedidoResumo, StatusPedido } from '../../types/loja'

export const pedidoSchema = z.object({
  nomeCliente: z.string().trim().min(2).max(160),
  telefoneCliente: z.string().trim().min(8).max(40),
  enderecoEntrega: z.string().trim().min(4).max(500),
  tipoEntrega: z.enum(['retirada', 'entrega_local', 'agendada']),
  formaPagamento: z.enum(['pix', 'dinheiro', 'cartao_entrega']),
  observacoes: z.string().trim().max(500).optional().or(z.literal('')),
  itens: z
    .array(
      z.object({
        produtoId: z.number().int().positive(),
        quantidade: z.number().int().min(1).max(99)
      })
    )
    .min(1)
})

export const statusPedidoSchema = z.enum([
  'novo',
  'confirmado',
  'em_separacao',
  'saiu_para_entrega',
  'pronto_para_retirada',
  'finalizado',
  'cancelado'
])

export type PedidoEntrada = z.infer<typeof pedidoSchema>

const TAXA_ENTREGA_CENTAVOS = 1200
const FRETE_GRATIS_A_PARTIR_DE = 25000
const FUSO_HORARIO_LOJA = 'America/Sao_Paulo'
const ABERTURA_PADRAO_MINUTOS = 8 * 60
const FECHAMENTO_SEMANA_MINUTOS = 18 * 60
const FECHAMENTO_DOMINGO_MINUTOS = 12 * 60
const STATUS_PEDIDO_ATIVO: StatusPedido[] = [
  'novo',
  'confirmado',
  'em_separacao',
  'saiu_para_entrega',
  'pronto_para_retirada'
]

const formatadorHorarioLoja = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSO_HORARIO_LOJA,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
})

const diasSemana = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
} as const

type PedidoComItensBanco = Awaited<
  ReturnType<ReturnType<typeof repositorioPedidos>['obterComItens']>
>

export function normalizarTelefonePedido(telefone: string) {
  return telefone.replace(/\D/g, '').slice(0, 14)
}

export function pedidoEstaAtivo(status: StatusPedido) {
  return STATUS_PEDIDO_ATIVO.includes(status)
}

export function lojaEstaAberta(data = new Date()) {
  const partes = Object.fromEntries(
    formatadorHorarioLoja
      .formatToParts(data)
      .map((parte) => [parte.type, parte.value])
  )
  const diaSemana = diasSemana[partes.weekday as keyof typeof diasSemana]
  const hora = Number(partes.hour)
  const minuto = Number(partes.minute)

  if (diaSemana === undefined || Number.isNaN(hora) || Number.isNaN(minuto)) {
    return false
  }

  const minutosDoDia = hora * 60 + minuto

  if (diaSemana === 0) {
    return minutosDoDia >= ABERTURA_PADRAO_MINUTOS
      && minutosDoDia < FECHAMENTO_DOMINGO_MINUTOS
  }

  return minutosDoDia >= ABERTURA_PADRAO_MINUTOS
    && minutosDoDia < FECHAMENTO_SEMANA_MINUTOS
}

export function mapearPedidoResumo(pedido: NonNullable<PedidoComItensBanco>): PedidoResumo {
  return {
    id: pedido.id,
    nomeCliente: pedido.nomeCliente,
    telefoneCliente: pedido.telefoneCliente,
    enderecoEntrega: pedido.enderecoEntrega,
    tipoEntrega: pedido.tipoEntrega,
    formaPagamento: pedido.formaPagamento,
    status: pedido.status,
    subtotalCentavos: pedido.subtotalCentavos,
    taxaEntregaCentavos: pedido.taxaEntregaCentavos,
    descontoCentavos: pedido.descontoCentavos,
    totalCentavos: pedido.totalCentavos,
    observacoes: pedido.observacoes,
    criadoEm: pedido.criadoEm.toISOString(),
    itens: pedido.itens?.map((item) => ({
      id: item.id,
      pedidoId: item.pedidoId,
      produtoId: item.produtoId,
      nomeProduto: item.nomeProduto,
      quantidade: item.quantidade,
      precoUnitarioCentavos: item.precoUnitarioCentavos,
      subtotalCentavos: item.subtotalCentavos
    })) ?? []
  }
}

export async function criarPedido(banco: Banco, entrada: PedidoEntrada) {
  const repositorio = repositorioPedidos(banco)
  const telefoneNormalizado = normalizarTelefonePedido(entrada.telefoneCliente)

  if (telefoneNormalizado.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe um telefone valido.'
    })
  }

  const pedidoAtivo = await repositorio.obterAtivoPorTelefoneNormalizado(telefoneNormalizado)

  if (pedidoAtivo) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Voce ja tem um pedido em andamento.',
      data: {
        pedido: mapearPedidoResumo(pedidoAtivo)
      }
    })
  }

  const ids = [...new Set(entrada.itens.map((item) => item.produtoId))]
  const produtosEncontrados = await banco
    .select()
    .from(produtos)
    .where(inArray(produtos.id, ids))

  const produtosPorId = new Map(produtosEncontrados.map((produto) => [produto.id, produto]))

  const itens = entrada.itens.map((item) => {
    const produto = produtosPorId.get(item.produtoId)

    if (!produto || !produto.ativo) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Produto indisponível.'
      })
    }

    if (produto.estoque < item.quantidade) {
      throw createError({
        statusCode: 409,
        statusMessage: `${produto.nome} não tem estoque suficiente.`
      })
    }

    return {
      produtoId: produto.id,
      nomeProduto: produto.nome,
      quantidade: item.quantidade,
      precoUnitarioCentavos: produto.precoCentavos,
      subtotalCentavos: produto.precoCentavos * item.quantidade
    }
  })

  const subtotalCentavos = itens.reduce((total, item) => total + item.subtotalCentavos, 0)
  const taxaEntregaCentavos =
    entrada.tipoEntrega === 'retirada' || subtotalCentavos >= FRETE_GRATIS_A_PARTIR_DE
      ? 0
      : TAXA_ENTREGA_CENTAVOS
  const descontoCentavos = 0
  const totalCentavos = subtotalCentavos + taxaEntregaCentavos - descontoCentavos
  const configuracoes = await repositorioConfiguracoes(banco).obter()
  const statusInicial: StatusPedido = configuracoes?.aceitarPedidosAutomaticamente && lojaEstaAberta()
    ? 'em_separacao'
    : 'novo'

  const pedido = await repositorio.criar({
    nomeCliente: entrada.nomeCliente,
    telefoneCliente: entrada.telefoneCliente,
    enderecoEntrega: entrada.enderecoEntrega,
    tipoEntrega: entrada.tipoEntrega,
    formaPagamento: entrada.formaPagamento,
    subtotalCentavos,
    taxaEntregaCentavos,
    descontoCentavos,
    totalCentavos,
    status: statusInicial,
    observacoes: entrada.observacoes || undefined,
    itens
  })

  const itensResumo = itens.map((item, indice) => ({
    id: indice + 1,
    pedidoId: pedido.id,
    produtoId: item.produtoId,
    nomeProduto: item.nomeProduto,
    quantidade: item.quantidade,
    precoUnitarioCentavos: item.precoUnitarioCentavos,
    subtotalCentavos: item.subtotalCentavos
  }))

  return mapearPedidoResumo({
    ...pedido,
    itens: itensResumo
  })
}

export async function listarHistoricoPedidosCliente(banco: Banco, telefone: string) {
  const telefoneNormalizado = normalizarTelefonePedido(telefone)

  if (telefoneNormalizado.length < 8) {
    return []
  }

  const pedidos = await repositorioPedidos(banco)
    .listarPorTelefoneNormalizado(telefoneNormalizado)

  return pedidos.map(mapearPedidoResumo)
}
