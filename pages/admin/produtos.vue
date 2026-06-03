<script setup lang="ts">
import { PackagePlus, Save, Trash2 } from '@lucide/vue'
import type { Categoria, Produto } from '~/types/loja'

type ProdutoFormulario = {
  id: number | null
  nome: string
  descricao: string
  categoriaId: number
  marca: string
  preco: string
  estoque: number
  peso: string
  imagemUrl: string
  destaque: boolean
  promocao: boolean
  ativo: boolean
}

const { formatarCentavos, reaisParaCentavos, centavosParaReais } = useDinheiro()

const erroAdmin = ref('')
const salvandoProduto = ref(false)

const produtoVazio = (): ProdutoFormulario => ({
  id: null,
  nome: '',
  descricao: '',
  categoriaId: 0,
  marca: '',
  preco: '',
  estoque: 0,
  peso: '',
  imagemUrl: '',
  destaque: false,
  promocao: false,
  ativo: true
})

const formulario = reactive<ProdutoFormulario>(produtoVazio())

const {
  data: dadosCategorias,
  refresh: recarregarCategorias
} = await useFetch<{ categorias: Categoria[] }>('/api/admin/categorias', {
  default: () => ({ categorias: [] }),
  immediate: false,
  credentials: 'include'
})

const {
  data: dadosProdutos,
  refresh: recarregarProdutos
} = await useFetch<{ produtos: Produto[] }>('/api/admin/produtos', {
  default: () => ({ produtos: [] }),
  immediate: false,
  credentials: 'include'
})

const categorias = computed(() => dadosCategorias.value?.categorias ?? [])
const produtos = computed(() => dadosProdutos.value?.produtos ?? [])

async function carregarProdutos() {
  erroAdmin.value = ''

  try {
    await Promise.all([recarregarCategorias(), recarregarProdutos()])
    if (!formulario.categoriaId) {
      formulario.categoriaId = categorias.value[0]?.id ?? 0
    }
  } catch {
    erroAdmin.value = 'Nao foi possivel carregar os produtos.'
  }
}

function novoProduto() {
  Object.assign(formulario, produtoVazio())
  formulario.categoriaId = categorias.value[0]?.id ?? 0
}

function editarProduto(produto: Produto) {
  Object.assign(formulario, {
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao,
    categoriaId: produto.categoriaId,
    marca: produto.marca,
    preco: centavosParaReais(produto.precoCentavos),
    estoque: produto.estoque,
    peso: produto.peso,
    imagemUrl: produto.imagemUrl,
    destaque: produto.destaque,
    promocao: produto.promocao,
    ativo: produto.ativo
  })
}

async function salvarProduto() {
  salvandoProduto.value = true
  erroAdmin.value = ''

  const corpo = {
    nome: formulario.nome,
    descricao: formulario.descricao,
    categoriaId: Number(formulario.categoriaId),
    marca: formulario.marca,
    precoCentavos: reaisParaCentavos(formulario.preco),
    estoque: Number(formulario.estoque),
    peso: formulario.peso,
    imagemUrl: formulario.imagemUrl,
    destaque: formulario.destaque,
    promocao: formulario.promocao,
    ativo: formulario.ativo
  }

  try {
    if (formulario.id) {
      await $fetch(`/api/admin/produtos/${formulario.id}`, {
        method: 'PUT',
        credentials: 'include',
        body: corpo
      })
    } else {
      await $fetch('/api/admin/produtos', {
        method: 'POST',
        credentials: 'include',
        body: corpo
      })
    }

    novoProduto()
    await recarregarProdutos()
  } catch (error) {
    erroAdmin.value =
      error instanceof Error ? error.message : 'Nao foi possivel salvar o produto.'
  } finally {
    salvandoProduto.value = false
  }
}

async function inativarProduto(produto: Produto) {
  await $fetch(`/api/admin/produtos/${produto.id}`, {
    method: 'DELETE',
    credentials: 'include'
  })
  await recarregarProdutos()
}
</script>

<template>
  <AdminArea
    titulo="Produtos"
    subtitulo="Cadastro e estoque"
    @autenticado="carregarProdutos"
    @recarregar="carregarProdutos"
  >
    <p v-if="erroAdmin" class="erro-formulario">{{ erroAdmin }}</p>

    <section class="painel-admin">
      <div class="titulo-secao">
        <h1>Cadastro de produto</h1>
        <button class="botao-admin botao-admin--secundario" type="button" @click="novoProduto">
          <PackagePlus :size="17" aria-hidden="true" />
          Novo
        </button>
      </div>

      <form class="formulario-admin grade-formulario" @submit.prevent="salvarProduto">
        <label>
          Nome
          <input v-model="formulario.nome" required>
        </label>

        <label>
          Categoria
          <select v-model.number="formulario.categoriaId" required>
            <option value="0" disabled>Selecione</option>
            <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
              {{ categoria.nome }}{{ categoria.ativo ? '' : ' (inativa)' }}
            </option>
          </select>
        </label>

        <label>
          Marca
          <input v-model="formulario.marca" required>
        </label>

        <label>
          Preco
          <input v-model="formulario.preco" inputmode="decimal" placeholder="169,90" required>
        </label>

        <label>
          Estoque
          <input v-model.number="formulario.estoque" type="number" min="0" required>
        </label>

        <label>
          Peso
          <input v-model="formulario.peso" placeholder="15kg" required>
        </label>

        <label class="campo-largo">
          Imagem URL
          <input v-model="formulario.imagemUrl" type="url" required>
        </label>

        <label class="campo-largo">
          Descricao
          <textarea v-model="formulario.descricao" rows="3" required />
        </label>

        <div class="opcoes-check">
          <label>
            <input v-model="formulario.destaque" type="checkbox">
            Destaque
          </label>
          <label>
            <input v-model="formulario.promocao" type="checkbox">
            Promocao
          </label>
          <label>
            <input v-model="formulario.ativo" type="checkbox">
            Ativo
          </label>
        </div>

        <button class="botao-admin campo-largo" type="submit" :disabled="salvandoProduto">
          <Save :size="17" aria-hidden="true" />
          {{ salvandoProduto ? 'Salvando...' : 'Salvar produto' }}
        </button>
      </form>
    </section>

    <section class="painel-admin">
      <div class="titulo-secao">
        <h2>Produtos cadastrados</h2>
        <span>{{ produtos.length }}</span>
      </div>

      <div class="lista-admin">
        <article v-for="produto in produtos" :key="produto.id" class="linha-admin">
          <img :src="produto.imagemUrl" :alt="produto.nome">
          <div>
            <strong>{{ produto.nome }}</strong>
            <span>{{ produto.marca }} - {{ produto.categoriaNome }}</span>
            <span>{{ formatarCentavos(produto.precoCentavos) }} - estoque {{ produto.estoque }}</span>
          </div>
          <div class="linha-admin__acoes">
            <button class="botao-admin botao-admin--secundario" type="button" @click="editarProduto(produto)">
              Editar
            </button>
            <button class="botao-icone botao-icone--perigo" type="button" aria-label="Inativar" @click="inativarProduto(produto)">
              <Trash2 :size="17" aria-hidden="true" />
            </button>
          </div>
        </article>
      </div>
    </section>
  </AdminArea>
</template>
