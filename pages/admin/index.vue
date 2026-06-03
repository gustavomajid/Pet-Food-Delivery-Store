<script setup lang="ts">
import { ClipboardList, LogOut, Package } from '@lucide/vue'

const senha = ref('')
const logado = ref(false)
const carregandoSessao = ref(true)
const erroLogin = ref('')

onMounted(async () => {
  try {
    await $fetch('/api/admin/eu', { credentials: 'include' })
    logado.value = true
  } catch {
    logado.value = false
  } finally {
    carregandoSessao.value = false
  }
})

async function entrar() {
  erroLogin.value = ''

  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include',
      body: { senha: senha.value }
    })

    logado.value = true
    senha.value = ''
  } catch {
    erroLogin.value = 'Senha invalida.'
  }
}

async function sair() {
  await $fetch('/api/admin/sair', { method: 'POST', credentials: 'include' })
  logado.value = false
}

function abrirArea(caminho: string) {
  if (import.meta.client) {
    window.location.assign(caminho)
  }
}
</script>

<template>
  <main class="admin">
    <header class="topo admin-topo">
      <div class="marca-loja">
        <span class="marca-loja__icone">
          <img src="/img/logo.jpeg" alt="" aria-hidden="true">
        </span>
        <div>
          <strong>Painel</strong>
          <span>Escolha uma area</span>
        </div>
      </div>

      <nav class="acoes-topo" aria-label="Acoes do painel">
        <a class="botao-admin botao-admin--secundario" href="/">Loja</a>
        <button
          v-if="logado"
          class="botao-icone"
          type="button"
          aria-label="Sair"
          @click="sair"
        >
          <LogOut :size="18" aria-hidden="true" />
        </button>
      </nav>
    </header>

    <div class="admin-corpo">
      <section v-if="carregandoSessao" class="painel-admin login-admin login-admin--embutido">
        <div class="marca-loja marca-loja--central">
          <span class="marca-loja__icone">
            <img src="/img/logo.jpeg" alt="" aria-hidden="true">
          </span>
          <div>
            <strong>Painel AgroPet Fazendinha</strong>
            <span>Verificando acesso...</span>
          </div>
        </div>
      </section>

      <section v-else-if="!logado" class="painel-admin login-admin login-admin--embutido">
        <div class="marca-loja marca-loja--central">
          <span class="marca-loja__icone">
            <img src="/img/logo.jpeg" alt="" aria-hidden="true">
          </span>
          <div>
            <strong>Painel AgroPet Fazendinha</strong>
            <span>Acesso restrito</span>
          </div>
        </div>

        <form class="formulario-admin" @submit.prevent="entrar">
          <label>
            Senha
            <input v-model="senha" type="password" autocomplete="current-password" required>
          </label>
          <p v-if="erroLogin" class="erro-formulario">{{ erroLogin }}</p>
          <button class="botao-admin" type="submit">Entrar</button>
        </form>
      </section>

      <section class="admin-menu">
        <a class="atalho-admin" href="/admin/produtos" @click.prevent="abrirArea('/admin/produtos')">
          <Package :size="26" aria-hidden="true" />
          <strong>Produtos</strong>
          <span>Cadastrar, editar e inativar produtos.</span>
        </a>

        <a class="atalho-admin" href="/admin/pedidos" @click.prevent="abrirArea('/admin/pedidos')">
          <ClipboardList :size="26" aria-hidden="true" />
          <strong>Pedidos</strong>
          <span>Acompanhar pedidos e alterar status.</span>
        </a>
      </section>
    </div>
  </main>
</template>
