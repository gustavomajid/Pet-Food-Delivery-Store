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

## Scripts

- `npm run dev`: inicia o Nuxt em desenvolvimento.
- `npm run build`: gera build de producao.
- `npm run db:push`: aplica o schema Drizzle no Postgres.
- `npm run db:seed`: cadastra os produtos iniciais.
- `npm run db:studio`: abre o Drizzle Studio.
