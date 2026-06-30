import type { PedidoResumo, StatusPedido } from '~/types/loja'
import { normalizarTelefone } from './useClienteReconhecimento'

const CHAVE_HISTORICO_PEDIDOS = 'fazendinha-historico-pedidos-v1'
const CHAVE_ULTIMO_PEDIDO = 'fazendinha-ultimo-pedido-v1'
const LIMITE_HISTORICO = 30
const STATUS_PEDIDO_ATIVO: StatusPedido[] = [
  'novo',
  'confirmado',
  'em_separacao',
  'saiu_para_entrega',
  'pronto_para_retirada'
]

function pedidoEstaAtivo(pedido: PedidoResumo) {
  return STATUS_PEDIDO_ATIVO.includes(pedido.status)
}

function ordenarPedidos(pedidos: PedidoResumo[]) {
  return [...pedidos].sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
  )
}

function mesclarPedidos(pedidos: PedidoResumo[]) {
  const mapa = new Map<string, PedidoResumo>()

  for (const pedido of pedidos) {
    if (!mapa.has(pedido.id)) {
      mapa.set(pedido.id, pedido)
    }
  }

  return ordenarPedidos([...mapa.values()]).slice(0, LIMITE_HISTORICO)
}

export function useHistoricoPedidos() {
  const historicoPedidos = useState<PedidoResumo[]>('historico-pedidos', () => [])
  const historicoCarregado = useState('historico-pedidos-carregado', () => false)
  const ultimoPedidoId = useState('ultimo-pedido-cliente', () => '')

  const pedidosAtivos = computed(() => historicoPedidos.value.filter(pedidoEstaAtivo))
  const pedidoAtivo = computed(() => pedidosAtivos.value[0] ?? null)
  const pedidoMaisRecente = computed(() => historicoPedidos.value[0] ?? null)

  function persistirHistorico() {
    if (!process.client) {
      return
    }

    window.localStorage.setItem(CHAVE_HISTORICO_PEDIDOS, JSON.stringify(historicoPedidos.value))

    const ultimoId = pedidoMaisRecente.value?.id || ultimoPedidoId.value

    if (ultimoId) {
      ultimoPedidoId.value = ultimoId
      window.localStorage.setItem(CHAVE_ULTIMO_PEDIDO, ultimoId)
    }
  }

  function carregarHistoricoLocal() {
    if (!process.client || historicoCarregado.value) {
      return
    }

    try {
      const salvos = window.localStorage.getItem(CHAVE_HISTORICO_PEDIDOS)
      historicoPedidos.value = salvos ? mesclarPedidos(JSON.parse(salvos)) : []
    } catch {
      historicoPedidos.value = []
    }

    ultimoPedidoId.value =
      historicoPedidos.value[0]?.id ||
      window.localStorage.getItem(CHAVE_ULTIMO_PEDIDO) ||
      ''

    historicoCarregado.value = true
  }

  if (process.client && !historicoCarregado.value) {
    carregarHistoricoLocal()
    watch(historicoPedidos, persistirHistorico, { deep: true })
  }

  function registrarPedido(pedido: PedidoResumo) {
    carregarHistoricoLocal()
    historicoPedidos.value = mesclarPedidos([pedido, ...historicoPedidos.value])
    persistirHistorico()
  }

  function registrarPedidos(pedidos: PedidoResumo[]) {
    carregarHistoricoLocal()
    historicoPedidos.value = mesclarPedidos([...pedidos, ...historicoPedidos.value])
    persistirHistorico()
  }

  function obterHistoricoPorTelefone(telefone?: string) {
    const telefoneNormalizado = normalizarTelefone(telefone || '')

    if (telefoneNormalizado.length < 8) {
      return historicoPedidos.value
    }

    return historicoPedidos.value.filter(
      (pedido) => normalizarTelefone(pedido.telefoneCliente) === telefoneNormalizado
    )
  }

  function obterPedidoAtivoPorTelefone(telefone?: string) {
    return obterHistoricoPorTelefone(telefone).find(pedidoEstaAtivo) ?? null
  }

  async function carregarHistoricoCliente(telefone: string) {
    const telefoneNormalizado = normalizarTelefone(telefone)

    if (telefoneNormalizado.length < 8) {
      return []
    }

    carregarHistoricoLocal()

    try {
      const resposta = await $fetch<{ pedidos: PedidoResumo[] }>(
        `/api/clientes/${telefoneNormalizado}/pedidos`
      )

      registrarPedidos(resposta.pedidos)

      return resposta.pedidos
    } catch {
      return obterHistoricoPorTelefone(telefoneNormalizado)
    }
  }

  async function recarregarPedido(id: string) {
    try {
      const resposta = await $fetch<{ pedido: PedidoResumo }>(`/api/pedidos/${id}`)
      registrarPedido(resposta.pedido)

      return resposta.pedido
    } catch {
      return null
    }
  }

  return {
    historicoPedidos,
    pedidosAtivos,
    pedidoAtivo,
    pedidoMaisRecente,
    ultimoPedidoId,
    carregarHistoricoLocal,
    carregarHistoricoCliente,
    registrarPedido,
    registrarPedidos,
    recarregarPedido,
    obterHistoricoPorTelefone,
    obterPedidoAtivoPorTelefone,
    pedidoEstaAtivo
  }
}
