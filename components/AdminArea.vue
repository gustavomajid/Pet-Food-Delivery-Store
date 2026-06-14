<script setup lang="ts">
import { LogOut, RefreshCcw } from '@lucide/vue'

withDefaults(
  defineProps<{
    titulo: string
    subtitulo: string
    mostrarRecarregar?: boolean
  }>(),
  {
    mostrarRecarregar: true
  }
)

const emitir = defineEmits<{
  autenticado: []
  recarregar: []
}>()

useHead({
  meta: [
    { name: 'robots', content: 'noindex,nofollow,noarchive' }
  ]
})

const carregandoSessao = ref(true)
const autenticado = ref(false)
const senha = ref('')
const erroLogin = ref('')

onMounted(async () => {
  try {
    await $fetch('/api/admin/eu', { credentials: 'include' })
    autenticado.value = true
    emitir('autenticado')
  } catch {
    autenticado.value = false
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

    senha.value = ''
    autenticado.value = true
    emitir('autenticado')
  } catch {
    erroLogin.value = 'Senha invalida.'
  }
}

async function sair() {
  await $fetch('/api/admin/sair', { method: 'POST', credentials: 'include' })
  await navigateTo('/admin')
}
</script>

<template>
  <main class="admin">
    <section v-if="carregandoSessao" class="painel-admin login-admin">
      <div class="marca-loja marca-loja--central">
        <span class="marca-loja__icone">
          <img src="/img/logo.jpeg" alt="" aria-hidden="true">
        </span>
        <div>
          <strong>{{ titulo }}</strong>
          <span>Verificando acesso...</span>
        </div>
      </div>
    </section>

    <section v-else-if="!autenticado" class="painel-admin login-admin">
      <div class="marca-loja marca-loja--central">
        <span class="marca-loja__icone">
          <img src="/img/logo.jpeg" alt="" aria-hidden="true">
        </span>
        <div>
          <strong>{{ titulo }}</strong>
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

    <template v-else>
      <header class="topo admin-topo">
        <div class="marca-loja">
          <span class="marca-loja__icone">
            <img src="/img/logo.jpeg" alt="" aria-hidden="true">
          </span>
          <div>
            <strong>{{ titulo }}</strong>
            <span>{{ subtitulo }}</span>
          </div>
        </div>

        <nav class="acoes-topo" aria-label="Acoes do painel">
          <a class="botao-admin botao-admin--secundario" href="/admin">Painel</a>
          <a class="botao-admin botao-admin--secundario" href="/admin/configuracoes">Configuracoes</a>
          <a class="botao-admin botao-admin--secundario" href="/admin/categorias">Categorias</a>
          <a class="botao-admin botao-admin--secundario" href="/admin/produtos">Produtos</a>
          <a class="botao-admin botao-admin--secundario" href="/admin/pedidos">Pedidos</a>
          <a class="botao-admin botao-admin--secundario" href="/">Loja</a>
          <button
            v-if="mostrarRecarregar"
            class="botao-icone"
            type="button"
            aria-label="Recarregar"
            @click="emitir('recarregar')"
          >
            <RefreshCcw :size="18" aria-hidden="true" />
          </button>
          <button class="botao-icone" type="button" aria-label="Sair" @click="sair">
            <LogOut :size="18" aria-hidden="true" />
          </button>
        </nav>
      </header>

      <div class="admin-corpo">
        <slot />
      </div>
    </template>
  </main>
</template>
