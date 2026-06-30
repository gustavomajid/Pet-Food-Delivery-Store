# AgroPet Fazendinha

Sistema simples de venda online mobile-first para uma fazendinha/loja de ração, feito com Nuxt, Drizzle ORM, Postgres e Docker.

## Padrao do projeto

- `server/banco`: esquema, conexão e semente do banco.
- `server/repositorios`: acesso a dados com Drizzle.
- `server/servicos`: regras de negócio, validação e cálculo de pedido.
- `server/api`: endpoints HTTP do Nuxt.
- `components` e `composables`: interface e estado do carrinho.

Rotas principais:

- `/`: catálogo público, busca, filtros, carrinho e finalização.
- `/admin`: painel simples para produtos e pedidos.

## Rodando localmente

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env`:

```bash
cp .env.example .env
```

3. Suba o Postgres:

```bash
docker compose up -d
```

O Postgres do Docker fica em `localhost:5434`, para evitar conflito com Postgres local na porta `5432`.
O `.env.example` ja aponta para esse banco; ao copiar o arquivo, o Nuxt e o Drizzle usam o PostgreSQL local automaticamente.

4. Crie as tabelas e insira produtos:

```bash
npm run db:push
npm run db:seed
```

5. Rode a aplicacao:

```bash
npm run dev
```

O painel administrativo usa a senha do `.env`:

```bash
ADMIN_SENHA=admin123
```

## Controle de estoque e integracao WMS

No cadastro de cada produto, escolha quem controla a quantidade disponivel:

- `Este sistema`: o saldo e informado e ajustado pelo painel administrativo.
- `WMS / API externa`: o saldo e atualizado pela integracao usando o codigo externo/SKU.

Em ambos os casos, um pedido baixa o saldo de forma atomica e um cancelamento devolve a
quantidade. Configure um token longo e secreto no `.env` para habilitar a API do WMS:

```bash
WMS_API_TOKEN=troque-por-um-token-longo-e-seguro
```

O WMS pode consultar todos os produtos sob seu controle:

```http
GET /api/integracoes/wms/estoque
Authorization: Bearer SEU_TOKEN
```

Para uma consulta incremental, use
`?atualizadoDesde=2026-06-21T00:00:00.000Z`. A atualizacao de saldo e absoluta e aceita
ate 500 itens por requisicao:

```http
PUT /api/integracoes/wms/estoque
Authorization: Bearer SEU_TOKEN
Content-Type: application/json

{
  "itens": [
    {
      "codigoExterno": "RACAO-15KG-001",
      "quantidadeDisponivel": 24
    }
  ]
}
```

A requisicao inteira falha com status `422` quando algum codigo nao existe ou o produto
nao esta marcado como controlado pelo WMS. Tambem e aceito o cabecalho `X-API-Key`.

## Scripts

- `npm run dev`: inicia o Nuxt em desenvolvimento.
- `npm run build`: gera build de producao.
- `npm run db:push`: aplica o schema Drizzle no Postgres.
- `npm run db:seed`: cadastra os produtos iniciais.
- `npm run db:studio`: abre o Drizzle Studio.
