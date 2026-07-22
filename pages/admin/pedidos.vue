<script setup lang="ts">
import { CheckCircle2, PackageCheck, Printer, Truck } from '@lucide/vue'
import type { PedidoResumo, StatusPedido } from '~/types/loja'

const { formatarCentavos } = useDinheiro()

const CHAVE_PEDIDOS_IMPRESSOS = 'fazendinha-pedidos-impressos-v1'
const INTERVALO_ATUALIZACAO_PEDIDOS_MS = 15000

const erroAdmin = ref('')
const statusAtualizando = ref<string | null>(null)
const pedidosParaImpressao = ref<PedidoResumo[]>([])
const filtroStatus = ref<'ativos' | 'todos' | StatusPedido>('ativos')
const versaoPedidosImpressos = ref(0)

let idsPedidosConhecidos = new Set<string>()
let idsPedidosImpressos = new Set<string>()
let primeiraCargaPedidos = true
let monitorarPedidos = false
let intervaloAtualizacaoPedidos: ReturnType<typeof setInterval> | undefined

const {
  data: dadosPedidos,
  refresh: recarregarPedidos
} = await useFetch<{ pedidos: PedidoResumo[] }>('/api/admin/pedidos', {
  default: () => ({ pedidos: [] }),
  immediate: false,
  credentials: 'include'
})

const pedidos = computed(() => dadosPedidos.value?.pedidos ?? [])

const statusPedido: Array<{ valor: StatusPedido; texto: string }> = [
  { valor: 'novo', texto: 'Novo' },
  { valor: 'confirmado', texto: 'Confirmado' },
  { valor: 'em_separacao', texto: 'Em separacao' },
  { valor: 'saiu_para_entrega', texto: 'Saiu para entrega' },
  { valor: 'pronto_para_retirada', texto: 'Pronto para retirada' },
  { valor: 'finalizado', texto: 'Finalizado' },
  { valor: 'cancelado', texto: 'Cancelado' }
]

const pedidosFiltrados = computed(() => {
  if (filtroStatus.value === 'todos') {
    return pedidos.value
  }

  if (filtroStatus.value === 'ativos') {
    return pedidos.value.filter((pedido) =>
      ['novo', 'confirmado', 'em_separacao', 'saiu_para_entrega', 'pronto_para_retirada'].includes(pedido.status)
    )
  }

  return pedidos.value.filter((pedido) => pedido.status === filtroStatus.value)
})

const gruposStatus = computed(() =>
  statusPedido
    .map((status) => ({
      ...status,
      pedidos: pedidosFiltrados.value.filter((pedido) => pedido.status === status.valor)
    }))
    .filter((grupo) => grupo.pedidos.length > 0)
)

const totalNovos = computed(() => pedidos.value.filter((pedido) => pedido.status === 'novo').length)
const totalEmAndamento = computed(() =>
  pedidos.value.filter((pedido) =>
    ['confirmado', 'em_separacao', 'saiu_para_entrega', 'pronto_para_retirada'].includes(pedido.status)
  ).length
)
const totalFinalizados = computed(() => pedidos.value.filter((pedido) => pedido.status === 'finalizado').length)
const pedidosPendentesImpressao = computed(() => {
  versaoPedidosImpressos.value

  return pedidos.value.filter(
    (pedido) =>
      ['confirmado', 'em_separacao'].includes(pedido.status)
      && !idsPedidosImpressos.has(pedido.id)
  )
})

function textoStatus(status: StatusPedido) {
  return statusPedido.find((item) => item.valor === status)?.texto ?? status
}

function textoEntrega(pedido: PedidoResumo) {
  if (pedido.tipoEntrega === 'retirada') {
    return 'Retirada'
  }

  if (pedido.tipoEntrega === 'agendada') {
    return 'Entrega agendada'
  }

  return 'Entrega local'
}

function textoPagamento(pedido: PedidoResumo) {
  const mapa = {
    pix: 'Pix',
    dinheiro: 'Dinheiro',
    cartao_entrega: 'Cartao na entrega'
  }

  return mapa[pedido.formaPagamento]
}

function formatarData(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(valor))
}

function linhasEndereco(endereco: string) {
  return endereco.split(',').map((parte) => parte.trim()).filter(Boolean)
}

function carregarIdsPedidosImpressos() {
  if (!import.meta.client) {
    return new Set<string>()
  }

  try {
    const valor = window.localStorage.getItem(CHAVE_PEDIDOS_IMPRESSOS)
    const ids = valor ? JSON.parse(valor) : []

    if (!Array.isArray(ids)) {
      return new Set<string>()
    }

    return new Set(ids.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set<string>()
  }
}

function salvarIdsPedidosImpressos() {
  if (!import.meta.client) {
    return
  }

  const ids = [...idsPedidosImpressos].slice(-500)
  window.localStorage.setItem(CHAVE_PEDIDOS_IMPRESSOS, JSON.stringify(ids))
}

function registrarPedidosImpressos(listaPedidos: PedidoResumo[]) {
  for (const pedido of listaPedidos) {
    idsPedidosImpressos.add(pedido.id)
  }

  salvarIdsPedidosImpressos()
  versaoPedidosImpressos.value += 1
}

async function imprimirPedidos(listaPedidos: PedidoResumo[]) {
  if (!import.meta.client || listaPedidos.length === 0) {
    return
  }

  pedidosParaImpressao.value = listaPedidos
  document.body.classList.add('imprimindo-pedido')

  await nextTick()
  window.print()
}

function imprimirPedido(pedido: PedidoResumo) {
  registrarPedidosImpressos([pedido])
  void imprimirPedidos([pedido])
}

function imprimirFilaPendente() {
  const fila = pedidosPendentesImpressao.value

  registrarPedidosImpressos(fila)
  void imprimirPedidos(fila)
}

function proximaAcao(pedido: PedidoResumo) {
  if (pedido.status === 'novo') {
    return { status: 'confirmado' as const, texto: 'Confirmar', icone: CheckCircle2 }
  }

  if (pedido.status === 'confirmado') {
    return { status: 'em_separacao' as const, texto: 'Separar', icone: PackageCheck }
  }

  if (pedido.status === 'em_separacao') {
    return pedido.tipoEntrega === 'retirada'
      ? { status: 'pronto_para_retirada' as const, texto: 'Pronto', icone: CheckCircle2 }
      : { status: 'saiu_para_entrega' as const, texto: 'Despachar', icone: Truck }
  }

  if (['saiu_para_entrega', 'pronto_para_retirada'].includes(pedido.status)) {
    return { status: 'finalizado' as const, texto: 'Finalizar', icone: CheckCircle2 }
  }

  return null
}

function encerrarImpressao() {
  if (!import.meta.client) {
    return
  }

  document.body.classList.remove('imprimindo-pedido')
  pedidosParaImpressao.value = []
}

function processarPedidosRecebidos() {
  const listaPedidos = pedidos.value

  if (primeiraCargaPedidos) {
    idsPedidosConhecidos = new Set(listaPedidos.map((pedido) => pedido.id))
    primeiraCargaPedidos = false
    return
  }

  const pedidosNovosParaImpressao = listaPedidos.filter(
    (pedido) =>
      ['confirmado', 'em_separacao'].includes(pedido.status)
      && !idsPedidosConhecidos.has(pedido.id)
      && !idsPedidosImpressos.has(pedido.id)
  )

  idsPedidosConhecidos = new Set(listaPedidos.map((pedido) => pedido.id))

  if (pedidosNovosParaImpressao.length === 0) {
    return
  }

  registrarPedidosImpressos(pedidosNovosParaImpressao)
  void imprimirPedidos(pedidosNovosParaImpressao)
}

async function carregarPedidos(opcoes: { silencioso?: boolean } = {}) {
  if (!opcoes.silencioso) {
    erroAdmin.value = ''
  }

  try {
    await recarregarPedidos()
    monitorarPedidos = true
    processarPedidosRecebidos()
  } catch {
    if (!opcoes.silencioso) {
      erroAdmin.value = 'Nao foi possivel carregar os pedidos.'
    }
  }
}

async function alterarStatus(pedido: PedidoResumo, status: StatusPedido) {
  statusAtualizando.value = pedido.id
  erroAdmin.value = ''

  try {
    await $fetch(`/api/admin/pedidos/${pedido.id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: { status }
    })
    await recarregarPedidos()
  } catch {
    erroAdmin.value = 'Nao foi possivel alterar o status do pedido.'
  } finally {
    statusAtualizando.value = null
  }
}

async function alterarStatusPeloEvento(pedido: PedidoResumo, evento: Event) {
  const alvo = evento.target as HTMLSelectElement
  await alterarStatus(pedido, alvo.value as StatusPedido)
}

onMounted(() => {
  idsPedidosImpressos = carregarIdsPedidosImpressos()
  window.addEventListener('afterprint', encerrarImpressao)

  intervaloAtualizacaoPedidos = setInterval(() => {
    if (monitorarPedidos) {
      void carregarPedidos({ silencioso: true })
    }
  }, INTERVALO_ATUALIZACAO_PEDIDOS_MS)
})

onBeforeUnmount(() => {
  if (intervaloAtualizacaoPedidos) {
    clearInterval(intervaloAtualizacaoPedidos)
  }

  window.removeEventListener('afterprint', encerrarImpressao)
  encerrarImpressao()
})
</script>

<template>
  <AdminArea
    titulo="Pedidos"
    subtitulo="Acompanhamento de vendas"
    @autenticado="carregarPedidos"
    @recarregar="carregarPedidos"
  >
    <p v-if="erroAdmin" class="erro-formulario">{{ erroAdmin }}</p>

    <section class="metricas-admin" aria-label="Resumo dos pedidos">
      <article class="metrica-admin metrica-admin--alerta">
        <span>Novos</span>
        <strong>{{ totalNovos }}</strong>
      </article>
      <article class="metrica-admin">
        <span>Em andamento</span>
        <strong>{{ totalEmAndamento }}</strong>
      </article>
      <article class="metrica-admin">
        <span>Finalizados</span>
        <strong>{{ totalFinalizados }}</strong>
      </article>
      <article class="metrica-admin">
        <span>Total</span>
        <strong>{{ pedidos.length }}</strong>
      </article>
    </section>

    <section class="painel-admin barra-operacao-pedidos">
      <div class="filtros-pedidos" aria-label="Filtrar pedidos">
        <button type="button" :class="{ ativo: filtroStatus === 'ativos' }" @click="filtroStatus = 'ativos'">
          Ativos <strong>{{ totalNovos + totalEmAndamento }}</strong>
        </button>
        <button type="button" :class="{ ativo: filtroStatus === 'confirmado' }" @click="filtroStatus = 'confirmado'">
          Confirmados <strong>{{ pedidos.filter((pedido) => pedido.status === 'confirmado').length }}</strong>
        </button>
        <button type="button" :class="{ ativo: filtroStatus === 'em_separacao' }" @click="filtroStatus = 'em_separacao'">
          Separação <strong>{{ pedidos.filter((pedido) => pedido.status === 'em_separacao').length }}</strong>
        </button>
        <button type="button" :class="{ ativo: filtroStatus === 'todos' }" @click="filtroStatus = 'todos'">
          Todos <strong>{{ pedidos.length }}</strong>
        </button>
      </div>

      <button
        class="botao-admin botao-imprimir-fila"
        type="button"
        :disabled="pedidosPendentesImpressao.length === 0"
        @click="imprimirFilaPendente"
      >
        <Printer :size="17" aria-hidden="true" />
        Imprimir fila ({{ pedidosPendentesImpressao.length }})
      </button>
    </section>

    <section v-if="pedidos.length === 0" class="painel-admin">
      <div class="painel-estado painel-estado--compacto">
        <strong>Nenhum pedido recebido</strong>
        <span>Quando o cliente finalizar a compra, o pedido vai aparecer aqui.</span>
      </div>
    </section>

    <section v-else-if="pedidosFiltrados.length === 0" class="painel-admin">
      <div class="painel-estado painel-estado--compacto">
        <strong>Nenhum pedido neste filtro</strong>
        <span>Escolha outro status para continuar.</span>
      </div>
    </section>

    <section v-for="grupo in gruposStatus" :key="grupo.valor" class="painel-admin grupo-pedidos" :data-status="grupo.valor">
      <div class="titulo-secao">
        <h1>{{ grupo.texto }}</h1>
        <span>{{ grupo.pedidos.length }} pedido(s)</span>
      </div>

      <div v-if="grupo.pedidos.length === 0" class="painel-estado painel-estado--compacto">
        <strong>Nenhum pedido novo</strong>
        <span>Pedidos novos caem automaticamente nesta fila.</span>
      </div>

      <div v-else class="lista-admin lista-pedidos-admin">
        <article v-for="pedido in grupo.pedidos" :key="pedido.id" class="pedido-admin pedido-admin--detalhado">
          <div class="pedido-admin__topo">
            <div>
              <strong>{{ pedido.nomeCliente }}</strong>
              <span>#{{ pedido.id.slice(0, 8) }} - {{ formatarData(pedido.criadoEm) }}</span>
            </div>
            <div class="pedido-admin__valor-status">
              <span class="status-admin">{{ textoStatus(pedido.status) }}</span>
              <strong>{{ formatarCentavos(pedido.totalCentavos) }}</strong>
            </div>
          </div>

          <div class="pedido-admin__grid">
            <section class="pedido-admin__bloco">
              <strong>Cliente</strong>
              <span>{{ pedido.telefoneCliente }}</span>
              <span>{{ textoPagamento(pedido) }}</span>
            </section>

            <section class="pedido-admin__bloco">
              <strong>{{ textoEntrega(pedido) }}</strong>
              <span v-for="linha in linhasEndereco(pedido.enderecoEntrega)" :key="linha">
                {{ linha }}
              </span>
            </section>

            <section class="pedido-admin__bloco pedido-admin__bloco--itens">
              <strong>Itens</strong>
              <ul>
                <li v-for="item in pedido.itens" :key="item.id">
                  <span>{{ item.quantidade }}x {{ item.nomeProduto }}</span>
                  <strong>{{ formatarCentavos(item.subtotalCentavos) }}</strong>
                </li>
              </ul>
            </section>

            <section class="pedido-admin__bloco">
              <strong>Status</strong>
              <select
                :value="pedido.status"
                :disabled="statusAtualizando === pedido.id"
                @change="alterarStatusPeloEvento(pedido, $event)"
              >
                <option v-for="status in statusPedido" :key="status.valor" :value="status.valor">
                  {{ status.texto }}
                </option>
              </select>
              <span>{{ statusAtualizando === pedido.id ? 'Atualizando...' : textoStatus(pedido.status) }}</span>
              <button
                class="botao-admin botao-admin--secundario botao-admin--compacto"
                type="button"
                @click="imprimirPedido(pedido)"
              >
                <Printer :size="16" aria-hidden="true" />
                Imprimir
              </button>
              <button
                v-if="proximaAcao(pedido)"
                class="botao-admin botao-admin--compacto"
                type="button"
                :disabled="statusAtualizando === pedido.id"
                @click="alterarStatus(pedido, proximaAcao(pedido)!.status)"
              >
                <component :is="proximaAcao(pedido)!.icone" :size="16" aria-hidden="true" />
                {{ proximaAcao(pedido)!.texto }}
              </button>
            </section>
          </div>

          <p v-if="pedido.observacoes" class="pedido-admin__observacao">
            {{ pedido.observacoes }}
          </p>
        </article>
      </div>
    </section>

    <section class="impressao-pedidos" aria-hidden="true">
      <article v-for="pedido in pedidosParaImpressao" :key="pedido.id" class="cupom-pedido">
        <header class="cupom-pedido__topo">
          <strong>Fazendinha</strong>
          <span>Pedido #{{ pedido.id.slice(0, 8) }}</span>
          <span>{{ formatarData(pedido.criadoEm) }}</span>
        </header>

        <section class="cupom-pedido__bloco">
          <strong>Cliente</strong>
          <span>{{ pedido.nomeCliente }}</span>
          <span>{{ pedido.telefoneCliente }}</span>
          <span>{{ textoPagamento(pedido) }}</span>
        </section>

        <section class="cupom-pedido__bloco">
          <strong>{{ textoEntrega(pedido) }}</strong>
          <span v-for="linha in linhasEndereco(pedido.enderecoEntrega)" :key="linha">
            {{ linha }}
          </span>
        </section>

        <section class="cupom-pedido__bloco">
          <strong>Itens</strong>
          <ul>
            <li v-for="item in pedido.itens" :key="item.id">
              <span>{{ item.quantidade }}x {{ item.nomeProduto }}</span>
              <strong>{{ formatarCentavos(item.subtotalCentavos) }}</strong>
            </li>
          </ul>
        </section>

        <section class="cupom-pedido__totais">
          <span>Subtotal <strong>{{ formatarCentavos(pedido.subtotalCentavos) }}</strong></span>
          <span>Entrega <strong>{{ formatarCentavos(pedido.taxaEntregaCentavos) }}</strong></span>
          <span>Total <strong>{{ formatarCentavos(pedido.totalCentavos) }}</strong></span>
        </section>

        <p v-if="pedido.observacoes" class="cupom-pedido__observacao">
          Observacoes: {{ pedido.observacoes }}
        </p>
      </article>
    </section>
  </AdminArea>
</template>
