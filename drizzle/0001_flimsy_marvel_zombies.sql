CREATE TABLE "configuracoes_loja" (
	"id" integer PRIMARY KEY NOT NULL,
	"modal_identificacao_ativo" boolean DEFAULT true NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
