<script setup lang="ts">
import { Clock, Home, LoaderCircle, MapPin, Phone, Search, Store, Truck, X } from '@lucide/vue'
import type { Component } from 'vue'
import type { TipoEntrega } from '~/types/loja'

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

const telefone = ref('')
const nome = ref('')
const carregando = ref(false)
const erro = ref('')
const estado = ref<'inicial' | 'encontrado' | 'novo'>('inicial')

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

async function reconhecerCliente() {
  erro.value = ''

  if (!telefoneValido.value) {
    erro.value = 'Informe um telefone valido.'
    return
  }

  carregando.value = true

  try {
    const cliente = await buscarClientePorTelefone(telefone.value)

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

function selecionarRecebimento(valor: TipoEntrega) {
  tipoEntrega.value = valor

  if (!telefoneValido.value) {
    return
  }

  identificarCliente({
    telefoneCliente: telefone.value,
    nomeCliente: nome.value || undefined,
    tipoEntrega: valor
  })
}

function continuar() {
  if (telefoneValido.value) {
    identificarCliente({
      telefoneCliente: telefone.value,
      nomeCliente: nome.value || undefined,
      tipoEntrega: tipoEntrega.value
    })
  }

  fecharModalIdentificacao()
}

onMounted(() => {
  carregarClientes()
  preencherFormulario()
})

watch(clienteAtual, preencherFormulario)
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

        <form class="formulario-identificacao" @submit.prevent="reconhecerCliente">
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
        <p v-else-if="estado === 'novo'" class="aviso-formulario">Telefone registrado para este pedido.</p>

        <section v-if="clienteAtual && clienteTemDados" class="bloco-identificacao">
          <h2>Ultimo endereco utilizado</h2>
          <article class="cartao-endereco-modal">
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
          </article>
        </section>

        <section class="bloco-identificacao">
          <h2>Como voce quer receber o pedido?</h2>
          <div class="opcoes-recebimento-modal">
            <button
              v-for="opcao in opcoesRecebimento"
              :key="opcao.valor"
              type="button"
              :class="{ ativo: tipoEntrega === opcao.valor }"
              @click="selecionarRecebimento(opcao.valor)"
            >
              <component :is="opcao.icone" :size="20" aria-hidden="true" />
              {{ opcao.texto }}
            </button>
          </div>
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
