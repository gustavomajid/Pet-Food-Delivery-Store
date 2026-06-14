<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Search,
  ShoppingBasket,
  Truck,
  X,
} from '@lucide/vue'
import type { Categoria, ConfiguracoesLoja, Produto, ProdutosPaginados } from '~/types/loja'

type TipoRedeSocial = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok'

const config = useRuntimeConfig()
const ITENS_POR_PAGINA = 12
const busca = ref('')
const buscaAplicada = ref('')
const categoriaAtual = ref(0)
const marca = ref('')
const marcaAplicada = ref('')
const paginaAtual = ref(1)
let temporizadorBusca: ReturnType<typeof setTimeout> | undefined
const redesSociais = computed<Array<{ nome: string; href: string; icone: TipoRedeSocial }>>(() => [
  { nome: 'WhatsApp', href: config.public.socialLinks.whatsapp, icone: 'whatsapp' },
  { nome: 'Instagram', href: config.public.socialLinks.instagram, icone: 'instagram' },
  { nome: 'Facebook', href: config.public.socialLinks.facebook, icone: 'facebook' },
  { nome: 'TikTok', href: config.public.socialLinks.tiktok, icone: 'tiktok' }
])

const consultaProdutos = computed(() => ({
  busca: buscaAplicada.value || undefined,
  marca: marcaAplicada.value || undefined,
  categoriaId: categoriaAtual.value || undefined,
  pagina: paginaAtual.value,
  porPagina: ITENS_POR_PAGINA
}))

const { data: dadosCategorias } = await useFetch<{ categorias: Categoria[] }>(
  '/api/categorias',
  { default: () => ({ categorias: [] }) }
)

const { data: dadosConfiguracoes } = await useFetch<{ configuracoes: ConfiguracoesLoja }>(
  '/api/configuracoes',
  { default: () => ({ configuracoes: { modalIdentificacaoAtivo: true } }) }
)

const {
  data: dadosProdutos,
  pending,
  error,
  refresh
} = await useFetch<ProdutosPaginados>('/api/produtos', {
  query: consultaProdutos,
  default: () => ({
    produtos: [],
    paginacao: {
      pagina: 1,
      porPagina: ITENS_POR_PAGINA,
      total: 0,
      totalPaginas: 0
    }
  })
})

const categorias = computed(() => dadosCategorias.value?.categorias ?? [])
const produtos = computed(() => dadosProdutos.value?.produtos ?? [])
const paginacao = computed(() => dadosProdutos.value?.paginacao ?? {
  pagina: 1,
  porPagina: ITENS_POR_PAGINA,
  total: 0,
  totalPaginas: 0
})
const destaques = computed(() => produtos.value.filter((produto) => produto.destaque))
const filtrosAtivos = computed(() =>
  Boolean(busca.value.trim() || marca.value.trim() || categoriaAtual.value)
)
const totalProdutosTexto = computed(() => {
  if (paginacao.value.total === 1) {
    return '1 produto'
  }

  return `${paginacao.value.total} produtos`
})
const intervaloProdutosTexto = computed(() => {
  if (paginacao.value.total === 0) {
    return ''
  }

  const inicio = (paginacao.value.pagina - 1) * paginacao.value.porPagina + 1
  const fim = Math.min(
    paginacao.value.pagina * paginacao.value.porPagina,
    paginacao.value.total
  )

  return `${inicio}-${fim} de ${paginacao.value.total}`
})
const paginasVisiveis = computed(() => {
  const totalPaginas = paginacao.value.totalPaginas
  const pagina = paginacao.value.pagina

  if (totalPaginas <= 1) {
    return []
  }

  const inicio = Math.max(1, pagina - 2)
  const fim = Math.min(totalPaginas, inicio + 4)
  const inicioAjustado = Math.max(1, fim - 4)

  return Array.from({ length: fim - inicioAjustado + 1 }, (_, indice) => inicioAjustado + indice)
})

const { quantidadeItens, subtotalCentavos, adicionarProduto, aberto } = useCarrinho()
const { formatarCentavos } = useDinheiro()
const { abrirModalIdentificacao, clienteAtual } = useClienteReconhecimento()
const {
  ultimoPedidoId,
  carregarHistoricoLocal,
  obterHistoricoPorTelefone,
  obterPedidoAtivoPorTelefone,
  recarregarPedido
} = useHistoricoPedidos()
const modalIdentificacaoSolicitado = ref(false)
const pedidoAcompanhamentoId = computed(() => {
  const telefoneCliente = clienteAtual.value?.telefoneCliente

  if (!telefoneCliente) {
    return ultimoPedidoId.value
  }

  return obterHistoricoPorTelefone(telefoneCliente)[0]?.id || ''
})

function aplicarBuscaTexto() {
  buscaAplicada.value = busca.value.trim()
  marcaAplicada.value = marca.value.trim()
  paginaAtual.value = 1
}

function selecionarCategoria(categoriaId: number) {
  categoriaAtual.value = categoriaId
  paginaAtual.value = 1
}

function limparFiltros() {
  if (temporizadorBusca) {
    clearTimeout(temporizadorBusca)
  }

  busca.value = ''
  buscaAplicada.value = ''
  marca.value = ''
  marcaAplicada.value = ''
  categoriaAtual.value = 0
  paginaAtual.value = 1
}

function irParaPagina(pagina: number) {
  if (pagina < 1 || pagina > paginacao.value.totalPaginas || pagina === paginaAtual.value) {
    return
  }

  paginaAtual.value = pagina
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function adicionarProdutoAoCarrinho(produto: Produto) {
  const pedidoAtivo = obterPedidoAtivoPorTelefone(clienteAtual.value?.telefoneCliente)

  if (pedidoAtivo) {
    aberto.value = true
    void recarregarPedido(pedidoAtivo.id)
    return
  }

  adicionarProduto(produto)
}

function abrirIdentificacaoSeAtivo() {
  if (modalIdentificacaoSolicitado.value) {
    return
  }

  if (dadosConfiguracoes.value?.configuracoes.modalIdentificacaoAtivo !== false) {
    modalIdentificacaoSolicitado.value = true
    abrirModalIdentificacao()
  }
}

onMounted(abrirIdentificacaoSeAtivo)
onMounted(carregarHistoricoLocal)
onBeforeUnmount(() => {
  if (temporizadorBusca) {
    clearTimeout(temporizadorBusca)
  }
})
watch([busca, marca], () => {
  if (temporizadorBusca) {
    clearTimeout(temporizadorBusca)
  }

  temporizadorBusca = setTimeout(aplicarBuscaTexto, 350)
})
watch(() => paginacao.value.pagina, (paginaRecebida) => {
  if (paginaRecebida && paginaRecebida !== paginaAtual.value) {
    paginaAtual.value = paginaRecebida
  }
})
watch(dadosConfiguracoes, abrirIdentificacaoSeAtivo, { deep: true })
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
        <NuxtLink
          v-if="pedidoAcompanhamentoId"
          class="botao-icone"
          :to="`/pedido/${pedidoAcompanhamentoId}`"
          aria-label="Acompanhar pedido"
        >
          <ClipboardList :size="19" aria-hidden="true" />
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
          <input v-model="busca" type="search" placeholder="Buscar por produto, marca ou categoria">
        </label>

        <button
          v-if="filtrosAtivos"
          class="botao-limpar-filtros"
          type="button"
          @click="limparFiltros"
        >
          <X :size="17" aria-hidden="true" />
          Limpar
        </button>

        <nav class="abas-categorias" aria-label="Categorias">
          <button
            type="button"
            :class="{ ativo: categoriaAtual === 0 }"
            @click="selecionarCategoria(0)"
          >
            Todos
          </button>
          <button
            v-for="categoria in categorias"
            :key="categoria.id"
            type="button"
            :class="{ ativo: categoriaAtual === categoria.id }"
            @click="selecionarCategoria(categoria.id)"
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
            @adicionar="adicionarProdutoAoCarrinho"
          />
        </div>
      </section>

      <div class="titulo-secao">
        <h2>Catálogo</h2>
        <span>{{ totalProdutosTexto }}</span>
      </div>

      <div v-if="error" class="painel-estado">
        <strong>Banco de dados indisponível</strong>
        <span>Suba o Postgres com Docker e rode o Drizzle.</span>
        <button type="button" @click="refresh()">Tentar novamente</button>
      </div>

      <div v-else-if="pending" class="grade-produtos" aria-live="polite">
        <article v-for="item in ITENS_POR_PAGINA" :key="item" class="cartao-produto esqueleto" />
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
          @adicionar="adicionarProdutoAoCarrinho"
        />
      </div>

      <footer
        v-if="!pending && !error && paginacao.totalPaginas > 1"
        class="rodape-paginacao-produtos"
      >
        <button
          class="botao-pagina botao-pagina--navegacao"
          type="button"
          :disabled="paginacao.pagina <= 1"
          @click="irParaPagina(paginacao.pagina - 1)"
        >
          <ChevronLeft :size="17" aria-hidden="true" />
          Anterior
        </button>

        <nav class="paginacao-produtos" aria-label="Paginacao de produtos">
          <button
            v-for="pagina in paginasVisiveis"
            :key="pagina"
            class="botao-pagina"
            type="button"
            :class="{ ativo: pagina === paginacao.pagina }"
            :aria-current="pagina === paginacao.pagina ? 'page' : undefined"
            :aria-label="`Pagina ${pagina}`"
            @click="irParaPagina(pagina)"
          >
            {{ pagina }}
          </button>
        </nav>

        <button
          class="botao-pagina botao-pagina--navegacao"
          type="button"
          :disabled="paginacao.pagina >= paginacao.totalPaginas"
          @click="irParaPagina(paginacao.pagina + 1)"
        >
          Proxima
          <ChevronRight :size="17" aria-hidden="true" />
        </button>

        <span>{{ intervaloProdutosTexto }}</span>
      </footer>
    </section>

    <footer class="rodape-site">
      <div class="rodape-site__marca">
        <strong>{{ config.public.storeName }}</strong>
        <span>Redes sociais da Fazendinha</span>
      </div>

      <nav class="rodape-social" aria-label="Redes sociais da Fazendinha">
        <a
          v-for="rede in redesSociais"
          :key="rede.nome"
          :href="rede.href"
          @click="rede.href === '#' && $event.preventDefault()"
        >
          <IconeRedeSocial :tipo="rede.icone" :tamanho="19" />
          <span>{{ rede.nome }}</span>
        </a>
      </nav>
    </footer>

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
