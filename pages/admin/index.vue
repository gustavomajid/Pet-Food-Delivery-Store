<script setup lang="ts">
import { CheckCircle2, ClipboardList, Clock, Package, Settings, ShoppingBag, Tags } from '@lucide/vue'
import type { PedidoResumo, StatusPedido } from '~/types/loja'

const { formatarCentavos } = useDinheiro()

const erroAdmin = ref('')

const {
  data: dadosPedidos,
  refresh: recarregarPedidos
} = await useFetch<{ pedidos: PedidoResumo[] }>('/api/admin/pedidos', {
  default: () => ({ pedidos: [] }),
  immediate: false,
  credentials: 'include'
})

const pedidos = computed(() => dadosPedidos.value?.pedidos ?? [])
const pedidosRecentes = computed(() => pedidos.value.slice(0, 5))
const pedidosNovos = computed(() => pedidos.value.filter((pedido) => pedido.status === 'novo'))
const pedidosEmAberto = computed(() =>
  pedidos.value.filter((pedido) =>
    ['novo', 'confirmado', 'em_separacao', 'saiu_para_entrega', 'pronto_para_retirada'].includes(pedido.status)
  )
)
const pedidosFinalizados = computed(() =>
  pedidos.value.filter((pedido) => pedido.status === 'finalizado')
)
const faturamentoHojeCentavos = computed(() => {
  const hoje = new Date().toDateString()

  return pedidos.value
    .filter((pedido) =>
      pedido.status !== 'cancelado' && new Date(pedido.criadoEm).toDateString() === hoje
    )
    .reduce((total, pedido) => total + pedido.totalCentavos, 0)
})

const statusPedido: Record<StatusPedido, string> = {
  novo: 'Novo',
  confirmado: 'Confirmado',
  em_separacao: 'Em separacao',
  saiu_para_entrega: 'Saiu para entrega',
  pronto_para_retirada: 'Pronto para retirada',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado'
}

const atalhosAdmin = [
  {
    caminho: '/admin/pedidos',
    titulo: 'Pedidos',
    texto: 'Ver pedidos recebidos, itens e status.',
    icone: ClipboardList
  },
  {
    caminho: '/admin/produtos',
    titulo: 'Produtos',
    texto: 'Cadastrar produtos, estoque e precos.',
    icone: Package
  },
  {
    caminho: '/admin/categorias',
    titulo: 'Categorias',
    texto: 'Organizar o catalogo da loja.',
    icone: Tags
  },
  {
    caminho: '/admin/configuracoes',
    titulo: 'Configuracoes',
    texto: 'Controlar experiencia e cadastro do cliente.',
    icone: Settings
  }
]

function formatarData(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(valor))
}

async function carregarDashboard() {
  erroAdmin.value = ''

  try {
    await recarregarPedidos()
  } catch {
    erroAdmin.value = 'Nao foi possivel carregar o dashboard.'
  }
}
</script>

<template>
  <AdminArea
    titulo="Dashboard"
    subtitulo="Pedidos e gestao da loja"
    @autenticado="carregarDashboard"
    @recarregar="carregarDashboard"
  >
    <p v-if="erroAdmin" class="erro-formulario">{{ erroAdmin }}</p>

    <section class="metricas-admin" aria-label="Resumo dos pedidos">
      <article class="metrica-admin metrica-admin--alerta">
        <Clock :size="22" aria-hidden="true" />
        <span>Pedidos novos</span>
        <strong>{{ pedidosNovos.length }}</strong>
      </article>

      <article class="metrica-admin">
        <ShoppingBag :size="22" aria-hidden="true" />
        <span>Em aberto</span>
        <strong>{{ pedidosEmAberto.length }}</strong>
      </article>

      <article class="metrica-admin">
        <CheckCircle2 :size="22" aria-hidden="true" />
        <span>Finalizados</span>
        <strong>{{ pedidosFinalizados.length }}</strong>
      </article>

      <article class="metrica-admin">
        <ClipboardList :size="22" aria-hidden="true" />
        <span>Faturamento hoje</span>
        <strong>{{ formatarCentavos(faturamentoHojeCentavos) }}</strong>
      </article>
    </section>

    <section class="painel-admin">
      <div class="titulo-secao">
        <h1>Pedidos que chegaram</h1>
        <NuxtLink class="botao-admin botao-admin--secundario" to="/admin/pedidos">
          Ver todos
        </NuxtLink>
      </div>

      <div v-if="pedidosRecentes.length === 0" class="painel-estado painel-estado--compacto">
        <strong>Nenhum pedido ainda</strong>
        <span>Os pedidos feitos pela loja aparecem aqui automaticamente.</span>
      </div>

      <div v-else class="lista-admin">
        <article v-for="pedido in pedidosRecentes" :key="pedido.id" class="pedido-admin pedido-admin--resumo">
          <div class="pedido-admin__topo">
            <div>
              <strong>{{ pedido.nomeCliente }}</strong>
              <span>{{ formatarData(pedido.criadoEm) }} - {{ pedido.telefoneCliente }}</span>
            </div>
            <strong>{{ formatarCentavos(pedido.totalCentavos) }}</strong>
          </div>

          <div class="pedido-admin__linha">
            <span class="status-admin">{{ statusPedido[pedido.status] }}</span>
            <span>{{ pedido.itens?.length ?? 0 }} item(ns)</span>
          </div>
        </article>
      </div>
    </section>

    <section class="admin-menu" aria-label="Areas administrativas">
      <NuxtLink
        v-for="atalho in atalhosAdmin"
        :key="atalho.caminho"
        class="atalho-admin"
        :to="atalho.caminho"
      >
        <component :is="atalho.icone" :size="26" aria-hidden="true" />
        <strong>{{ atalho.titulo }}</strong>
        <span>{{ atalho.texto }}</span>
      </NuxtLink>
    </section>
  </AdminArea>
</template>
