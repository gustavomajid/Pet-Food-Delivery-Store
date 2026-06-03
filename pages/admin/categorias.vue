<script setup lang="ts">
import { FolderPlus, Save, Trash2 } from '@lucide/vue'
import type { Categoria } from '~/types/loja'

type CategoriaFormulario = {
  id: number | null
  nome: string
  descricao: string
  ativo: boolean
}

const erroAdmin = ref('')
const salvandoCategoria = ref(false)

const categoriaVazia = (): CategoriaFormulario => ({
  id: null,
  nome: '',
  descricao: '',
  ativo: true
})

const formulario = reactive<CategoriaFormulario>(categoriaVazia())

const {
  data: dadosCategorias,
  refresh: recarregarCategorias
} = await useFetch<{ categorias: Categoria[] }>('/api/admin/categorias', {
  default: () => ({ categorias: [] }),
  immediate: false,
  credentials: 'include'
})

const categorias = computed(() => dadosCategorias.value?.categorias ?? [])
const totalAtivas = computed(() => categorias.value.filter((categoria) => categoria.ativo).length)

async function carregarCategorias() {
  erroAdmin.value = ''

  try {
    await recarregarCategorias()
  } catch {
    erroAdmin.value = 'Nao foi possivel carregar as categorias.'
  }
}

function novaCategoria() {
  Object.assign(formulario, categoriaVazia())
}

function editarCategoria(categoria: Categoria) {
  Object.assign(formulario, {
    id: categoria.id,
    nome: categoria.nome,
    descricao: categoria.descricao || '',
    ativo: categoria.ativo
  })
}

async function salvarCategoria() {
  salvandoCategoria.value = true
  erroAdmin.value = ''

  const corpo = {
    nome: formulario.nome,
    descricao: formulario.descricao,
    ativo: formulario.ativo
  }

  try {
    if (formulario.id) {
      await $fetch(`/api/admin/categorias/${formulario.id}`, {
        method: 'PUT',
        credentials: 'include',
        body: corpo
      })
    } else {
      await $fetch('/api/admin/categorias', {
        method: 'POST',
        credentials: 'include',
        body: corpo
      })
    }

    novaCategoria()
    await recarregarCategorias()
  } catch (error) {
    erroAdmin.value =
      error instanceof Error ? error.message : 'Nao foi possivel salvar a categoria.'
  } finally {
    salvandoCategoria.value = false
  }
}

async function alternarStatus(categoria: Categoria, ativo: boolean) {
  await $fetch(`/api/admin/categorias/${categoria.id}`, {
    method: 'PUT',
    credentials: 'include',
    body: {
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      ativo
    }
  })

  await recarregarCategorias()
}

async function inativarCategoria(categoria: Categoria) {
  await $fetch(`/api/admin/categorias/${categoria.id}`, {
    method: 'DELETE',
    credentials: 'include'
  })

  if (formulario.id === categoria.id) {
    novaCategoria()
  }

  await recarregarCategorias()
}
</script>

<template>
  <AdminArea
    titulo="Categorias"
    subtitulo="Cadastro e organizacao do catalogo"
    @autenticado="carregarCategorias"
    @recarregar="carregarCategorias"
  >
    <p v-if="erroAdmin" class="erro-formulario">{{ erroAdmin }}</p>

    <section class="painel-admin">
      <div class="titulo-secao">
        <h1>Cadastro de categoria</h1>
        <button class="botao-admin botao-admin--secundario" type="button" @click="novaCategoria">
          <FolderPlus :size="17" aria-hidden="true" />
          Nova
        </button>
      </div>

      <form class="formulario-admin grade-formulario" @submit.prevent="salvarCategoria">
        <label>
          Nome
          <input v-model="formulario.nome" required>
        </label>

        <label class="campo-largo">
          Descricao
          <textarea v-model="formulario.descricao" rows="3" placeholder="Ex.: Racoes, petiscos, higiene..." />
        </label>

        <div class="opcoes-check campo-largo">
          <label>
            <input v-model="formulario.ativo" type="checkbox">
            Categoria ativa
          </label>
        </div>

        <button class="botao-admin campo-largo" type="submit" :disabled="salvandoCategoria">
          <Save :size="17" aria-hidden="true" />
          {{ salvandoCategoria ? 'Salvando...' : 'Salvar categoria' }}
        </button>
      </form>
    </section>

    <section class="painel-admin">
      <div class="titulo-secao">
        <h2>Categorias cadastradas</h2>
        <span>{{ totalAtivas }} ativas de {{ categorias.length }}</span>
      </div>

      <div class="tabela-admin">
        <table>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Descricao</th>
              <th scope="col">Status</th>
              <th scope="col">Acoes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="categoria in categorias" :key="categoria.id">
              <td data-label="Nome">
                <strong>{{ categoria.nome }}</strong>
              </td>
              <td data-label="Descricao">
                {{ categoria.descricao || 'Sem descricao' }}
              </td>
              <td data-label="Status">
                <span class="status-admin" :class="{ 'status-admin--inativo': !categoria.ativo }">
                  {{ categoria.ativo ? 'Ativa' : 'Inativa' }}
                </span>
              </td>
              <td data-label="Acoes">
                <div class="linha-admin__acoes">
                  <button class="botao-admin botao-admin--secundario" type="button" @click="editarCategoria(categoria)">
                    Editar
                  </button>
                  <button
                    v-if="!categoria.ativo"
                    class="botao-admin botao-admin--secundario"
                    type="button"
                    @click="alternarStatus(categoria, true)"
                  >
                    Reativar
                  </button>
                  <button
                    v-else
                    class="botao-icone botao-icone--perigo"
                    type="button"
                    aria-label="Inativar"
                    @click="inativarCategoria(categoria)"
                  >
                    <Trash2 :size="17" aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </AdminArea>
</template>
