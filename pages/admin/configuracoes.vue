<script setup lang="ts">
import { Save, Settings } from '@lucide/vue'
import type { ConfiguracoesLoja } from '~/types/loja'

const erroAdmin = ref('')
const carregandoConfiguracoes = ref(false)
const salvando = ref(false)
const salvo = ref(false)

const formulario = reactive<ConfiguracoesLoja>({
  modalIdentificacaoAtivo: true
})

const {
  data: dadosConfiguracoes,
  refresh: recarregarConfiguracoes
} = await useFetch<{ configuracoes: ConfiguracoesLoja }>('/api/admin/configuracoes', {
  default: () => ({ configuracoes: { modalIdentificacaoAtivo: true } }),
  immediate: false,
  credentials: 'include'
})

function aplicarConfiguracoes() {
  formulario.modalIdentificacaoAtivo =
    dadosConfiguracoes.value?.configuracoes.modalIdentificacaoAtivo ?? true
}

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
        modalIdentificacaoAtivo: formulario.modalIdentificacaoAtivo
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

        <button class="botao-admin" type="submit" :disabled="salvando">
          <Save :size="17" aria-hidden="true" />
          {{ salvando ? 'Salvando...' : 'Salvar configuracoes' }}
        </button>
      </form>
    </section>
  </AdminArea>
</template>
