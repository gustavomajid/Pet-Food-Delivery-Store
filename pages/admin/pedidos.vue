<script setup lang="ts">
import { CheckCircle2, PackageCheck, Printer, Search, Truck, X } from '@lucide/vue'
import type { PedidoResumo, StatusPedido } from '~/types/loja'

const { formatarCentavos } = useDinheiro()

const CHAVE_PEDIDOS_IMPRESSOS = 'fazendinha-pedidos-impressos-v1'
const INTERVALO_ATUALIZACAO_PEDIDOS_MS = 15000

const erroAdmin = ref('')
const statusAtualizando = ref<string | null>(null)
const pedidosParaImpressao = ref<PedidoResumo[]>([])
const filaImpressao = ref<PedidoResumo[]>([])
const pedidoEmImpressao = ref<PedidoResumo | null>(null)
const filtroStatus = ref<'todos' | 'entrega' | StatusPedido>('confirmado')
const buscaPedidos = ref('')
const paginaAtual = ref(1)
const pedidoExpandidoId = ref<string | null>(null)
const versaoPedidosImpressos = ref(0)

const PEDIDOS_POR_PAGINA = 5

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
const pedidoSelecionado = computed(() =>
  pedidos.value.find((pedido) => pedido.id === pedidoExpandidoId.value) ?? null
)

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
  const termo = buscaPedidos.value.trim().toLocaleLowerCase('pt-BR')
  const correspondeBusca = (pedido: PedidoResumo) => {
    if (!termo) {
      return true
    }

    return [
      pedido.id,
      pedido.nomeCliente,
      pedido.telefoneCliente,
      pedido.enderecoEntrega,
      pedido.observacoes ?? '',
      ...(pedido.itens ?? []).map((item) => item.nomeProduto)
    ].some((valor) => valor.toLocaleLowerCase('pt-BR').includes(termo))
  }

  if (filtroStatus.value === 'todos') {
    return pedidos.value.filter(correspondeBusca)
  }

  if (filtroStatus.value === 'entrega') {
    return pedidos.value.filter(
      (pedido) => ['saiu_para_entrega', 'pronto_para_retirada'].includes(pedido.status) && correspondeBusca(pedido)
    )
  }

  return pedidos.value.filter(
    (pedido) => pedido.status === filtroStatus.value && correspondeBusca(pedido)
  )
})

const totalPaginas = computed(() => Math.max(1, Math.ceil(pedidosFiltrados.value.length / PEDIDOS_POR_PAGINA)))
const pedidosPaginados = computed(() => {
  const inicio = (paginaAtual.value - 1) * PEDIDOS_POR_PAGINA
  return pedidosFiltrados.value.slice(inicio, inicio + PEDIDOS_POR_PAGINA)
})

const gruposStatus = computed(() =>
  statusPedido
    .map((status) => ({
      ...status,
      pedidos: pedidosPaginados.value.filter((pedido) => pedido.status === status.valor)
    }))
    .filter((grupo) => grupo.pedidos.length > 0)
)

watch([filtroStatus, buscaPedidos], () => {
  paginaAtual.value = 1
  pedidoExpandidoId.value = null
})

watch(totalPaginas, (quantidadePaginas) => {
  if (paginaAtual.value > quantidadePaginas) {
    paginaAtual.value = quantidadePaginas
  }
})

function alternarDetalhesPedido(pedidoId: string) {
  pedidoExpandidoId.value = pedidoId
}

function fecharDetalhesPedido() {
  pedidoExpandidoId.value = null
}

function mudarPagina(pagina: number) {
  paginaAtual.value = Math.min(Math.max(1, pagina), totalPaginas.value)
  pedidoExpandidoId.value = null

  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const totalConfirmados = computed(() => pedidos.value.filter((pedido) => pedido.status === 'confirmado').length)
const totalEmSeparacao = computed(() => pedidos.value.filter((pedido) => pedido.status === 'em_separacao').length)
const totalEmEntrega = computed(() =>
  pedidos.value.filter((pedido) => ['saiu_para_entrega', 'pronto_para_retirada'].includes(pedido.status)).length
)
const totalFinalizados = computed(() => pedidos.value.filter((pedido) => pedido.status === 'finalizado').length)
const pedidosPendentesImpressao = computed(() => {
  versaoPedidosImpressos.value

  return pedidos.value.filter(
    (pedido) =>
      pedido.status === 'confirmado'
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

  const idsNaFila = new Set([
    ...filaImpressao.value.map((pedido) => pedido.id),
    ...(pedidoEmImpressao.value ? [pedidoEmImpressao.value.id] : [])
  ])

  filaImpressao.value.push(
    ...listaPedidos.filter(
      (pedido) => !idsPedidosImpressos.has(pedido.id) && !idsNaFila.has(pedido.id)
    )
  )

  await imprimirProximoPedido()
}

async function imprimirProximoPedido() {
  if (!import.meta.client || pedidoEmImpressao.value || filaImpressao.value.length === 0) {
    return
  }

  const proximoPedido = filaImpressao.value.shift()

  if (!proximoPedido) {
    return
  }

  pedidoEmImpressao.value = proximoPedido
  pedidosParaImpressao.value = [proximoPedido]
  document.body.classList.add('imprimindo-pedido')

  await nextTick()
  window.print()
}

function imprimirPedido(pedido: PedidoResumo) {
  void imprimirPedidos([pedido])
}

function imprimirFilaPendente() {
  void imprimirPedidos(pedidosPendentesImpressao.value)
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

  const pedidoImpresso = pedidoEmImpressao.value

  if (pedidoImpresso) {
    registrarPedidosImpressos([pedidoImpresso])
  }

  pedidoEmImpressao.value = null
  pedidosParaImpressao.value = []
  document.body.classList.remove('imprimindo-pedido')

  if (filaImpressao.value.length > 0) {
    window.setTimeout(() => {
      void imprimirProximoPedido()
    }, 400)
  }
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
      pedido.status === 'confirmado'
      && !idsPedidosConhecidos.has(pedido.id)
      && !idsPedidosImpressos.has(pedido.id)
  )

  idsPedidosConhecidos = new Set(listaPedidos.map((pedido) => pedido.id))

  if (pedidosNovosParaImpressao.length === 0) {
    return
  }

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

    <section class="metricas-admin dashboard-pedidos" aria-label="Acompanhamento dos pedidos">
      <button type="button" class="metrica-admin metrica-admin--alerta" :class="{ ativo: filtroStatus === 'confirmado' }" @click="filtroStatus = 'confirmado'">
        <span>Confirmados</span>
        <strong>{{ totalConfirmados }}</strong>
      </button>
      <button type="button" class="metrica-admin" :class="{ ativo: filtroStatus === 'em_separacao' }" @click="filtroStatus = 'em_separacao'">
        <span>Separação</span>
        <strong>{{ totalEmSeparacao }}</strong>
      </button>
      <button type="button" class="metrica-admin" :class="{ ativo: filtroStatus === 'entrega' }" @click="filtroStatus = 'entrega'">
        <span>Entrega</span>
        <strong>{{ totalEmEntrega }}</strong>
      </button>
      <button type="button" class="metrica-admin" :class="{ ativo: filtroStatus === 'finalizado' }" @click="filtroStatus = 'finalizado'">
        <span>Finalizados</span>
        <strong>{{ totalFinalizados }}</strong>
      </button>
    </section>

    <section class="painel-admin barra-operacao-pedidos">
      <label class="pesquisa-pedidos">
        <Search :size="19" aria-hidden="true" />
        <input
          v-model="buscaPedidos"
          type="search"
          placeholder="Buscar cliente, telefone ou pedido"
          aria-label="Buscar pedidos"
        >
        <button
          v-if="buscaPedidos"
          type="button"
          aria-label="Limpar pesquisa"
          @click="buscaPedidos = ''"
        >
          <X :size="18" aria-hidden="true" />
        </button>
      </label>

      <div class="filtros-pedidos" aria-label="Filtrar pedidos">
        <button type="button" :class="{ ativo: filtroStatus === 'confirmado' }" @click="filtroStatus = 'confirmado'">
          Confirmados <strong>{{ pedidos.filter((pedido) => pedido.status === 'confirmado').length }}</strong>
        </button>
        <button type="button" :class="{ ativo: filtroStatus === 'em_separacao' }" @click="filtroStatus = 'em_separacao'">
          Separação <strong>{{ pedidos.filter((pedido) => pedido.status === 'em_separacao').length }}</strong>
        </button>
        <button type="button" :class="{ ativo: filtroStatus === 'entrega' }" @click="filtroStatus = 'entrega'">
          Entrega <strong>{{ totalEmEntrega }}</strong>
        </button>
        <button type="button" :class="{ ativo: filtroStatus === 'finalizado' }" @click="filtroStatus = 'finalizado'">
          Finalizados <strong>{{ totalFinalizados }}</strong>
        </button>
        <button type="button" :class="{ ativo: filtroStatus === 'todos' }" @click="filtroStatus = 'todos'">
          Todos <strong>{{ pedidos.length }}</strong>
        </button>
      </div>

      <button
        v-if="filtroStatus === 'confirmado'"
        class="botao-admin botao-imprimir-fila"
        type="button"
        :disabled="pedidosPendentesImpressao.length === 0"
        @click="imprimirFilaPendente"
      >
        <Printer :size="17" aria-hidden="true" />
        Imprimir 1 por 1 ({{ pedidosPendentesImpressao.length }})
      </button>
      <span v-if="pedidoEmImpressao || filaImpressao.length" class="fila-impressao-status">
        Bematech: {{ filaImpressao.length + (pedidoEmImpressao ? 1 : 0) }} na fila
      </span>
    </section>

    <section v-if="pedidos.length === 0" class="painel-admin">
      <div class="painel-estado painel-estado--compacto">
        <strong>Nenhum pedido recebido</strong>
        <span>Quando o cliente finalizar a compra, o pedido vai aparecer aqui.</span>
      </div>
    </section>

    <section v-else-if="pedidosFiltrados.length === 0" class="painel-admin">
      <div class="painel-estado painel-estado--compacto">
        <strong>{{ buscaPedidos ? 'Nenhum pedido encontrado' : 'Nenhum pedido neste filtro' }}</strong>
        <span>{{ buscaPedidos ? 'Tente pesquisar por outro termo.' : 'Escolha outro status para continuar.' }}</span>
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
          <button
            class="pedido-admin__topo pedido-admin__resumo"
            type="button"
            :aria-expanded="pedidoExpandidoId === pedido.id"
            @click="alternarDetalhesPedido(pedido.id)"
          >
            <div>
              <strong>{{ pedido.nomeCliente }}</strong>
              <span>#{{ pedido.id.slice(0, 8) }} - {{ formatarData(pedido.criadoEm) }}</span>
              <small>Abrir pedido</small>
            </div>
            <div class="pedido-admin__valor-status">
              <span class="status-admin">{{ textoStatus(pedido.status) }}</span>
              <strong>{{ formatarCentavos(pedido.totalCentavos) }}</strong>
            </div>
          </button>

        </article>
      </div>
    </section>

    <nav v-if="totalPaginas > 1" class="paginacao-pedidos" aria-label="Paginação dos pedidos">
      <button type="button" :disabled="paginaAtual === 1" @click="mudarPagina(paginaAtual - 1)">
        Anterior
      </button>
      <span>Página <strong>{{ paginaAtual }}</strong> de {{ totalPaginas }}</span>
      <button type="button" :disabled="paginaAtual === totalPaginas" @click="mudarPagina(paginaAtual + 1)">
        Próxima
      </button>
    </nav>

    <Teleport to="body">
      <div v-if="pedidoSelecionado" class="modal-pedido" role="presentation" @click.self="fecharDetalhesPedido">
        <article class="modal-pedido__conteudo" role="dialog" aria-modal="true" aria-labelledby="titulo-pedido-selecionado">
          <header class="modal-pedido__topo">
            <div>
              <span>Pedido #{{ pedidoSelecionado.id.slice(0, 8) }}</span>
              <h2 id="titulo-pedido-selecionado">{{ pedidoSelecionado.nomeCliente }}</h2>
              <small>{{ formatarData(pedidoSelecionado.criadoEm) }}</small>
            </div>
            <button type="button" aria-label="Fechar detalhes" @click="fecharDetalhesPedido">
              <X :size="22" aria-hidden="true" />
            </button>
          </header>

          <div class="pedido-admin__grid">
            <section class="pedido-admin__bloco">
              <strong>Cliente</strong>
              <span>{{ pedidoSelecionado.telefoneCliente }}</span>
              <span>{{ textoPagamento(pedidoSelecionado) }}</span>
            </section>
            <section class="pedido-admin__bloco">
              <strong>{{ textoEntrega(pedidoSelecionado) }}</strong>
              <span v-for="linha in linhasEndereco(pedidoSelecionado.enderecoEntrega)" :key="linha">{{ linha }}</span>
            </section>
            <section class="pedido-admin__bloco pedido-admin__bloco--itens">
              <strong>Itens</strong>
              <ul>
                <li v-for="item in pedidoSelecionado.itens" :key="item.id">
                  <span>{{ item.quantidade }}x {{ item.nomeProduto }}</span>
                  <strong>{{ formatarCentavos(item.subtotalCentavos) }}</strong>
                </li>
              </ul>
            </section>
            <section class="pedido-admin__bloco modal-pedido__acoes">
              <strong>Status</strong>
              <select :value="pedidoSelecionado.status" :disabled="statusAtualizando === pedidoSelecionado.id" @change="alterarStatusPeloEvento(pedidoSelecionado, $event)">
                <option v-for="status in statusPedido" :key="status.valor" :value="status.valor">{{ status.texto }}</option>
              </select>
              <button v-if="pedidoSelecionado.status === 'confirmado'" class="botao-admin botao-admin--secundario botao-admin--compacto" type="button" @click="imprimirPedido(pedidoSelecionado)">
                <Printer :size="16" aria-hidden="true" /> Imprimir
              </button>
              <button v-if="proximaAcao(pedidoSelecionado)" class="botao-admin botao-admin--compacto" type="button" :disabled="statusAtualizando === pedidoSelecionado.id" @click="alterarStatus(pedidoSelecionado, proximaAcao(pedidoSelecionado)!.status)">
                <component :is="proximaAcao(pedidoSelecionado)!.icone" :size="16" aria-hidden="true" />
                {{ proximaAcao(pedidoSelecionado)!.texto }}
              </button>
            </section>
          </div>
          <p v-if="pedidoSelecionado.observacoes" class="pedido-admin__observacao">{{ pedidoSelecionado.observacoes }}</p>
        </article>
      </div>
    </Teleport>

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
