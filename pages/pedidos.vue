<script setup lang="ts">
import {
  ClipboardList,
  Home,
  RefreshCcw,
  RotateCcw,
  ShoppingBasket,
  UserRound
} from '@lucide/vue'
import type { StatusPedido } from '~/types/loja'

const config = useRuntimeConfig()
const { formatarCentavos } = useDinheiro()
const {
  clienteAtual,
  carregarClientes,
  abrirModalIdentificacao
} = useClienteReconhecimento()
const {
  carregarHistoricoLocal,
  carregarHistoricoCliente,
  obterHistoricoPorTelefone,
  recarregarPedido,
  pedidoEstaAtivo
} = useHistoricoPedidos()
const {
  aberto,
  quantidadeItens
} = useCarrinho()
const {
  repetindoPedidoId,
  avisoRepeticao,
  erroRepeticao,
  repetirPedido
} = useRepetirPedido()

const INTERVALO_ATUALIZACAO_PEDIDO_MS = 7000
const carregandoHistorico = ref(true)
const atualizandoHistorico = ref(false)
const atualizandoPedido = ref(false)
let intervaloAtualizacaoPedido: ReturnType<typeof setInterval> | undefined

const pedidosCliente = computed(() => {
  const telefone = clienteAtual.value?.telefoneCliente
  return telefone ? obterHistoricoPorTelefone(telefone) : []
})
const pedidoAtivo = computed(() => pedidosCliente.value.find(pedidoEstaAtivo) ?? null)
const pedidosHistorico = computed(() =>
  pedidoAtivo.value ? [] : pedidosCliente.value
)
const quantidadePedidosTexto = computed(() => {
  const quantidade = pedidosCliente.value.length
  return quantidade > 9 ? '9+' : `${quantidade}`
})

const textosStatus: Record<StatusPedido, string> = {
  novo: 'Recebido',
  confirmado: 'Confirmado',
  em_separacao: 'Em separacao',
  saiu_para_entrega: 'Saiu para entrega',
  pronto_para_retirada: 'Pronto para retirada',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado'
}

function textoStatus(status: StatusPedido) {
  return textosStatus[status]
}

function formatarData(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(valor))
}

async function atualizarHistorico() {
  const telefone = clienteAtual.value?.telefoneCliente

  if (!telefone || atualizandoHistorico.value) {
    carregandoHistorico.value = false
    return
  }

  atualizandoHistorico.value = true

  try {
    await carregarHistoricoCliente(telefone)
  } finally {
    atualizandoHistorico.value = false
    carregandoHistorico.value = false
  }
}

async function atualizarPedidoAtivo() {
  const pedido = pedidoAtivo.value

  if (!pedido || atualizandoPedido.value) {
    return
  }

  atualizandoPedido.value = true

  try {
    await recarregarPedido(pedido.id)
  } finally {
    atualizandoPedido.value = false
  }
}

function atualizarPedidoAutomaticamente() {
  if (document.visibilityState === 'visible') {
    void atualizarPedidoAtivo()
  }
}

watch(
  () => clienteAtual.value?.telefoneNormalizado,
  () => {
    carregandoHistorico.value = true
    void atualizarHistorico()
  }
)

onMounted(() => {
  carregarClientes()
  carregarHistoricoLocal()
  void atualizarHistorico()

  intervaloAtualizacaoPedido = setInterval(
    atualizarPedidoAutomaticamente,
    INTERVALO_ATUALIZACAO_PEDIDO_MS
  )
  document.addEventListener('visibilitychange', atualizarPedidoAutomaticamente)
})

onBeforeUnmount(() => {
  if (intervaloAtualizacaoPedido) {
    clearInterval(intervaloAtualizacaoPedido)
  }

  document.removeEventListener('visibilitychange', atualizarPedidoAutomaticamente)
})
</script>

<template>
  <main class="app app-pedido">
    <header class="topo">
      <div class="marca-loja">
        <span class="marca-loja__icone">
          <img src="/img/logo.jpeg" alt="" aria-hidden="true">
        </span>
        <div>
          <strong>Meus pedidos</strong>
          <span>{{ config.public.storeName }}</span>
        </div>
      </div>

      <nav class="acoes-topo" aria-label="Navegacao dos pedidos">
        <NuxtLink class="botao-admin botao-admin--secundario" to="/">
          <Home :size="17" aria-hidden="true" />
          Loja
        </NuxtLink>
      </nav>
    </header>

    <section class="catalogo catalogo-pedidos">
      <div v-if="carregandoHistorico" class="painel-estado">
        <strong>Carregando pedidos</strong>
        <span>Buscando seu historico mais recente.</span>
      </div>

      <div v-else-if="!clienteAtual" class="painel-estado">
        <strong>Identifique seu perfil</strong>
        <span>Informe seu WhatsApp para acessar seus pedidos.</span>
        <button type="button" @click="abrirModalIdentificacao">Identificar perfil</button>
      </div>

      <template v-else-if="pedidoAtivo">
        <header class="cabecalho-pagina-pedidos">
          <div>
            <span>Pedido atual</span>
            <h1>Acompanhe seu pedido</h1>
          </div>
          <button
            class="botao-admin botao-admin--secundario"
            type="button"
            :disabled="atualizandoPedido"
            @click="atualizarPedidoAtivo"
          >
            <RefreshCcw :size="17" aria-hidden="true" />
            {{ atualizandoPedido ? 'Atualizando...' : 'Atualizar' }}
          </button>
        </header>

        <ControlePedidoCliente
          :pedido="pedidoAtivo"
          :carregando="atualizandoPedido"
          @recarregar="atualizarPedidoAtivo"
        />
      </template>

      <template v-else>
        <header class="cabecalho-pagina-pedidos">
          <div>
            <span>Historico</span>
            <h1>Pedidos anteriores</h1>
          </div>
          <button
            class="botao-admin botao-admin--secundario"
            type="button"
            :disabled="atualizandoHistorico"
            @click="atualizarHistorico"
          >
            <RefreshCcw :size="17" aria-hidden="true" />
            {{ atualizandoHistorico ? 'Atualizando...' : 'Atualizar' }}
          </button>
        </header>

        <p v-if="avisoRepeticao" class="aviso-pedidos" aria-live="polite">
          {{ avisoRepeticao }}
        </p>
        <p v-if="erroRepeticao" class="erro-formulario" aria-live="assertive">
          {{ erroRepeticao }}
        </p>

        <div v-if="pedidosHistorico.length === 0" class="painel-estado">
          <ClipboardList :size="28" aria-hidden="true" />
          <strong>Nenhum pedido anterior</strong>
          <span>Seus pedidos finalizados aparecerao aqui.</span>
          <NuxtLink class="botao-admin" to="/">Fazer primeiro pedido</NuxtLink>
        </div>

        <ul v-else class="lista-historico-pedidos">
          <li v-for="pedido in pedidosHistorico" :key="pedido.id">
            <article class="cartao-historico-pedido">
              <NuxtLink class="cartao-historico-pedido__link" :to="`/pedido/${pedido.id}`">
                <span>Pedido #{{ pedido.id.slice(0, 8) }}</span>
                <strong>{{ textoStatus(pedido.status) }}</strong>
                <small>{{ formatarData(pedido.criadoEm) }}</small>
              </NuxtLink>

              <ul class="cartao-historico-pedido__itens">
                <li v-for="item in pedido.itens" :key="item.id">
                  <span>{{ item.quantidade }}x {{ item.nomeProduto }}</span>
                  <strong>{{ formatarCentavos(item.subtotalCentavos) }}</strong>
                </li>
              </ul>

              <footer class="cartao-historico-pedido__rodape">
                <span>Total <strong>{{ formatarCentavos(pedido.totalCentavos) }}</strong></span>
                <button
                  class="botao-admin"
                  type="button"
                  :disabled="Boolean(repetindoPedidoId)"
                  @click="repetirPedido(pedido)"
                >
                  <RotateCcw :size="17" aria-hidden="true" />
                  {{ repetindoPedidoId === pedido.id ? 'Montando carrinho...' : 'Repetir pedido' }}
                </button>
              </footer>
            </article>
          </li>
        </ul>
      </template>
    </section>

    <nav class="rodape-app-fixo" aria-label="Navegacao principal">
      <NuxtLink class="botao-nav-inferior" to="/">
        <Home :size="24" aria-hidden="true" />
        <span>Inicio</span>
      </NuxtLink>

      <button class="botao-nav-inferior" type="button" @click="aberto = true">
        <ShoppingBasket :size="24" aria-hidden="true" />
        <span v-if="quantidadeItens > 0" class="contador-nav">{{ quantidadeItens }}</span>
        <span>Carrinho</span>
      </button>

      <NuxtLink class="botao-nav-inferior ativo" to="/pedidos" aria-current="page">
        <ClipboardList :size="24" aria-hidden="true" />
        <span v-if="pedidosCliente.length > 0" class="contador-nav">{{ quantidadePedidosTexto }}</span>
        <span>Pedidos</span>
      </NuxtLink>

      <button class="botao-nav-inferior" type="button" @click="abrirModalIdentificacao">
        <UserRound :size="24" aria-hidden="true" />
        <span>Perfil</span>
      </button>
    </nav>

    <PainelCarrinho />
    <ModalIdentificacaoCliente />
  </main>
</template>
