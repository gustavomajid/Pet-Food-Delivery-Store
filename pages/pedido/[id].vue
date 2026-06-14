<script setup lang="ts">
import { ArrowLeft, ClipboardList, Home, ShoppingBasket } from '@lucide/vue'
import type { PedidoResumo } from '~/types/loja'

const route = useRoute()
const router = useRouter()
const idPedido = computed(() => String(route.params.id || ''))

const {
  data,
  pending,
  error,
  refresh
} = await useFetch<{ pedido: PedidoResumo }>(() => `/api/pedidos/${idPedido.value}`, {
  default: () => ({ pedido: null as unknown as PedidoResumo })
})

const pedido = computed(() => data.value?.pedido ?? null)
const { registrarPedido } = useHistoricoPedidos()
const { quantidadeItens, aberto } = useCarrinho()

watch(pedido, (valor) => {
  if (valor) {
    registrarPedido(valor)
  }
}, { immediate: true })

function voltarPaginaAnterior() {
  const historicoInterno = import.meta.client
    ? (window.history.state as { back?: string } | null)?.back
    : null

  if (historicoInterno) {
    router.back()
    return
  }

  void router.push('/')
}
</script>

<template>
  <main class="app app-pedido">
    <header class="topo">
      <div class="marca-loja">
        <span class="marca-loja__icone">
          <img src="/img/logo.jpeg" alt="" aria-hidden="true">
        </span>
        <div>
          <strong>Acompanhar pedido</strong>
          <span>Veja o status da sua compra</span>
        </div>
      </div>

      <nav class="acoes-topo" aria-label="Navegacao do pedido">
        <button class="botao-admin botao-admin--secundario" type="button" @click="voltarPaginaAnterior">
          <ArrowLeft :size="17" aria-hidden="true" />
          Voltar
        </button>

        <NuxtLink class="botao-admin botao-admin--secundario" to="/">
          <Home :size="17" aria-hidden="true" />
          Loja
        </NuxtLink>
      </nav>
    </header>

    <section class="catalogo catalogo-pedido">
      <div v-if="pending" class="painel-estado">
        <strong>Carregando pedido</strong>
        <span>Estamos buscando as informacoes mais recentes.</span>
      </div>

      <div v-else-if="error || !pedido" class="painel-estado">
        <strong>Pedido nao encontrado</strong>
        <span>Confira o link recebido ou solicite o acompanhamento novamente.</span>
        <NuxtLink class="botao-admin" to="/">Voltar para a loja</NuxtLink>
      </div>

      <ControlePedidoCliente
        v-else
        :pedido="pedido"
        :carregando="pending"
        @recarregar="refresh"
      />
    </section>

    <nav class="rodape-app-fixo" aria-label="Navegacao fixa do pedido">
      <NuxtLink class="botao-nav-inferior" to="/">
        <Home :size="24" aria-hidden="true" />
        <span>Loja</span>
      </NuxtLink>

      <button class="botao-nav-inferior" type="button" @click="aberto = true">
        <ShoppingBasket :size="24" aria-hidden="true" />
        <span v-if="quantidadeItens > 0" class="contador-nav">{{ quantidadeItens }}</span>
        <span>Carrinho</span>
      </button>

      <NuxtLink class="botao-nav-inferior ativo" :to="`/pedido/${idPedido}`" aria-current="page">
        <ClipboardList :size="24" aria-hidden="true" />
        <span>Pedido</span>
      </NuxtLink>

      <button class="botao-nav-inferior" type="button" @click="voltarPaginaAnterior">
        <ArrowLeft :size="24" aria-hidden="true" />
        <span>Voltar</span>
      </button>
    </nav>

    <PainelCarrinho />
  </main>
</template>
