<script setup lang="ts">
import { ClipboardList, Home, LogOut, Package, RefreshCcw, Truck } from '@lucide/vue'

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

const route = useRoute()

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

function linkRodapeAtivo(caminho: string) {
  if (caminho === '/admin') {
    return route.path === '/admin'
  }

  return route.path.startsWith(caminho)
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
          <strong>{{ titulo }}</strong>
          <span>{{ carregandoSessao ? 'Verificando acesso...' : autenticado ? subtitulo : 'Acesso restrito' }}</span>
        </div>
      </div>

      <nav class="acoes-topo" aria-label="Acoes do painel">
        <template v-if="autenticado">
          <a class="botao-admin botao-admin--secundario" href="/admin">Painel</a>
          <a class="botao-admin botao-admin--secundario" href="/admin/configuracoes">Configuracoes</a>
          <a class="botao-admin botao-admin--secundario" href="/admin/categorias">Categorias</a>
          <a class="botao-admin botao-admin--secundario" href="/admin/produtos">Produtos</a>
          <a class="botao-admin botao-admin--secundario" href="/admin/pedidos">Pedidos</a>
          <a class="botao-admin botao-admin--secundario" href="/entregador">Entregador</a>
        </template>
        <a class="botao-admin botao-admin--secundario" href="/">Loja</a>
        <button
          v-if="autenticado && mostrarRecarregar"
          class="botao-icone"
          type="button"
          aria-label="Recarregar"
          @click="emitir('recarregar')"
        >
          <RefreshCcw :size="18" aria-hidden="true" />
        </button>
        <button
          v-if="autenticado"
          class="botao-icone"
          type="button"
          aria-label="Sair"
          @click="sair"
        >
          <LogOut :size="18" aria-hidden="true" />
        </button>
      </nav>
    </header>

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

    <div v-else-if="autenticado" class="admin-corpo">
      <slot />
    </div>

    <nav class="rodape-app-fixo rodape-admin-fixo" aria-label="Navegacao fixa do painel">
      <NuxtLink
        class="botao-nav-inferior"
        :class="{ ativo: linkRodapeAtivo('/admin') }"
        to="/admin"
        :aria-current="linkRodapeAtivo('/admin') ? 'page' : undefined"
      >
        <Home :size="24" aria-hidden="true" />
        <span>Painel</span>
      </NuxtLink>

      <NuxtLink
        class="botao-nav-inferior"
        :class="{ ativo: linkRodapeAtivo('/admin/pedidos') }"
        to="/admin/pedidos"
        :aria-current="linkRodapeAtivo('/admin/pedidos') ? 'page' : undefined"
      >
        <ClipboardList :size="24" aria-hidden="true" />
        <span>Pedidos</span>
      </NuxtLink>

      <NuxtLink
        class="botao-nav-inferior"
        :class="{ ativo: linkRodapeAtivo('/admin/produtos') }"
        to="/admin/produtos"
        :aria-current="linkRodapeAtivo('/admin/produtos') ? 'page' : undefined"
      >
        <Package :size="24" aria-hidden="true" />
        <span>Produtos</span>
      </NuxtLink>

      <NuxtLink
        class="botao-nav-inferior"
        :class="{ ativo: linkRodapeAtivo('/entregador') }"
        to="/entregador"
        :aria-current="linkRodapeAtivo('/entregador') ? 'page' : undefined"
      >
        <Truck :size="24" aria-hidden="true" />
        <span>Entregador</span>
      </NuxtLink>
    </nav>
  </main>
</template>
