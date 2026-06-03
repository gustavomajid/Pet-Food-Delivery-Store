<script setup lang="ts">
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

const statusPedido: Array<{ valor: StatusPedido; texto: string }> = [
  { valor: 'novo', texto: 'Novo' },
  { valor: 'confirmado', texto: 'Confirmado' },
  { valor: 'em_separacao', texto: 'Em separacao' },
  { valor: 'saiu_para_entrega', texto: 'Saiu para entrega' },
  { valor: 'pronto_para_retirada', texto: 'Pronto para retirada' },
  { valor: 'finalizado', texto: 'Finalizado' },
  { valor: 'cancelado', texto: 'Cancelado' }
]

async function carregarPedidos() {
  erroAdmin.value = ''

  try {
    await recarregarPedidos()
  } catch {
    erroAdmin.value = 'Nao foi possivel carregar os pedidos.'
  }
}

async function alterarStatus(pedido: PedidoResumo, status: StatusPedido) {
  await $fetch(`/api/admin/pedidos/${pedido.id}`, {
    method: 'PATCH',
    credentials: 'include',
    body: { status }
  })
  await recarregarPedidos()
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

    <section class="painel-admin">
      <div class="titulo-secao">
        <h1>Pedidos</h1>
        <span>{{ pedidos.length }}</span>
      </div>

      <div class="lista-admin">
        <article v-for="pedido in pedidos" :key="pedido.id" class="pedido-admin">
          <div class="pedido-admin__topo">
            <div>
              <strong>{{ pedido.nomeCliente }}</strong>
              <span>{{ pedido.telefoneCliente }}</span>
            </div>
            <strong>{{ formatarCentavos(pedido.totalCentavos) }}</strong>
          </div>

          <p>{{ pedido.enderecoEntrega }}</p>

          <ul>
            <li v-for="item in pedido.itens" :key="item.id">
              {{ item.quantidade }}x {{ item.nomeProduto }}
            </li>
          </ul>

          <select
            :value="pedido.status"
            @change="alterarStatusPeloEvento(pedido, $event)"
          >
            <option v-for="status in statusPedido" :key="status.valor" :value="status.valor">
              {{ status.texto }}
            </option>
          </select>
        </article>
      </div>
    </section>
  </AdminArea>
</template>
