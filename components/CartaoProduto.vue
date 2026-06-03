<script setup lang="ts">
import { BadgePercent, PackageCheck, Plus } from '@lucide/vue'
import type { Produto } from '~/types/loja'

const props = defineProps<{
  produto: Produto
}>()

const emitir = defineEmits<{
  adicionar: [produto: Produto]
}>()

const { formatarCentavos } = useDinheiro()
const semEstoque = computed(() => props.produto.estoque <= 0)
</script>

<template>
  <article class="cartao-produto">
    <div class="cartao-produto__imagem">
      <img :src="produto.imagemUrl" :alt="produto.nome" loading="lazy">
    </div>

    <div class="cartao-produto__conteudo">
      <div class="cartao-produto__topo">
        <span>{{ produto.categoriaNome }}</span>
        <span v-if="produto.promocao" class="selo-promocao">
          <BadgePercent :size="14" aria-hidden="true" />
          Oferta
        </span>
      </div>

      <h2>{{ produto.nome }}</h2>
      <p>{{ produto.descricao }}</p>

      <div class="cartao-produto__detalhes">
        <span>{{ produto.marca }}</span>
        <span>{{ produto.peso }}</span>
        <span>
          <PackageCheck :size="14" aria-hidden="true" />
          {{ produto.estoque }}
        </span>
      </div>

      <div class="cartao-produto__rodape">
        <strong>{{ formatarCentavos(produto.precoCentavos) }}</strong>

        <button
          class="botao-icone botao-icone--principal"
          type="button"
          :disabled="semEstoque"
          :aria-label="`Adicionar ${produto.nome}`"
          @click="emitir('adicionar', produto)"
        >
          <Plus :size="20" aria-hidden="true" />
        </button>
      </div>
    </div>
  </article>
</template>
