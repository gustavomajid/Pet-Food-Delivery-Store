<script setup lang="ts">
import { CheckCircle2, Clock, Store, Truck } from '@lucide/vue'
import type { Component } from 'vue'
import type { FormaPagamento, PedidoPayload, PedidoResumo, TipoEntrega } from '~/types/loja'

type EnderecoCep = {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
}

const emitir = defineEmits<{
  concluido: [pedido: PedidoResumo]
}>()

const { itens, tipoEntrega, limpar } = useCarrinho()
const { formatarCentavos } = useDinheiro()
const { clienteAtual, carregarClientes, salvarCliente } = useClienteReconhecimento()

const opcoesEntrega: Array<{ valor: TipoEntrega; texto: string; icone: Component }> = [
  { valor: 'entrega_local', texto: 'Entrega', icone: Truck },
  { valor: 'retirada', texto: 'Retirada', icone: Store },
  { valor: 'agendada', texto: 'Agendada', icone: Clock }
]

const opcoesPagamento: Array<{ valor: FormaPagamento; texto: string }> = [
  { valor: 'pix', texto: 'Pix' },
  { valor: 'dinheiro', texto: 'Dinheiro' },
  { valor: 'cartao_entrega', texto: 'Cartao' }
]

const formulario = reactive({
  cep: '',
  nomeCliente: '',
  telefoneCliente: '',
  enderecoEntrega: '',
  formaPagamento: 'pix' as FormaPagamento,
  observacoes: ''
})

const enviando = ref(false)
const consultandoCep = ref(false)
const erro = ref('')
const erroCep = ref('')
const ultimoCepConsultado = ref('')
const ultimoPedido = ref<PedidoResumo | null>(null)
const enderecoEntregaSalvo = ref('')
const enderecoRetirada = 'Retirada na loja'

const rotuloEndereco = computed(() =>
  tipoEntrega.value === 'retirada' ? 'Local de retirada' : 'Endereco'
)
const placeholderEndereco = computed(() =>
  tipoEntrega.value === 'retirada'
    ? 'Retirada na loja'
    : 'Rua, numero, bairro, cidade'
)

function digitosCep() {
  return formulario.cep.replace(/\D/g, '').slice(0, 8)
}

function formatarCep(cep: string) {
  return cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep
}

function montarEndereco(dados: EnderecoCep) {
  const partes = [
    dados.logradouro,
    dados.bairro,
    `${dados.localidade}/${dados.uf}`
  ].filter(Boolean)

  return partes.join(', ')
}

function aplicarClienteReconhecido() {
  const cliente = clienteAtual.value

  if (!cliente) {
    return
  }

  if (!formulario.telefoneCliente) {
    formulario.telefoneCliente = cliente.telefoneCliente
  }

  if (!formulario.nomeCliente && cliente.nomeCliente) {
    formulario.nomeCliente = cliente.nomeCliente
  }

  if (!formulario.cep && cliente.cep) {
    formulario.cep = cliente.cep
  }

  if (cliente.enderecoEntrega && cliente.enderecoEntrega !== enderecoRetirada) {
    enderecoEntregaSalvo.value = cliente.enderecoEntrega
  }

  if (!formulario.enderecoEntrega && cliente.enderecoEntrega) {
    formulario.enderecoEntrega = cliente.enderecoEntrega
  }

  if (cliente.tipoEntrega) {
    tipoEntrega.value = cliente.tipoEntrega
  }
}

function ajustarEnderecoPorEntrega() {
  if (tipoEntrega.value === 'retirada') {
    if (formulario.enderecoEntrega && formulario.enderecoEntrega !== enderecoRetirada) {
      enderecoEntregaSalvo.value = formulario.enderecoEntrega
    }

    formulario.enderecoEntrega = enderecoRetirada
    return
  }

  if (formulario.enderecoEntrega === enderecoRetirada) {
    formulario.enderecoEntrega = enderecoEntregaSalvo.value || ''
  }
}

async function consultarCep() {
  const cep = digitosCep()
  erroCep.value = ''

  if (!cep) {
    ultimoCepConsultado.value = ''
    return
  }

  if (cep.length !== 8) {
    erroCep.value = 'Informe um CEP com 8 digitos.'
    return
  }

  if (cep === ultimoCepConsultado.value) {
    return
  }

  consultandoCep.value = true

  try {
    const endereco = await $fetch<EnderecoCep>(`/api/cep/${cep}`)

    if (digitosCep() !== cep) {
      return
    }

    formulario.cep = endereco.cep || formatarCep(cep)
    formulario.enderecoEntrega = montarEndereco(endereco)
    ultimoCepConsultado.value = cep
  } catch (error) {
    erroCep.value = error instanceof Error ? error.message : 'Nao foi possivel consultar o CEP.'
    ultimoCepConsultado.value = ''
  } finally {
    consultandoCep.value = false
  }
}

function aoDigitarCep() {
  const cep = digitosCep()
  formulario.cep = formatarCep(cep)
  erroCep.value = ''

  if (cep.length === 8) {
    void consultarCep()
  } else {
    ultimoCepConsultado.value = ''
  }
}

async function enviarPedido() {
  const cep = digitosCep()

  if (cep && cep.length !== 8) {
    erroCep.value = 'Informe um CEP com 8 digitos.'
    return
  }

  if (consultandoCep.value || erroCep.value) {
    return
  }

  enviando.value = true
  erro.value = ''

  const payload: PedidoPayload = {
    ...formulario,
    tipoEntrega: tipoEntrega.value,
    itens: itens.value.map((item) => ({
      produtoId: item.produtoId,
      quantidade: item.quantidade
    }))
  }

  try {
    const resposta = await $fetch<{ pedido: PedidoResumo }>('/api/pedidos', {
      method: 'POST',
      body: payload
    })

    salvarCliente({
      telefoneCliente: formulario.telefoneCliente,
      nomeCliente: formulario.nomeCliente,
      cep: formulario.cep || undefined,
      enderecoEntrega: formulario.enderecoEntrega,
      tipoEntrega: tipoEntrega.value
    })

    ultimoPedido.value = resposta.pedido
    limpar()
    emitir('concluido', resposta.pedido)
  } catch (error) {
    erro.value =
      error instanceof Error ? error.message : 'Nao foi possivel fechar o pedido.'
  } finally {
    enviando.value = false
  }
}

onMounted(() => {
  carregarClientes()
  aplicarClienteReconhecido()
  ajustarEnderecoPorEntrega()
})

watch(clienteAtual, aplicarClienteReconhecido)
watch(tipoEntrega, ajustarEnderecoPorEntrega)
</script>

<template>
  <div class="pedido">
    <div v-if="ultimoPedido" class="pedido-sucesso">
      <CheckCircle2 :size="22" aria-hidden="true" />
      <div>
        <strong>Pedido recebido</strong>
        <span>{{ ultimoPedido.id.slice(0, 8) }} - {{ formatarCentavos(ultimoPedido.totalCentavos) }}</span>
      </div>
    </div>

    <form v-else class="formulario-pedido" @submit.prevent="enviarPedido">
      <label>
        Nome
        <input v-model="formulario.nomeCliente" autocomplete="name" required>
      </label>

      <label>
        WhatsApp
        <input v-model="formulario.telefoneCliente" autocomplete="tel" required>
      </label>

      <label>
        CEP
        <input
          v-model="formulario.cep"
          autocomplete="postal-code"
          inputmode="numeric"
          maxlength="9"
          placeholder="00000-000"
          @blur="consultarCep"
          @input="aoDigitarCep"
        >
      </label>
      <p v-if="consultandoCep" class="aviso-formulario">Consultando CEP...</p>
      <p v-if="erroCep" class="erro-formulario">{{ erroCep }}</p>

      <fieldset>
        <legend>Entrega</legend>
        <div class="opcoes-recebimento-formulario">
          <label v-for="opcao in opcoesEntrega" :key="opcao.valor">
            <input v-model="tipoEntrega" type="radio" name="tipoEntrega" :value="opcao.valor">
            <span>
              <component :is="opcao.icone" :size="18" aria-hidden="true" />
              {{ opcao.texto }}
            </span>
          </label>
        </div>
      </fieldset>

      <label>
        {{ rotuloEndereco }}
        <textarea v-model="formulario.enderecoEntrega" rows="3" :placeholder="placeholderEndereco" required />
      </label>

      <fieldset>
        <legend>Pagamento</legend>
        <div class="controle-segmentado">
          <label v-for="opcao in opcoesPagamento" :key="opcao.valor">
            <input
              v-model="formulario.formaPagamento"
              type="radio"
              name="formaPagamento"
              :value="opcao.valor"
            >
            <span>{{ opcao.texto }}</span>
          </label>
        </div>
      </fieldset>

      <label>
        Observacoes
        <textarea v-model="formulario.observacoes" rows="2" />
      </label>

      <p v-if="erro" class="erro-formulario">{{ erro }}</p>

      <button class="botao-fechar-pedido" type="submit" :disabled="enviando || consultandoCep || itens.length === 0">
        {{ enviando ? 'Enviando...' : 'Fechar pedido' }}
      </button>
    </form>
  </div>
</template>
