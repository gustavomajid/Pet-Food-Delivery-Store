<script setup lang="ts">
import type { PedidoResumo, StatusPedido } from '~/types/loja'

const { formatarCentavos } = useDinheiro()

const erroAdmin = ref('')
const statusAtualizando = ref<string | null>(null)

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

const gruposStatus = computed(() =>
  statusPedido
    .map((status) => ({
      ...status,
      pedidos: pedidos.value.filter((pedido) => pedido.status === status.valor)
    }))
    .filter((grupo) => grupo.pedidos.length > 0 || grupo.valor === 'novo')
)

const totalNovos = computed(() => pedidos.value.filter((pedido) => pedido.status === 'novo').length)
const totalEmAndamento = computed(() =>
  pedidos.value.filter((pedido) =>
    ['confirmado', 'em_separacao', 'saiu_para_entrega', 'pronto_para_retirada'].includes(pedido.status)
  ).length
)
const totalFinalizados = computed(() => pedidos.value.filter((pedido) => pedido.status === 'finalizado').length)

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

async function carregarPedidos() {
  erroAdmin.value = ''

  try {
    await recarregarPedidos()
  } catch {
    erroAdmin.value = 'Nao foi possivel carregar os pedidos.'
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

    <section v-if="pedidos.length === 0" class="painel-admin">
      <div class="painel-estado painel-estado--compacto">
        <strong>Nenhum pedido recebido</strong>
        <span>Quando o cliente finalizar a compra, o pedido vai aparecer aqui.</span>
      </div>
    </section>

    <section v-for="grupo in gruposStatus" :key="grupo.valor" class="painel-admin grupo-pedidos">
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
            <strong>{{ formatarCentavos(pedido.totalCentavos) }}</strong>
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
            </section>
          </div>

          <p v-if="pedido.observacoes" class="pedido-admin__observacao">
            {{ pedido.observacoes }}
          </p>
        </article>
      </div>
    </section>
  </AdminArea>
</template>
