<script setup lang="ts">
import { ClipboardList, Minus, Plus, ShoppingBasket, Trash2, X } from '@lucide/vue'
import type { PedidoResumo } from '~/types/loja'

const {
  itens,
  aberto,
  quantidadeItens,
  subtotalCentavos,
  taxaEntregaCentavos,
  descontoCentavos,
  totalCentavos,
  aumentar,
  diminuir,
  remover
} = useCarrinho()
const { formatarCentavos } = useDinheiro()
const { clienteAtual } = useClienteReconhecimento()
const {
  historicoPedidos,
  pedidoAtivo,
  carregarHistoricoLocal,
  registrarPedido,
  recarregarPedido,
  obterHistoricoPorTelefone,
  obterPedidoAtivoPorTelefone
} = useHistoricoPedidos()

const atualizandoPedido = ref(false)
const historicoCliente = computed(() => {
  const telefoneCliente = clienteAtual.value?.telefoneCliente

  return telefoneCliente ? obterHistoricoPorTelefone(telefoneCliente) : historicoPedidos.value
})
const pedidoAtivoCliente = computed(() => {
  const telefoneCliente = clienteAtual.value?.telefoneCliente

  return telefoneCliente ? obterPedidoAtivoPorTelefone(telefoneCliente) : pedidoAtivo.value
})
const carrinhoVazio = computed(() =>
  itens.value.length === 0 && !pedidoAtivoCliente.value && historicoCliente.value.length === 0
)
const historicoVisivel = computed(() =>
  historicoCliente.value
    .filter((pedido) => pedido.id !== pedidoAtivoCliente.value?.id)
    .slice(0, 5)
)

const textosStatus: Record<PedidoResumo['status'], string> = {
  novo: 'Recebido',
  confirmado: 'Confirmado',
  em_separacao: 'Em separacao',
  saiu_para_entrega: 'Saiu para entrega',
  pronto_para_retirada: 'Pronto para retirada',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado'
}

function textoStatus(status: PedidoResumo['status']) {
  return textosStatus[status] ?? status
}

function formatarData(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(valor))
}

async function recarregarPedidoAtivo() {
  const pedido = pedidoAtivoCliente.value

  if (!pedido) {
    return
  }

  atualizandoPedido.value = true

  try {
    await recarregarPedido(pedido.id)
  } finally {
    atualizandoPedido.value = false
  }
}

function registrarPedidoConcluido(pedido: PedidoResumo) {
  registrarPedido(pedido)
}

watch(aberto, (valor) => {
  if (!valor) {
    return
  }

  carregarHistoricoLocal()

  if (pedidoAtivoCliente.value) {
    void recarregarPedidoAtivo()
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="aberto" class="fundo-carrinho" @click.self="aberto = false">
      <aside class="painel-carrinho" aria-label="Carrinho">
        <header class="painel-carrinho__cabecalho">
          <div>
            <span>Carrinho</span>
            <strong>{{ pedidoAtivoCliente ? 'Pedido em andamento' : `${quantidadeItens} itens` }}</strong>
          </div>
          <button class="botao-icone" type="button" aria-label="Fechar carrinho" @click="aberto = false">
            <X :size="20" aria-hidden="true" />
          </button>
        </header>

        <div v-if="carrinhoVazio" class="carrinho-vazio">
          <ShoppingBasket :size="28" aria-hidden="true" />
          <span>Carrinho vazio</span>
        </div>

        <div v-else class="conteudo-carrinho">
          <template v-if="pedidoAtivoCliente">
            <section class="pedido-ativo-aviso">
              <ClipboardList :size="22" aria-hidden="true" />
              <div>
                <strong>Pedido em andamento</strong>
                <span>Voce pode fazer outro pedido quando este for finalizado ou cancelado.</span>
              </div>
            </section>

            <ControlePedidoCliente
              :pedido="pedidoAtivoCliente"
              :carregando="atualizandoPedido"
              @recarregar="recarregarPedidoAtivo"
            />
          </template>

          <template v-else-if="itens.length > 0">
            <ul class="lista-carrinho">
              <li v-for="item in itens" :key="item.produtoId">
                <img :src="item.imagemUrl" :alt="item.nome">

                <div class="item-carrinho__info">
                  <strong>{{ item.nome }}</strong>
                  <span>{{ item.marca }} - {{ formatarCentavos(item.precoCentavos) }}</span>

                  <div class="controle-quantidade">
                    <button type="button" aria-label="Diminuir" @click="diminuir(item.produtoId)">
                      <Minus :size="16" aria-hidden="true" />
                    </button>
                    <span>{{ item.quantidade }}</span>
                    <button type="button" aria-label="Aumentar" @click="aumentar(item.produtoId)">
                      <Plus :size="16" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <button class="botao-remover" type="button" aria-label="Remover" @click="remover(item.produtoId)">
                  <Trash2 :size="17" aria-hidden="true" />
                </button>
              </li>
            </ul>

            <section class="totais-carrinho" aria-label="Totais">
              <div>
                <span>Subtotal</span>
                <strong>{{ formatarCentavos(subtotalCentavos) }}</strong>
              </div>
              <div>
                <span>Entrega</span>
                <strong>{{ formatarCentavos(taxaEntregaCentavos) }}</strong>
              </div>
              <div>
                <span>Desconto</span>
                <strong>{{ formatarCentavos(descontoCentavos) }}</strong>
              </div>
              <div class="totais-carrinho__total">
                <span>Total</span>
                <strong>{{ formatarCentavos(totalCentavos) }}</strong>
              </div>
            </section>

            <FormularioPedido @concluido="registrarPedidoConcluido" />
          </template>

          <div v-else class="carrinho-vazio carrinho-vazio--compacto">
            <ShoppingBasket :size="28" aria-hidden="true" />
            <span>Carrinho vazio</span>
          </div>

          <section v-if="historicoVisivel.length > 0" class="historico-pedidos" aria-label="Historico de pedidos">
            <header>
              <strong>Historico de pedidos</strong>
              <span>{{ historicoVisivel.length }} recente(s)</span>
            </header>

            <ul>
              <li v-for="pedido in historicoVisivel" :key="pedido.id">
                <NuxtLink :to="`/pedido/${pedido.id}`" @click="aberto = false">
                  <span>Pedido #{{ pedido.id.slice(0, 8) }}</span>
                  <strong>{{ formatarCentavos(pedido.totalCentavos) }}</strong>
                  <small>{{ textoStatus(pedido.status) }} - {{ formatarData(pedido.criadoEm) }}</small>
                </NuxtLink>
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
