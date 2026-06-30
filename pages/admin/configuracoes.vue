<script setup lang="ts">
import { Save, Settings } from '@lucide/vue'
import {
  FUNCIONAMENTO_LOJA_PADRAO,
  criarConfiguracoesLojaPadrao
} from '~/composables/useConfiguracoesLoja'
import type { ConfiguracoesLoja } from '~/types/loja'

const erroAdmin = ref('')
const carregandoConfiguracoes = ref(false)
const salvando = ref(false)
const salvo = ref(false)

type FormularioConfiguracoes = Pick<
  ConfiguracoesLoja,
  'modalIdentificacaoAtivo' | 'aceitarPedidosAutomaticamente' | 'modoFuncionamentoOnline'
>

const formulario = reactive<FormularioConfiguracoes>({
  modalIdentificacaoAtivo: true,
  aceitarPedidosAutomaticamente: false,
  modoFuncionamentoOnline: 'automatico'
})

const {
  data: dadosConfiguracoes,
  refresh: recarregarConfiguracoes
} = await useFetch<{ configuracoes: ConfiguracoesLoja }>('/api/admin/configuracoes', {
  default: () => ({
    configuracoes: criarConfiguracoesLojaPadrao()
  }),
  immediate: false,
  credentials: 'include'
})

function aplicarConfiguracoes() {
  formulario.modalIdentificacaoAtivo =
    dadosConfiguracoes.value?.configuracoes.modalIdentificacaoAtivo ?? true
  formulario.aceitarPedidosAutomaticamente =
    dadosConfiguracoes.value?.configuracoes.aceitarPedidosAutomaticamente ?? false
  formulario.modoFuncionamentoOnline =
    dadosConfiguracoes.value?.configuracoes.modoFuncionamentoOnline ?? 'automatico'
}

const funcionamentoLoja = computed(
  () => dadosConfiguracoes.value?.configuracoes.funcionamento ?? FUNCIONAMENTO_LOJA_PADRAO
)

async function carregarConfiguracoes() {
  erroAdmin.value = ''
  salvo.value = false
  carregandoConfiguracoes.value = true

  try {
    await recarregarConfiguracoes()
    aplicarConfiguracoes()
  } catch {
    erroAdmin.value = 'Nao foi possivel carregar as configuracoes.'
  } finally {
    carregandoConfiguracoes.value = false
  }
}

async function salvarConfiguracoes() {
  salvando.value = true
  erroAdmin.value = ''
  salvo.value = false

  try {
    const resposta = await $fetch<{ configuracoes: ConfiguracoesLoja }>('/api/admin/configuracoes', {
      method: 'PUT',
      credentials: 'include',
      body: {
        modalIdentificacaoAtivo: formulario.modalIdentificacaoAtivo,
        aceitarPedidosAutomaticamente: formulario.aceitarPedidosAutomaticamente,
        modoFuncionamentoOnline: formulario.modoFuncionamentoOnline
      }
    })

    dadosConfiguracoes.value = resposta
    aplicarConfiguracoes()
    salvo.value = true
  } catch (error) {
    erroAdmin.value =
      error instanceof Error ? error.message : 'Nao foi possivel salvar as configuracoes.'
  } finally {
    salvando.value = false
  }
}

watch(dadosConfiguracoes, aplicarConfiguracoes, { deep: true })
</script>

<template>
  <AdminArea
    titulo="Configuracoes"
    subtitulo="Preferencias da loja online"
    @autenticado="carregarConfiguracoes"
    @recarregar="carregarConfiguracoes"
  >
    <p v-if="erroAdmin" class="erro-formulario">{{ erroAdmin }}</p>
    <p v-if="salvo" class="aviso-formulario">Configuracoes salvas.</p>
    <p v-if="carregandoConfiguracoes" class="aviso-formulario">Carregando configuracoes...</p>

    <section class="painel-admin">
      <div class="titulo-secao">
        <h1>Experiencia do cliente</h1>
        <Settings :size="22" aria-hidden="true" />
      </div>

      <form class="formulario-admin" @submit.prevent="salvarConfiguracoes">
        <label class="linha-configuracao">
          <span>
            <strong>Modal inicial de telefone e endereco</strong>
            <small>Quando ativo, o cliente ve o reconhecimento ao abrir a loja.</small>
          </span>
          <input v-model="formulario.modalIdentificacaoAtivo" type="checkbox">
        </label>

        <label class="linha-configuracao">
          <span>
            <strong>Aceitar pedidos automaticamente</strong>
            <small>Quando ativo, pedidos dentro do horario da loja entram em separacao e sao impressos no painel.</small>
            <small>{{ funcionamentoLoja.horario }}</small>
            <small>{{ funcionamentoLoja.aberta ? 'Loja online aberta agora.' : funcionamentoLoja.mensagem }}</small>
          </span>
          <input v-model="formulario.aceitarPedidosAutomaticamente" type="checkbox">
        </label>

        <label class="linha-configuracao linha-configuracao--coluna">
          <span>
            <strong>Funcionamento da loja online</strong>
            <small>Use "Aberta manualmente" para testar pedidos fora do horario ou aos domingos.</small>
          </span>
          <select v-model="formulario.modoFuncionamentoOnline">
            <option value="automatico">Automatico pelo horario</option>
            <option value="aberta">Aberta manualmente</option>
            <option value="fechada">Fechada manualmente</option>
          </select>
        </label>

        <button class="botao-admin" type="submit" :disabled="salvando">
          <Save :size="17" aria-hidden="true" />
          {{ salvando ? 'Salvando...' : 'Salvar configuracoes' }}
        </button>
      </form>
    </section>
  </AdminArea>
</template>
