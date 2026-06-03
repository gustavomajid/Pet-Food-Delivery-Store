<script setup lang="ts">
import { Minus, Plus, ShoppingBasket, Trash2, X } from '@lucide/vue'

const {
  itens,
  aberto,
  quantidadeItens,
  subtotalCentavos,
  taxaEntregaCentavos,
  descontoCentavos,
  totalCentavos,
  aumentar,
  diminuir,
  remover
} = useCarrinho()
const { formatarCentavos } = useDinheiro()
</script>

<template>
  <Teleport to="body">
    <div v-if="aberto" class="fundo-carrinho" @click.self="aberto = false">
      <aside class="painel-carrinho" aria-label="Carrinho">
        <header class="painel-carrinho__cabecalho">
          <div>
            <span>Carrinho</span>
            <strong>{{ quantidadeItens }} itens</strong>
          </div>
          <button class="botao-icone" type="button" aria-label="Fechar carrinho" @click="aberto = false">
            <X :size="20" aria-hidden="true" />
          </button>
        </header>

        <div v-if="itens.length === 0" class="carrinho-vazio">
          <ShoppingBasket :size="28" aria-hidden="true" />
          <span>Carrinho vazio</span>
        </div>

        <div v-else class="conteudo-carrinho">
          <ul class="lista-carrinho">
            <li v-for="item in itens" :key="item.produtoId">
              <img :src="item.imagemUrl" :alt="item.nome">

              <div class="item-carrinho__info">
                <strong>{{ item.nome }}</strong>
                <span>{{ item.marca }} - {{ formatarCentavos(item.precoCentavos) }}</span>

                <div class="controle-quantidade">
                  <button type="button" aria-label="Diminuir" @click="diminuir(item.produtoId)">
                    <Minus :size="16" aria-hidden="true" />
                  </button>
                  <span>{{ item.quantidade }}</span>
                  <button type="button" aria-label="Aumentar" @click="aumentar(item.produtoId)">
                    <Plus :size="16" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <button class="botao-remover" type="button" aria-label="Remover" @click="remover(item.produtoId)">
                <Trash2 :size="17" aria-hidden="true" />
              </button>
            </li>
          </ul>

          <section class="totais-carrinho" aria-label="Totais">
            <div>
              <span>Subtotal</span>
              <strong>{{ formatarCentavos(subtotalCentavos) }}</strong>
            </div>
            <div>
              <span>Entrega</span>
              <strong>{{ formatarCentavos(taxaEntregaCentavos) }}</strong>
            </div>
            <div>
              <span>Desconto</span>
              <strong>{{ formatarCentavos(descontoCentavos) }}</strong>
            </div>
            <div class="totais-carrinho__total">
              <span>Total</span>
              <strong>{{ formatarCentavos(totalCentavos) }}</strong>
            </div>
          </section>

          <FormularioPedido @concluido="aberto = false" />
        </div>
      </aside>
    </div>
  </Teleport>
</template>
