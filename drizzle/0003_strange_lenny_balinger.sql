CREATE TYPE "public"."fonte_estoque" AS ENUM('sistema', 'wms');--> statement-breakpoint
CREATE TYPE "public"."origem_movimentacao_estoque" AS ENUM('cadastro', 'ajuste_admin', 'pedido', 'cancelamento', 'wms');--> statement-breakpoint
CREATE TABLE "movimentacoes_estoque" (
	"id" serial PRIMARY KEY NOT NULL,
	"produto_id" integer NOT NULL,
	"quantidade_anterior" integer NOT NULL,
	"quantidade_nova" integer NOT NULL,
	"diferenca" integer NOT NULL,
	"origem" "origem_movimentacao_estoque" NOT NULL,
	"referencia" varchar(160),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "produtos" ADD COLUMN "fonte_estoque" "fonte_estoque" DEFAULT 'sistema' NOT NULL;--> statement-breakpoint
ALTER TABLE "produtos" ADD COLUMN "codigo_externo" varchar(120);--> statement-breakpoint
ALTER TABLE "produtos" ADD COLUMN "estoque_atualizado_em" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_codigo_externo_unique" UNIQUE("codigo_externo");