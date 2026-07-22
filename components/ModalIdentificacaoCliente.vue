<script setup lang="ts">
import { Clock, Home, LoaderCircle, MapPin, Phone, Search, Store, Truck, X } from '@lucide/vue'
import type { Component } from 'vue'
import type { ConfiguracoesLoja, TipoEntrega } from '~/types/loja'
import { criarConfiguracoesLojaPadrao } from '~/composables/useConfiguracoesLoja'

const { tipoEntrega } = useCarrinho()
const {
  clienteAtual,
  modalIdentificacaoAberto,
  carregarClientes,
  buscarClientePorTelefone,
  identificarCliente,
  fecharModalIdentificacao,
  normalizarTelefone,
  formatarTelefone
} = useClienteReconhecimento()
const {
  carregarHistoricoCliente,
  obterPedidoAtivoPorTelefone
} = useHistoricoPedidos()
const { data: dadosConfiguracoes } = await useFetch<{ configuracoes: ConfiguracoesLoja }>('/api/configuracoes', {
  default: () => ({ configuracoes: criarConfiguracoesLojaPadrao() })
})

const telefone = ref('')
const nome = ref('')
const carregando = ref(false)
const erro = ref('')
const estado = ref<'inicial' | 'encontrado' | 'novo'>('inicial')
const enderecoSelecionado = ref(false)
const enderecoRetirada = 'Retirada na loja'
const ultimoTelefoneConsultado = ref('')
let temporizadorBuscaCliente: ReturnType<typeof setTimeout> | undefined

const opcoesRecebimento: Array<{
  valor: TipoEntrega
  texto: string
  icone: Component
}> = [
  { valor: 'entrega_local', texto: 'Entregar no seu endereco', icone: Truck },
  { valor: 'retirada', texto: 'Retirar na loja', icone: Store },
  { valor: 'agendada', texto: 'Agendar entrega', icone: Clock }
]

const telefoneValido = computed(() => normalizarTelefone(telefone.value).length >= 8)
const clienteTemDados = computed(() =>
  Boolean(clienteAtual.value?.nomeCliente || clienteAtual.value?.enderecoEntrega)
)
const clienteTemEndereco = computed(() =>
  Boolean(clienteAtual.value?.enderecoEntrega && clienteAtual.value.enderecoEntrega !== enderecoRetirada)
)
const pedidoAtivoIdentificado = computed(() =>
  obterPedidoAtivoPorTelefone(telefone.value || clienteAtual.value?.telefoneCliente)
)
const funcionamentoLoja = computed(() =>
  dadosConfiguracoes.value?.configuracoes.funcionamento ?? criarConfiguracoesLojaPadrao().funcionamento
)
const entregaDisponivel = computed(() => funcionamentoLoja.value.entregaDisponivel)

function preencherFormulario() {
  if (!clienteAtual.value) {
    return
  }

  telefone.value = clienteAtual.value.telefoneCliente
  nome.value = clienteAtual.value.nomeCliente || nome.value

  if (clienteAtual.value.tipoEntrega) {
    tipoEntrega.value = clienteAtual.value.tipoEntrega
  }
}

function selecionarEndereco() {
  const cliente = clienteAtual.value

  if (!cliente?.enderecoEntrega || cliente.enderecoEntrega === enderecoRetirada) {
    return
  }

  enderecoSelecionado.value = true
  tipoEntrega.value = 'entrega_local'

  identificarCliente({
    telefoneCliente: telefone.value || cliente.telefoneCliente,
    nomeCliente: nome.value || cliente.nomeCliente,
    cep: cliente.cep,
    enderecoEntrega: cliente.enderecoEntrega,
    tipoEntrega: 'entrega_local'
  })
}

async function reconhecerCliente(forcar = false) {
  erro.value = ''

  if (!telefoneValido.value) {
    erro.value = 'Informe um telefone valido.'
    return
  }

  const telefoneNormalizado = normalizarTelefone(telefone.value)

  if (!forcar && telefoneNormalizado === ultimoTelefoneConsultado.value) {
    return
  }

  carregando.value = true

  try {
    const cliente = await buscarClientePorTelefone(telefone.value, {
      atualizarRemoto: true
    })
    await carregarHistoricoCliente(telefone.value)
    ultimoTelefoneConsultado.value = telefoneNormalizado

    if (cliente) {
      preencherFormulario()
      estado.value = clienteTemDados.value ? 'encontrado' : 'novo'
      return
    }

    identificarCliente({
      telefoneCliente: telefone.value,
      nomeCliente: nome.value || undefined,
      tipoEntrega: tipoEntrega.value
    })
    estado.value = 'novo'
  } finally {
    carregando.value = false
  }
}

function aoDigitarTelefone() {
  erro.value = ''
  estado.value = 'inicial'

  if (temporizadorBuscaCliente) {
    clearTimeout(temporizadorBuscaCliente)
  }

  if (!telefoneValido.value) {
    ultimoTelefoneConsultado.value = ''
    return
  }

  temporizadorBuscaCliente = setTimeout(() => {
    void reconhecerCliente()
  }, 650)
}

function selecionarRecebimento(valor: TipoEntrega) {
  if (valor !== 'retirada' && !entregaDisponivel.value) {
    return
  }

  tipoEntrega.value = valor
  enderecoSelecionado.value = valor === 'entrega_local' && clienteTemEndereco.value

  if (!telefoneValido.value) {
    return
  }

  identificarCliente({
    telefoneCliente: telefone.value,
    nomeCliente: nome.value || clienteAtual.value?.nomeCliente,
    cep: clienteAtual.value?.cep,
    enderecoEntrega: clienteAtual.value?.enderecoEntrega,
    tipoEntrega: valor
  })
}

function continuar() {
  const cliente = clienteAtual.value

  if (telefoneValido.value) {
    identificarCliente({
      telefoneCliente: telefone.value || cliente?.telefoneCliente || '',
      nomeCliente: nome.value || cliente?.nomeCliente,
      cep: cliente?.cep,
      enderecoEntrega: cliente?.enderecoEntrega,
      tipoEntrega: tipoEntrega.value
    })
  }

  fecharModalIdentificacao()
}

onMounted(() => {
  carregarClientes()
  preencherFormulario()

  if (clienteAtual.value?.telefoneCliente) {
    void carregarHistoricoCliente(clienteAtual.value.telefoneCliente)
  }
})

watch(clienteAtual, (cliente) => {
  preencherFormulario()

  if (cliente?.telefoneCliente) {
    void carregarHistoricoCliente(cliente.telefoneCliente)
  }
})
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
  <Teleport to="body">
    <div
      v-if="modalIdentificacaoAberto"
      class="fundo-identificacao"
      @click.self="fecharModalIdentificacao"
    >
      <section class="modal-identificacao" role="dialog" aria-modal="true" aria-labelledby="titulo-identificacao">
        <header class="modal-identificacao__cabecalho">
          <strong id="titulo-identificacao">Identifique seu pedido</strong>
          <button class="botao-icone" type="button" aria-label="Fechar" @click="fecharModalIdentificacao">
            <X :size="22" aria-hidden="true" />
          </button>
        </header>

        <form class="formulario-identificacao" @submit.prevent="reconhecerCliente(true)">
          <label>
            WhatsApp
            <span class="campo-com-icone">
              <Phone :size="18" aria-hidden="true" />
              <input
                v-model="telefone"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                placeholder="(17) 99999-9999"
                @blur="reconhecerCliente(true)"
                @input="aoDigitarTelefone"
              >
            </span>
          </label>

          <label>
            Nome
            <input v-model="nome" autocomplete="name" placeholder="Seu nome">
          </label>

          <button class="botao-modal botao-modal--principal" type="submit" :disabled="carregando || !telefoneValido">
            <LoaderCircle v-if="carregando" class="icone-girando" :size="18" aria-hidden="true" />
            <Search v-else :size="18" aria-hidden="true" />
            {{ carregando ? 'Buscando...' : 'Buscar cadastro' }}
          </button>
        </form>

        <p v-if="erro" class="erro-formulario">{{ erro }}</p>
        <p v-else-if="pedidoAtivoIdentificado" class="aviso-formulario">
          Voce ja tem um pedido em andamento.
          <NuxtLink :to="`/pedido/${pedidoAtivoIdentificado.id}`" @click="fecharModalIdentificacao">
            Acompanhar pedido
          </NuxtLink>
        </p>
        <p v-else-if="estado === 'novo'" class="aviso-formulario">Telefone registrado para este pedido.</p>

        <section v-if="clienteAtual && clienteTemEndereco" class="bloco-identificacao">
          <h2>Ultimo endereco utilizado</h2>
          <button
            class="cartao-endereco-modal cartao-endereco-modal--botao"
            :class="{ 'cartao-endereco-modal--ativo': enderecoSelecionado }"
            type="button"
            @click="selecionarEndereco"
          >
            <MapPin :size="30" aria-hidden="true" />
            <div>
              <span class="etiqueta-endereco">
                <Home :size="15" aria-hidden="true" />
                Casa
              </span>
              <strong>{{ clienteAtual.nomeCliente || 'Cliente' }}</strong>
              <p>{{ clienteAtual.enderecoEntrega || 'Endereco sera preenchido na finalizacao' }}</p>
              <small>{{ formatarTelefone(clienteAtual.telefoneCliente) }}</small>
            </div>
          </button>
        </section>

        <section class="bloco-identificacao">
          <h2>Como voce quer receber o pedido?</h2>
          <div class="opcoes-recebimento-modal">
            <button
              v-for="opcao in opcoesRecebimento"
              :key="opcao.valor"
              type="button"
              :class="{ ativo: tipoEntrega === opcao.valor }"
              :disabled="opcao.valor !== 'retirada' && !entregaDisponivel"
              @click="selecionarRecebimento(opcao.valor)"
            >
              <component :is="opcao.icone" :size="20" aria-hidden="true" />
              {{ opcao.texto }}
            </button>
          </div>
          <p v-if="!entregaDisponivel" class="aviso-formulario">
            {{ funcionamentoLoja.mensagemEntrega }}
          </p>
        </section>

        <footer class="modal-identificacao__rodape">
          <button class="botao-modal botao-modal--secundario" type="button" @click="fecharModalIdentificacao">
            Agora nao
          </button>
          <button class="botao-modal botao-modal--principal" type="button" @click="continuar">
            Continuar
          </button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
