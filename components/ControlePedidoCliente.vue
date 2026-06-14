<script setup lang="ts">
import { CheckCircle2, ClipboardCopy, MessageCircle, RefreshCcw } from '@lucide/vue'
import type { PedidoResumo, StatusPedido } from '~/types/loja'

const props = defineProps<{
  pedido: PedidoResumo
  carregando?: boolean
}>()

const emitir = defineEmits<{
  recarregar: []
}>()

const { formatarCentavos } = useDinheiro()
const linkCopiado = ref(false)

const statusPedido: Array<{ valor: StatusPedido; texto: string }> = [
  { valor: 'novo', texto: 'Recebido' },
  { valor: 'confirmado', texto: 'Confirmado' },
  { valor: 'em_separacao', texto: 'Em separacao' },
  { valor: 'saiu_para_entrega', texto: 'Saiu para entrega' },
  { valor: 'pronto_para_retirada', texto: 'Pronto para retirada' },
  { valor: 'finalizado', texto: 'Finalizado' },
  { valor: 'cancelado', texto: 'Cancelado' }
]

const fluxoStatus: StatusPedido[] = [
  'novo',
  'confirmado',
  'em_separacao',
  props.pedido.tipoEntrega === 'retirada' ? 'pronto_para_retirada' : 'saiu_para_entrega',
  'finalizado'
]

const linkAcompanhamento = computed(() => {
  const caminho = `/pedido/${props.pedido.id}`

  if (!import.meta.client) {
    return caminho
  }

  return `${window.location.origin}${caminho}`
})

const indiceStatusAtual = computed(() => fluxoStatus.indexOf(props.pedido.status))
const statusCancelado = computed(() => props.pedido.status === 'cancelado')
const itensPedido = computed(() => props.pedido.itens ?? [])

const urlWhatsapp = computed(() =>
  `https://wa.me/?text=${encodeURIComponent(montarTextoWhatsapp())}`
)

function textoStatus(status: StatusPedido) {
  return statusPedido.find((item) => item.valor === status)?.texto ?? status
}

function textoEntrega() {
  if (props.pedido.tipoEntrega === 'retirada') {
    return 'Retirada na loja'
  }

  if (props.pedido.tipoEntrega === 'agendada') {
    return 'Entrega agendada'
  }

  return 'Entrega local'
}

function textoPagamento() {
  const mapa = {
    pix: 'Pix',
    dinheiro: 'Dinheiro',
    cartao_entrega: 'Cartao na entrega'
  }

  return mapa[props.pedido.formaPagamento]
}

function formatarData(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(valor))
}

function linhasEndereco() {
  return props.pedido.enderecoEntrega.split(',').map((parte) => parte.trim()).filter(Boolean)
}

function montarTextoWhatsapp() {
  const linhas = [
    `Pedido #${props.pedido.id.slice(0, 8)}`,
    `Cliente: ${props.pedido.nomeCliente}`,
    `Telefone: ${props.pedido.telefoneCliente}`,
    `Status: ${textoStatus(props.pedido.status)}`,
    `Entrega: ${textoEntrega()}`,
    `Endereco: ${props.pedido.enderecoEntrega}`,
    '',
    'Itens:',
    ...itensPedido.value.map((item) =>
      `${item.quantidade}x ${item.nomeProduto} - ${formatarCentavos(item.subtotalCentavos)}`
    ),
    '',
    `Subtotal: ${formatarCentavos(props.pedido.subtotalCentavos)}`,
    `Entrega: ${formatarCentavos(props.pedido.taxaEntregaCentavos)}`,
    `Total: ${formatarCentavos(props.pedido.totalCentavos)}`,
    props.pedido.observacoes ? `Observacoes: ${props.pedido.observacoes}` : '',
    '',
    `Acompanhar pedido: ${linkAcompanhamento.value}`
  ].filter(Boolean)

  return linhas.join('\n')
}

async function copiarLink() {
  if (!import.meta.client || !navigator.clipboard) {
    return
  }

  await navigator.clipboard.writeText(linkAcompanhamento.value)
  linkCopiado.value = true
  window.setTimeout(() => {
    linkCopiado.value = false
  }, 1800)
}
</script>

<template>
  <article class="controle-pedido">
    <header class="controle-pedido__topo">
      <div>
        <span>Pedido #{{ pedido.id.slice(0, 8) }}</span>
        <strong>{{ textoStatus(pedido.status) }}</strong>
        <small>{{ formatarData(pedido.criadoEm) }}</small>
      </div>
      <CheckCircle2 :size="24" aria-hidden="true" />
    </header>

    <ol class="linha-status-pedido" :class="{ 'linha-status-pedido--cancelado': statusCancelado }">
      <li
        v-for="(status, indice) in fluxoStatus"
        :key="status"
        :class="{ ativo: indice <= indiceStatusAtual && !statusCancelado }"
      >
        <span />
        <strong>{{ textoStatus(status) }}</strong>
      </li>
      <li v-if="statusCancelado" class="ativo">
        <span />
        <strong>Cancelado</strong>
      </li>
    </ol>

    <section class="controle-pedido__grid">
      <div>
        <strong>Cliente</strong>
        <span>{{ pedido.nomeCliente }}</span>
        <span>{{ pedido.telefoneCliente }}</span>
      </div>

      <div>
        <strong>{{ textoEntrega() }}</strong>
        <span v-for="linha in linhasEndereco()" :key="linha">{{ linha }}</span>
      </div>

      <div>
        <strong>Pagamento</strong>
        <span>{{ textoPagamento() }}</span>
        <span class="controle-pedido__total">
          Total <strong>{{ formatarCentavos(pedido.totalCentavos) }}</strong>
        </span>
      </div>
    </section>

    <section class="controle-pedido__itens">
      <strong>Itens do pedido</strong>
      <ul>
        <li v-for="item in itensPedido" :key="`${item.pedidoId}-${item.id}-${item.produtoId}`">
          <span>{{ item.quantidade }}x {{ item.nomeProduto }}</span>
          <strong>{{ formatarCentavos(item.subtotalCentavos) }}</strong>
        </li>
      </ul>
    </section>

    <p v-if="pedido.observacoes" class="controle-pedido__observacao">
      {{ pedido.observacoes }}
    </p>

    <div class="acoes-controle-pedido">
      <a class="botao-whatsapp" :href="urlWhatsapp" target="_blank" rel="noopener">
        <MessageCircle :size="18" aria-hidden="true" />
        Enviar WhatsApp
      </a>

      <button class="botao-admin botao-admin--secundario" type="button" @click="emitir('recarregar')">
        <RefreshCcw :size="17" aria-hidden="true" />
        {{ carregando ? 'Atualizando...' : 'Atualizar' }}
      </button>

      <button class="botao-admin botao-admin--secundario" type="button" @click="copiarLink">
        <ClipboardCopy :size="17" aria-hidden="true" />
        {{ linkCopiado ? 'Copiado' : 'Copiar link' }}
      </button>
    </div>
  </article>
</template>
