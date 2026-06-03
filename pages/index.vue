<script setup lang="ts">
import { Search, Settings, ShoppingBasket, Truck } from '@lucide/vue'
import type { Categoria, Produto } from '~/types/loja'

const config = useRuntimeConfig()
const busca = ref('')
const categoriaAtual = ref(0)
const marca = ref('')

const consultaProdutos = computed(() => ({
  busca: busca.value || undefined,
  marca: marca.value || undefined,
  categoriaId: categoriaAtual.value || undefined
}))

const { data: dadosCategorias } = await useFetch<{ categorias: Categoria[] }>(
  '/api/categorias',
  { default: () => ({ categorias: [] }) }
)

const {
  data: dadosProdutos,
  pending,
  error,
  refresh
} = await useFetch<{ produtos: Produto[] }>('/api/produtos', {
  query: consultaProdutos,
  default: () => ({ produtos: [] })
})

const categorias = computed(() => dadosCategorias.value?.categorias ?? [])
const produtos = computed(() => dadosProdutos.value?.produtos ?? [])
const destaques = computed(() => produtos.value.filter((produto) => produto.destaque))

const { quantidadeItens, subtotalCentavos, adicionarProduto, aberto } = useCarrinho()
const { formatarCentavos } = useDinheiro()
const { abrirModalIdentificacao } = useClienteReconhecimento()

onMounted(() => {
  abrirModalIdentificacao()
})
</script>

<template>
  <main class="app">
    <header class="topo">
      <div class="marca-loja">
        <span class="marca-loja__icone">
          <img src="/img/logo.jpeg" alt="" aria-hidden="true">
        </span>
        <div>
          <strong>{{ config.public.storeName }}</strong>
          <span>Rações e agropecuária</span>
        </div>
      </div>

      <nav class="acoes-topo" aria-label="Ações">
        <NuxtLink class="botao-icone" to="/admin" aria-label="Painel administrativo">
          <Settings :size="19" aria-hidden="true" />
        </NuxtLink>
        <button class="botao-carrinho" type="button" aria-label="Abrir carrinho" @click="aberto = true">
          <ShoppingBasket :size="20" aria-hidden="true" />
          <span>{{ quantidadeItens }}</span>
        </button>
      </nav>
    </header>

    <section class="catalogo">
      <div class="chamada">
        <div>
          <p>Pedido online</p>
        </div>
        <span class="selo-entrega">
          <Truck :size="17" aria-hidden="true" />
          Entrega local
        </span>
      </div>

      <div class="busca-filtros">
        <label class="campo-busca">
          <Search :size="18" aria-hidden="true" />
          <input v-model="busca" type="search" placeholder="Buscar produto">
        </label>

        <label class="campo-texto">
          Marca
          <input v-model="marca" type="search" placeholder="Golden, Premier...">
        </label>

        <nav class="abas-categorias" aria-label="Categorias">
          <button
            type="button"
            :class="{ ativo: categoriaAtual === 0 }"
            @click="categoriaAtual = 0"
          >
            Todos
          </button>
          <button
            v-for="categoria in categorias"
            :key="categoria.id"
            type="button"
            :class="{ ativo: categoriaAtual === categoria.id }"
            @click="categoriaAtual = categoria.id"
          >
            {{ categoria.nome }}
          </button>
        </nav>
      </div>

      <section v-if="destaques.length > 0" class="faixa-destaques">
        <div class="titulo-secao">
          <h2>Destaques</h2>
          <span>{{ destaques.length }} produtos</span>
        </div>
        <div class="grade-produtos">
          <CartaoProduto
            v-for="produto in destaques"
            :key="`destaque-${produto.id}`"
            :produto="produto"
            @adicionar="adicionarProduto"
          />
        </div>
      </section>

      <div class="titulo-secao">
        <h2>Catálogo</h2>
        <span>{{ produtos.length }} produtos</span>
      </div>

      <div v-if="error" class="painel-estado">
        <strong>Banco de dados indisponível</strong>
        <span>Suba o Postgres com Docker e rode o Drizzle.</span>
        <button type="button" @click="refresh()">Tentar novamente</button>
      </div>

      <div v-else-if="pending" class="grade-produtos" aria-live="polite">
        <article v-for="item in 6" :key="item" class="cartao-produto esqueleto" />
      </div>

      <div v-else-if="produtos.length === 0" class="painel-estado">
        <strong>Nenhum produto encontrado</strong>
        <span>Ajuste a busca ou escolha outra categoria.</span>
      </div>

      <div v-else class="grade-produtos">
        <CartaoProduto
          v-for="produto in produtos"
          :key="produto.id"
          :produto="produto"
          @adicionar="adicionarProduto"
        />
      </div>
    </section>

    <button
      v-if="quantidadeItens > 0"
      class="barra-carrinho"
      type="button"
      @click="aberto = true"
    >
      <span>{{ quantidadeItens }} itens</span>
      <strong>{{ formatarCentavos(subtotalCentavos) }}</strong>
    </button>

    <PainelCarrinho />
    <ModalIdentificacaoCliente />
  </main>
</template>
