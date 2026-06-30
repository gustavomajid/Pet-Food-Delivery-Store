import type { ItemCarrinho, Produto, TipoEntrega } from '~/types/loja'

const CHAVE_CARRINHO = 'fazendinha-carrinho-v1'
const TAXA_ENTREGA_CENTAVOS = 1200
const FRETE_GRATIS_A_PARTIR_DE = 25000

export function useCarrinho() {
  const itens = useState<ItemCarrinho[]>('itens-carrinho', () => [])
  const aberto = useState('carrinho-aberto', () => false)
  const carregado = useState('carrinho-carregado', () => false)
  const tipoEntrega = useState<TipoEntrega>('tipo-entrega', () => 'entrega_local')

  if (process.client && !carregado.value) {
    const salvo = window.localStorage.getItem(CHAVE_CARRINHO)

    if (salvo) {
      try {
        itens.value = JSON.parse(salvo)
      } catch {
        itens.value = []
      }
    }

    watch(
      itens,
      (valor) => window.localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(valor)),
      { deep: true }
    )

    carregado.value = true
  }

  const quantidadeItens = computed(() =>
    itens.value.reduce((total, item) => total + item.quantidade, 0)
  )

  const subtotalCentavos = computed(() =>
    itens.value.reduce((total, item) => total + item.precoCentavos * item.quantidade, 0)
  )

  const taxaEntregaCentavos = computed(() => {
    if (tipoEntrega.value === 'retirada' || subtotalCentavos.value === 0) {
      return 0
    }

    return subtotalCentavos.value >= FRETE_GRATIS_A_PARTIR_DE
      ? 0
      : TAXA_ENTREGA_CENTAVOS
  })

  const descontoCentavos = computed(() => 0)

  const totalCentavos = computed(
    () => subtotalCentavos.value + taxaEntregaCentavos.value - descontoCentavos.value
  )

  function adicionarProduto(produto: Produto) {
    const existente = itens.value.find((item) => item.produtoId === produto.id)

    if (existente) {
      existente.quantidade = Math.min(existente.quantidade + 1, produto.estoque)
    } else {
      itens.value.push({
        produtoId: produto.id,
        nome: produto.nome,
        marca: produto.marca,
        precoCentavos: produto.precoCentavos,
        imagemUrl: produto.imagemUrl,
        quantidade: 1,
        estoque: produto.estoque
      })
    }

    aberto.value = true
  }

  function aumentar(produtoId: number) {
    const item = itens.value.find((linha) => linha.produtoId === produtoId)

    if (item) {
      item.quantidade = Math.min(item.quantidade + 1, item.estoque)
    }
  }

  function diminuir(produtoId: number) {
    const item = itens.value.find((linha) => linha.produtoId === produtoId)

    if (!item) {
      return
    }

    if (item.quantidade <= 1) {
      remover(produtoId)
      return
    }

    item.quantidade -= 1
  }

  function remover(produtoId: number) {
    itens.value = itens.value.filter((item) => item.produtoId !== produtoId)
  }

  function limpar() {
    itens.value = []
  }

  function substituirItens(novosItens: ItemCarrinho[], novoTipoEntrega?: TipoEntrega) {
    itens.value = novosItens.map((item) => ({ ...item }))

    if (novoTipoEntrega) {
      tipoEntrega.value = novoTipoEntrega
    }

    aberto.value = itens.value.length > 0
  }

  return {
    itens,
    aberto,
    tipoEntrega,
    quantidadeItens,
    subtotalCentavos,
    taxaEntregaCentavos,
    descontoCentavos,
    totalCentavos,
    adicionarProduto,
    aumentar,
    diminuir,
    remover,
    limpar,
    substituirItens
  }
}
