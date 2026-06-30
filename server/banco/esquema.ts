import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'

export const tipoEntregaEnum = pgEnum('tipo_entrega', [
  'retirada',
  'entrega_local',
  'agendada'
])

export const formaPagamentoEnum = pgEnum('forma_pagamento', [
  'pix',
  'dinheiro',
  'cartao_entrega'
])

export const statusPedidoEnum = pgEnum('status_pedido', [
  'novo',
  'confirmado',
  'em_separacao',
  'saiu_para_entrega',
  'pronto_para_retirada',
  'finalizado',
  'cancelado'
])

export const fonteEstoqueEnum = pgEnum('fonte_estoque', [
  'sistema',
  'wms'
])

export const origemMovimentacaoEstoqueEnum = pgEnum('origem_movimentacao_estoque', [
  'cadastro',
  'ajuste_admin',
  'pedido',
  'cancelamento',
  'wms'
])

export const categorias = pgTable('categorias', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 120 }).notNull().unique(),
  descricao: text('descricao'),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow()
})

export const configuracoesLoja = pgTable('configuracoes_loja', {
  id: integer('id').primaryKey(),
  modalIdentificacaoAtivo: boolean('modal_identificacao_ativo').notNull().default(true),
  aceitarPedidosAutomaticamente: boolean('aceitar_pedidos_automaticamente').notNull().default(false),
  modoFuncionamentoOnline: varchar('modo_funcionamento_online', { length: 20 })
    .notNull()
    .default('automatico'),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow()
})

export const produtos = pgTable('produtos', {
  id: serial('id').primaryKey(),
  nome: varchar('nome', { length: 160 }).notNull(),
  descricao: text('descricao').notNull(),
  categoriaId: integer('categoria_id')
    .notNull()
    .references(() => categorias.id),
  marca: varchar('marca', { length: 120 }).notNull(),
  precoCentavos: integer('preco_centavos').notNull(),
  estoque: integer('estoque').notNull().default(0),
  fonteEstoque: fonteEstoqueEnum('fonte_estoque').notNull().default('sistema'),
  codigoExterno: varchar('codigo_externo', { length: 120 }).unique(),
  estoqueAtualizadoEm: timestamp('estoque_atualizado_em', { withTimezone: true })
    .notNull()
    .defaultNow(),
  peso: varchar('peso', { length: 60 }).notNull(),
  imagemUrl: text('imagem_url').notNull(),
  destaque: boolean('destaque').notNull().default(false),
  promocao: boolean('promocao').notNull().default(false),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow()
})

export const pedidos = pgTable('pedidos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nomeCliente: varchar('nome_cliente', { length: 160 }).notNull(),
  telefoneCliente: varchar('telefone_cliente', { length: 40 }).notNull(),
  enderecoEntrega: text('endereco_entrega').notNull(),
  tipoEntrega: tipoEntregaEnum('tipo_entrega').notNull(),
  formaPagamento: formaPagamentoEnum('forma_pagamento').notNull(),
  status: statusPedidoEnum('status').notNull().default('novo'),
  subtotalCentavos: integer('subtotal_centavos').notNull(),
  taxaEntregaCentavos: integer('taxa_entrega_centavos').notNull(),
  descontoCentavos: integer('desconto_centavos').notNull().default(0),
  totalCentavos: integer('total_centavos').notNull(),
  observacoes: text('observacoes'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow()
})

export const itensPedido = pgTable('itens_pedido', {
  id: serial('id').primaryKey(),
  pedidoId: uuid('pedido_id')
    .notNull()
    .references(() => pedidos.id, { onDelete: 'cascade' }),
  produtoId: integer('produto_id')
    .notNull()
    .references(() => produtos.id),
  nomeProduto: varchar('nome_produto', { length: 160 }).notNull(),
  quantidade: integer('quantidade').notNull(),
  precoUnitarioCentavos: integer('preco_unitario_centavos').notNull(),
  subtotalCentavos: integer('subtotal_centavos').notNull()
})

export const movimentacoesEstoque = pgTable('movimentacoes_estoque', {
  id: serial('id').primaryKey(),
  produtoId: integer('produto_id')
    .notNull()
    .references(() => produtos.id),
  quantidadeAnterior: integer('quantidade_anterior').notNull(),
  quantidadeNova: integer('quantidade_nova').notNull(),
  diferenca: integer('diferenca').notNull(),
  origem: origemMovimentacaoEstoqueEnum('origem').notNull(),
  referencia: varchar('referencia', { length: 160 }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow()
})
