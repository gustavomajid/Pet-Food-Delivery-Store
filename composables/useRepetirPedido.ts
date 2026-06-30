import type { PedidoResumo, ResultadoRepetirPedido } from '~/types/loja'

function mensagemErroRepeticao(error: unknown) {
  const erro = error as {
    data?: {
      message?: string
      statusMessage?: string
    }
    message?: string
  }

  return erro.data?.statusMessage ||
    erro.data?.message ||
    erro.message ||
    'Nao foi possivel repetir este pedido.'
}

function montarAvisoRepeticao(resposta: ResultadoRepetirPedido) {
  const avisos = ['Carrinho atualizado com precos e estoque atuais.']

  if (resposta.indisponiveis.length > 0) {
    avisos.push(`Indisponiveis: ${resposta.indisponiveis.join(', ')}.`)
  }

  if (resposta.quantidadesAjustadas.length > 0) {
    avisos.push(`Quantidade ajustada ao estoque: ${resposta.quantidadesAjustadas.join(', ')}.`)
  }

  return avisos.join(' ')
}

export function useRepetirPedido() {
  const repetindoPedidoId = ref('')
  const avisoRepeticao = ref('')
  const erroRepeticao = ref('')
  const { substituirItens } = useCarrinho()

  async function repetirPedido(pedido: PedidoResumo) {
    if (repetindoPedidoId.value) {
      return false
    }

    repetindoPedidoId.value = pedido.id
    avisoRepeticao.value = ''
    erroRepeticao.value = ''

    try {
      const resposta = await $fetch<ResultadoRepetirPedido>(
        `/api/pedidos/${pedido.id}/repetir`
      )

      if (resposta.itens.length === 0) {
        erroRepeticao.value = 'Os produtos deste pedido estao indisponiveis no momento.'
        return false
      }

      substituirItens(resposta.itens, pedido.tipoEntrega)
      avisoRepeticao.value = montarAvisoRepeticao(resposta)

      return true
    } catch (error) {
      erroRepeticao.value = mensagemErroRepeticao(error)
      return false
    } finally {
      repetindoPedidoId.value = ''
    }
  }

  return {
    repetindoPedidoId,
    avisoRepeticao,
    erroRepeticao,
    repetirPedido
  }
}
