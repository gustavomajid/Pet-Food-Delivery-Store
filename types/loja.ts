export type Categoria = {
  id: number
  nome: string
  descricao: string | null
  ativo: boolean
}

export type Produto = {
  id: number
  nome: string
  descricao: string
  categoriaId: number
  categoriaNome: string
  marca: string
  precoCentavos: number
  estoque: number
  peso: string
  imagemUrl: string
  destaque: boolean
  promocao: boolean
  ativo: boolean
}

export type ItemCarrinho = {
  produtoId: number
  nome: string
  marca: string
  precoCentavos: number
  imagemUrl: string
  quantidade: number
  estoque: number
}

export type TipoEntrega = 'retirada' | 'entrega_local' | 'agendada'

export type FormaPagamento = 'pix' | 'dinheiro' | 'cartao_entrega'

export type StatusPedido =
  | 'novo'
  | 'confirmado'
  | 'em_separacao'
  | 'saiu_para_entrega'
  | 'pronto_para_retirada'
  | 'finalizado'
  | 'cancelado'

export type PedidoPayload = {
  nomeCliente: string
  telefoneCliente: string
  enderecoEntrega: string
  tipoEntrega: TipoEntrega
  formaPagamento: FormaPagamento
  observacoes?: string
  itens: Array<{
    produtoId: number
    quantidade: number
  }>
}

export type PedidoResumo = {
  id: string
  nomeCliente: string
  telefoneCliente: string
  enderecoEntrega: string
  tipoEntrega: TipoEntrega
  formaPagamento: FormaPagamento
  status: StatusPedido
  subtotalCentavos: number
  taxaEntregaCentavos: number
  descontoCentavos: number
  totalCentavos: number
  observacoes: string | null
  criadoEm: string
  itens?: ItemPedidoResumo[]
}

export type ItemPedidoResumo = {
  id: number
  pedidoId: string
  produtoId: number
  nomeProduto: string
  quantidade: number
  precoUnitarioCentavos: number
  subtotalCentavos: number
}

export type ClienteReconhecido = {
  telefoneCliente: string
  telefoneNormalizado: string
  nomeCliente?: string
  cep?: string
  enderecoEntrega?: string
  tipoEntrega?: TipoEntrega
  atualizadoEm: string
}
