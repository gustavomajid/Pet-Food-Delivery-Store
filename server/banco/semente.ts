import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { categoriasSemente, produtosSemente } from './dados-semente'
import { categorias, produtos } from './esquema'

const { Pool } = pg

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL nao foi configurada. Copie .env.example para .env.')
}

const pool = new Pool({ connectionString: databaseUrl })
const db = drizzle(pool)

async function criarSemente() {
  const categoriasPorNome = new Map<string, number>()

  for (const nome of categoriasSemente) {
    const [categoria] = await db
      .insert(categorias)
      .values({ nome, descricao: null, ativo: true })
      .onConflictDoUpdate({
        target: categorias.nome,
        set: { ativo: true }
      })
      .returning()

    categoriasPorNome.set(categoria.nome, categoria.id)
  }

  for (const produto of produtosSemente) {
    const categoriaId = categoriasPorNome.get(produto.categoria)

    if (!categoriaId) {
      continue
    }

    const existente = await db
      .select({ id: produtos.id })
      .from(produtos)
      .where(eq(produtos.nome, produto.nome))
      .limit(1)

    const dados = {
      nome: produto.nome,
      descricao: produto.descricao,
      categoriaId,
      marca: produto.marca,
      precoCentavos: produto.precoCentavos,
      estoque: produto.estoque,
      peso: produto.peso,
      imagemUrl: produto.imagemUrl,
      destaque: produto.destaque,
      promocao: produto.promocao,
      ativo: produto.ativo,
      atualizadoEm: new Date()
    }

    if (existente[0]) {
      await db.update(produtos).set(dados).where(eq(produtos.id, existente[0].id))
    } else {
      await db.insert(produtos).values(dados)
    }
  }
}

criarSemente()
  .then(async () => {
    await pool.end()
    console.log(
      `Semente concluida: ${categoriasSemente.length} categorias e ${produtosSemente.length} produtos.`
    )
  })
  .catch(async (error) => {
    await pool.end()
    console.error(error)
    process.exit(1)
  })
