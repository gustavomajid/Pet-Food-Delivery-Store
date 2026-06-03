import 'dotenv/config'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { categorias, produtos } from './esquema'

const { Pool } = pg

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL não foi configurada. Copie .env.example para .env.')
}

const pool = new Pool({ connectionString: databaseUrl })
const db = drizzle(pool)

const categoriasSemente = [
  'Ração para cachorro',
  'Ração para gato',
  'Petiscos',
  'Higiene',
  'Acessórios',
  'Agropecuária',
  'Jardinagem'
]

const produtosSemente = [
  {
    nome: 'Ração Golden Adulto 15kg',
    descricao: 'Ração seca para cães adultos de porte médio.',
    categoria: 'Ração para cachorro',
    marca: 'Golden',
    precoCentavos: 16990,
    estoque: 12,
    peso: '15kg',
    imagemUrl:
      'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80',
    destaque: true,
    promocao: false,
    ativo: true
  },
  {
    nome: 'Ração Premier Gatos 10kg',
    descricao: 'Alimento para gatos adultos com alta aceitação.',
    categoria: 'Ração para gato',
    marca: 'Premier',
    precoCentavos: 18990,
    estoque: 9,
    peso: '10kg',
    imagemUrl:
      'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=900&q=80',
    destaque: true,
    promocao: false,
    ativo: true
  },
  {
    nome: 'Areia higiênica 4kg',
    descricao: 'Areia granulada para gatos, pacote econômico.',
    categoria: 'Higiene',
    marca: 'Pipicat',
    precoCentavos: 2990,
    estoque: 30,
    peso: '4kg',
    imagemUrl:
      'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?auto=format&fit=crop&w=900&q=80',
    destaque: false,
    promocao: true,
    ativo: true
  },
  {
    nome: 'Biscoito canino 500g',
    descricao: 'Petisco crocante para treino e recompensa.',
    categoria: 'Petiscos',
    marca: 'Doguitos',
    precoCentavos: 1890,
    estoque: 26,
    peso: '500g',
    imagemUrl:
      'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=900&q=80',
    destaque: false,
    promocao: false,
    ativo: true
  },
  {
    nome: 'Coleira regulável',
    descricao: 'Coleira resistente para cães de pequeno e médio porte.',
    categoria: 'Acessórios',
    marca: 'Fazendinha',
    precoCentavos: 2490,
    estoque: 18,
    peso: 'unidade',
    imagemUrl:
      'https://images.unsplash.com/photo-1601758124096-1fd661873b62?auto=format&fit=crop&w=900&q=80',
    destaque: false,
    promocao: false,
    ativo: true
  },
  {
    nome: 'Semente de milho 1kg',
    descricao: 'Sementes selecionadas para plantio rural.',
    categoria: 'Agropecuária',
    marca: 'Campo Bom',
    precoCentavos: 1590,
    estoque: 35,
    peso: '1kg',
    imagemUrl:
      'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=900&q=80',
    destaque: false,
    promocao: false,
    ativo: true
  },
  {
    nome: 'Terra vegetal 20kg',
    descricao: 'Substrato pronto para hortas, vasos e jardins.',
    categoria: 'Jardinagem',
    marca: 'Verde Vida',
    precoCentavos: 2290,
    estoque: 20,
    peso: '20kg',
    imagemUrl:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80',
    destaque: false,
    promocao: true,
    ativo: true
  }
]

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
    console.log('Semente concluída.')
  })
  .catch(async (error) => {
    await pool.end()
    console.error(error)
    process.exit(1)
  })
