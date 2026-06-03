CREATE TYPE "public"."forma_pagamento" AS ENUM('pix', 'dinheiro', 'cartao_entrega');--> statement-breakpoint
CREATE TYPE "public"."status_pedido" AS ENUM('novo', 'confirmado', 'em_separacao', 'saiu_para_entrega', 'pronto_para_retirada', 'finalizado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."tipo_entrega" AS ENUM('retirada', 'entrega_local', 'agendada');--> statement-breakpoint
CREATE TABLE "categorias" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(120) NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categorias_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "itens_pedido" (
	"id" serial PRIMARY KEY NOT NULL,
	"pedido_id" uuid NOT NULL,
	"produto_id" integer NOT NULL,
	"nome_produto" varchar(160) NOT NULL,
	"quantidade" integer NOT NULL,
	"preco_unitario_centavos" integer NOT NULL,
	"subtotal_centavos" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome_cliente" varchar(160) NOT NULL,
	"telefone_cliente" varchar(40) NOT NULL,
	"endereco_entrega" text NOT NULL,
	"tipo_entrega" "tipo_entrega" NOT NULL,
	"forma_pagamento" "forma_pagamento" NOT NULL,
	"status" "status_pedido" DEFAULT 'novo' NOT NULL,
	"subtotal_centavos" integer NOT NULL,
	"taxa_entrega_centavos" integer NOT NULL,
	"desconto_centavos" integer DEFAULT 0 NOT NULL,
	"total_centavos" integer NOT NULL,
	"observacoes" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(160) NOT NULL,
	"descricao" text NOT NULL,
	"categoria_id" integer NOT NULL,
	"marca" varchar(120) NOT NULL,
	"preco_centavos" integer NOT NULL,
	"estoque" integer DEFAULT 0 NOT NULL,
	"peso" varchar(60) NOT NULL,
	"imagem_url" text NOT NULL,
	"destaque" boolean DEFAULT false NOT NULL,
	"promocao" boolean DEFAULT false NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;