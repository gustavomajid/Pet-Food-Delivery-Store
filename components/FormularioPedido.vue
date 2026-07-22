<script setup lang="ts">
import { CheckCircle2, Clock, Store, Truck } from '@lucide/vue'
import type { Component } from 'vue'
import type {
  ConfiguracoesLoja,
  FormaPagamento,
  PedidoPayload,
  PedidoResumo,
  TipoEntrega
} from '~/types/loja'
import {
  FUNCIONAMENTO_LOJA_PADRAO,
  criarConfiguracoesLojaPadrao
} from '~/composables/useConfiguracoesLoja'

type EnderecoCep = {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
}

type EnderecoFormulario = {
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

const emitir = defineEmits<{
  concluido: [pedido: PedidoResumo]
}>()

const { itens, tipoEntrega, limpar } = useCarrinho()
const { formatarCentavos } = useDinheiro()
const {
  clienteAtual,
  carregarClientes,
  salvarCliente,
  buscarClientePorTelefone,
  normalizarTelefone
} = useClienteReconhecimento()
const {
  registrarPedido,
  obterPedidoAtivoPorTelefone,
  carregarHistoricoCliente
} = useHistoricoPedidos()
const { data: dadosConfiguracoes } = await useFetch<{ configuracoes: ConfiguracoesLoja }>(
  '/api/configuracoes',
  {
    default: () => ({
      configuracoes: criarConfiguracoesLojaPadrao()
    })
  }
)

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
  formaPagamento: 'pix' as FormaPagamento,
  observacoes: ''
})

const endereco = reactive<EnderecoFormulario>({
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: ''
})

const enviando = ref(false)
const consultandoCep = ref(false)
const consultandoCliente = ref(false)
const erro = ref('')
const erroCep = ref('')
const avisoCliente = ref('')
const ultimoCepConsultado = ref('')
const ultimoTelefoneConsultado = ref('')
const ultimoPedido = ref<PedidoResumo | null>(null)
const enderecoEntregaSalvo = ref('')
const enderecoRetirada = 'Retirada na loja'
let temporizadorBuscaCliente: ReturnType<typeof setTimeout> | undefined

const precisaEnderecoEntrega = computed(() => tipoEntrega.value !== 'retirada')
const enderecoCompleto = computed(() =>
  precisaEnderecoEntrega.value ? montarEnderecoEntrega() : enderecoRetirada
)
const funcionamentoLoja = computed(
  () => dadosConfiguracoes.value?.configuracoes.funcionamento ?? FUNCIONAMENTO_LOJA_PADRAO
)
const lojaOnlineAberta = computed(() => funcionamentoLoja.value.aberta)
const entregaDisponivel = computed(() => funcionamentoLoja.value.entregaDisponivel)
const pedidoAtivoFormulario = computed(() =>
  obterPedidoAtivoPorTelefone(formulario.telefoneCliente || clienteAtual.value?.telefoneCliente)
)

function extrairPedidoAtivo(error: unknown) {
  const erro = error as {
    data?: {
      data?: {
        pedido?: PedidoResumo
      }
      pedido?: PedidoResumo
    }
  }

  return erro.data?.data?.pedido ?? erro.data?.pedido ?? null
}

function mensagemErroPedido(error: unknown) {
  const erro = error as {
    data?: {
      message?: string
      statusMessage?: string
      data?: {
        funcionamento?: {
          mensagem?: string
        }
      }
    }
    message?: string
  }

  return erro.data?.data?.funcionamento?.mensagem ||
    erro.data?.statusMessage ||
    erro.data?.message ||
    erro.message ||
    'Nao foi possivel fechar o pedido.'
}

function digitosCep() {
  return formulario.cep.replace(/\D/g, '').slice(0, 8)
}

function formatarCep(cep: string) {
  return cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep
}

function aplicarEndereco(valor: Partial<EnderecoFormulario>) {
  endereco.logradouro = valor.logradouro ?? endereco.logradouro
  endereco.numero = valor.numero ?? endereco.numero
  endereco.complemento = valor.complemento ?? endereco.complemento
  endereco.bairro = valor.bairro ?? endereco.bairro
  endereco.cidade = valor.cidade ?? endereco.cidade
  endereco.uf = (valor.uf ?? endereco.uf).toUpperCase().slice(0, 2)
}

function limparEndereco() {
  aplicarEndereco({
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: ''
  })
}

function enderecoEstaVazio() {
  return ![
    endereco.logradouro,
    endereco.numero,
    endereco.complemento,
    endereco.bairro,
    endereco.cidade,
    endereco.uf
  ].some((valor) => valor.trim())
}

function montarEnderecoEntrega() {
  const linhaRua = [
    endereco.logradouro.trim(),
    endereco.numero.trim() ? `Numero ${endereco.numero.trim()}` : ''
  ].filter(Boolean)

  const cidadeUf = [
    endereco.cidade.trim(),
    endereco.uf.trim().toUpperCase()
  ].filter(Boolean).join('/')

  return [
    linhaRua.join(', '),
    endereco.complemento.trim(),
    endereco.bairro.trim() ? `Bairro ${endereco.bairro.trim()}` : '',
    cidadeUf
  ].filter(Boolean).join(', ')
}

function separarEnderecoSalvo(valor: string) {
  if (!valor || valor === enderecoRetirada) {
    return
  }

  const partes = valor.split(',').map((parte) => parte.trim()).filter(Boolean)
  const proximo: EnderecoFormulario = {
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: ''
  }

  for (const parte of partes) {
    const cidadeUf = parte.match(/^(.+?)\s*\/\s*([A-Za-z]{2})$/)
    const numero = parte.match(/^(?:n(?:umero|o)?\.?\s*)?(.+)$/i)
    const numeroTexto = numero?.[1]?.trim()

    if (cidadeUf) {
      proximo.cidade = (cidadeUf[1] ?? '').trim()
      proximo.uf = (cidadeUf[2] ?? '').trim().toUpperCase()
      continue
    }

    if (/^bairro\b/i.test(parte)) {
      proximo.bairro = parte.replace(/^bairro\s*/i, '').trim()
      continue
    }

    if (/^(?:numero|no?\.?)\b/i.test(parte)) {
      proximo.numero = parte.replace(/^(?:numero|no?\.?)\s*/i, '').trim()
      continue
    }

    if (!proximo.logradouro) {
      proximo.logradouro = parte
      continue
    }

    if (!proximo.numero && numeroTexto && /^(?:\d+[A-Za-z-]*|s\/n)$/i.test(numeroTexto)) {
      proximo.numero = numeroTexto
      continue
    }

    if (!proximo.bairro) {
      proximo.bairro = parte
      continue
    }

    proximo.complemento = proximo.complemento ? `${proximo.complemento}, ${parte}` : parte
  }

  aplicarEndereco(proximo)
}

function aplicarDadosCliente(
  cliente = clienteAtual.value,
  opcoes: { sobrescrever?: boolean } = {}
) {
  if (!cliente) {
    return
  }

  if (opcoes.sobrescrever || !formulario.telefoneCliente) {
    formulario.telefoneCliente = cliente.telefoneCliente
  }

  if ((opcoes.sobrescrever || !formulario.nomeCliente) && cliente.nomeCliente) {
    formulario.nomeCliente = cliente.nomeCliente
  }

  if ((opcoes.sobrescrever || !formulario.cep) && cliente.cep) {
    formulario.cep = cliente.cep
  }

  if (cliente.enderecoEntrega && cliente.enderecoEntrega !== enderecoRetirada) {
    enderecoEntregaSalvo.value = cliente.enderecoEntrega
  }

  if (
    cliente.enderecoEntrega &&
    cliente.enderecoEntrega !== enderecoRetirada &&
    (opcoes.sobrescrever || enderecoEstaVazio())
  ) {
    separarEnderecoSalvo(cliente.enderecoEntrega)
  }

  if (cliente.tipoEntrega) {
    tipoEntrega.value = cliente.tipoEntrega
  }
}

function aplicarClienteReconhecido() {
  aplicarDadosCliente()
}

async function buscarCadastroPorTelefone(forcar = false) {
  const telefoneNormalizado = normalizarTelefone(formulario.telefoneCliente)
  avisoCliente.value = ''

  if (telefoneNormalizado.length < 8) {
    ultimoTelefoneConsultado.value = ''
    return
  }

  if (!forcar && telefoneNormalizado === ultimoTelefoneConsultado.value) {
    return
  }

  consultandoCliente.value = true

  try {
    const cliente = await buscarClientePorTelefone(formulario.telefoneCliente, {
      atualizarRemoto: true
    })

    await carregarHistoricoCliente(formulario.telefoneCliente)
    ultimoTelefoneConsultado.value = telefoneNormalizado

    if (cliente) {
      aplicarDadosCliente(cliente, { sobrescrever: true })
      avisoCliente.value = cliente.enderecoEntrega
        ? 'Cadastro encontrado. Nome e endereco foram preenchidos.'
        : 'Cadastro encontrado. Nome preenchido.'
      return
    }

    salvarCliente({
      telefoneCliente: formulario.telefoneCliente,
      nomeCliente: formulario.nomeCliente || undefined,
      tipoEntrega: tipoEntrega.value
    })
    avisoCliente.value = 'Novo cliente identificado pelo celular.'
  } catch {
    avisoCliente.value = 'Nao foi possivel buscar o cadastro agora.'
  } finally {
    consultandoCliente.value = false
  }
}

function aoDigitarTelefone() {
  avisoCliente.value = ''

  if (temporizadorBuscaCliente) {
    clearTimeout(temporizadorBuscaCliente)
  }

  const telefoneNormalizado = normalizarTelefone(formulario.telefoneCliente)

  if (telefoneNormalizado.length < 8) {
    ultimoTelefoneConsultado.value = ''
    return
  }

  temporizadorBuscaCliente = setTimeout(() => {
    void buscarCadastroPorTelefone()
  }, 650)
}

function ajustarEnderecoPorEntrega() {
  if (tipoEntrega.value === 'retirada') {
    const enderecoAtual = montarEnderecoEntrega()

    if (enderecoAtual) {
      enderecoEntregaSalvo.value = enderecoAtual
    }

    limparEndereco()
    return
  }

  if (!montarEnderecoEntrega() && enderecoEntregaSalvo.value) {
    separarEnderecoSalvo(enderecoEntregaSalvo.value)
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
    const endereco = await $fetch<EnderecoCep>(`/api/clientes/cep/${cep}`)

    if (digitosCep() !== cep) {
      return
    }

    formulario.cep = endereco.cep || formatarCep(cep)
    aplicarEndereco({
      logradouro: endereco.logradouro,
      complemento: endereco.complemento,
      bairro: endereco.bairro,
      cidade: endereco.localidade,
      uf: endereco.uf
    })
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
  if (!lojaOnlineAberta.value) {
    erro.value = funcionamentoLoja.value.mensagem
    return
  }

  if (normalizarTelefone(formulario.telefoneCliente).length >= 8) {
    await buscarCadastroPorTelefone()
  }

  const pedidoAtivo = pedidoAtivoFormulario.value

  if (pedidoAtivo) {
    erro.value = 'Voce ja tem um pedido em andamento. Acompanhe esse pedido antes de fazer outro.'
    registrarPedido(pedidoAtivo)
    emitir('concluido', pedidoAtivo)
    return
  }

  const cep = digitosCep()

  if (cep && cep.length !== 8) {
    erroCep.value = 'Informe um CEP com 8 digitos.'
    return
  }

  if (consultandoCep.value || erroCep.value) {
    return
  }

  if (precisaEnderecoEntrega.value && !montarEnderecoEntrega()) {
    erro.value = 'Preencha o endereco de entrega.'
    return
  }

  enviando.value = true
  erro.value = ''

  const payload: PedidoPayload = {
    ...formulario,
    enderecoEntrega: enderecoCompleto.value,
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
      enderecoEntrega: enderecoCompleto.value,
      tipoEntrega: tipoEntrega.value
    })

    ultimoPedido.value = resposta.pedido
    registrarPedido(resposta.pedido)
    limpar()
    emitir('concluido', resposta.pedido)
  } catch (error) {
    const pedidoAtivo = extrairPedidoAtivo(error)

    if (pedidoAtivo) {
      erro.value = 'Voce ja tem um pedido em andamento. Acompanhe esse pedido antes de fazer outro.'
      registrarPedido(pedidoAtivo)
      limpar()
      emitir('concluido', pedidoAtivo)
      return
    }

    erro.value = mensagemErroPedido(error)
  } finally {
    enviando.value = false
  }
}

onMounted(() => {
  carregarClientes()
  aplicarClienteReconhecido()
  ajustarEnderecoPorEntrega()

  if (formulario.telefoneCliente) {
    void carregarHistoricoCliente(formulario.telefoneCliente)
  }
})

watch(clienteAtual, aplicarClienteReconhecido)
watch(tipoEntrega, ajustarEnderecoPorEntrega)
watch(entregaDisponivel, (disponivel) => {
  if (!disponivel && tipoEntrega.value !== 'retirada') {
    tipoEntrega.value = 'retirada'
  }
}, { immediate: true })
onBeforeUnmount(() => {
  if (temporizadorBuscaCliente) {
    clearTimeout(temporizadorBuscaCliente)
  }
})
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
      <section v-if="!lojaOnlineAberta" class="aviso-loja-fechada aviso-loja-fechada--compacto">
        <Clock :size="20" aria-hidden="true" />
        <div>
          <strong>Loja fechada</strong>
          <span>{{ funcionamentoLoja.mensagem }}</span>
        </div>
      </section>

      <label>
        Nome
        <input v-model="formulario.nomeCliente" autocomplete="name" required>
      </label>

      <label>
        WhatsApp
        <input
          v-model="formulario.telefoneCliente"
          autocomplete="tel"
          inputmode="tel"
          type="tel"
          required
          @blur="buscarCadastroPorTelefone(true)"
          @input="aoDigitarTelefone"
        >
      </label>
      <p v-if="consultandoCliente" class="aviso-formulario">Buscando cadastro pelo celular...</p>
      <p v-else-if="avisoCliente" class="aviso-formulario">{{ avisoCliente }}</p>

      <fieldset>
        <legend>Entrega</legend>
        <div class="opcoes-recebimento-formulario">
          <label
            v-for="opcao in opcoesEntrega"
            :key="opcao.valor"
            :class="{ indisponivel: opcao.valor !== 'retirada' && !entregaDisponivel }"
          >
            <input
              v-model="tipoEntrega"
              type="radio"
              name="tipoEntrega"
              :value="opcao.valor"
              :disabled="opcao.valor !== 'retirada' && !entregaDisponivel"
            >
            <span>
              <component :is="opcao.icone" :size="18" aria-hidden="true" />
              {{ opcao.texto }}
            </span>
          </label>
        </div>
        <p v-if="!entregaDisponivel" class="aviso-formulario">
          {{ funcionamentoLoja.mensagemEntrega }}
        </p>
      </fieldset>

      <section v-if="precisaEnderecoEntrega" class="grupo-endereco" aria-label="Endereco de entrega">
        <label class="campo-endereco--inteiro">
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
        <p v-if="consultandoCep" class="aviso-formulario campo-endereco--inteiro">Consultando CEP...</p>
        <p v-if="erroCep" class="erro-formulario campo-endereco--inteiro">{{ erroCep }}</p>

        <label class="campo-endereco--inteiro">
          Rua
          <input v-model="endereco.logradouro" autocomplete="address-line1" placeholder="Rua, avenida ou estrada" required>
        </label>

        <label>
          Numero
          <input v-model="endereco.numero" autocomplete="address-line2" placeholder="123" required>
        </label>

        <label>
          Complemento
          <input v-model="endereco.complemento" autocomplete="address-line3" placeholder="Apto, bloco, casa">
        </label>

        <label>
          Bairro
          <input v-model="endereco.bairro" placeholder="Bairro" required>
        </label>

        <label>
          Cidade
          <input v-model="endereco.cidade" autocomplete="address-level2" placeholder="Cidade" required>
        </label>

        <label>
          UF
          <input v-model="endereco.uf" autocomplete="address-level1" maxlength="2" placeholder="SP" required @input="endereco.uf = endereco.uf.toUpperCase().slice(0, 2)">
        </label>
      </section>

      <label v-else>
        Local de retirada
        <input :value="enderecoRetirada" readonly>
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
      <p v-else-if="pedidoAtivoFormulario" class="aviso-formulario">
        Voce ja tem um pedido em andamento. Abra o acompanhamento antes de fazer outro pedido.
      </p>

      <button class="botao-fechar-pedido" type="submit" :disabled="!lojaOnlineAberta || enviando || consultandoCep || consultandoCliente || itens.length === 0">
        {{ !lojaOnlineAberta ? 'Loja fechada' : pedidoAtivoFormulario ? 'Ver pedido em andamento' : enviando ? 'Enviando...' : 'Fechar pedido' }}
      </button>
    </form>
  </div>
</template>
