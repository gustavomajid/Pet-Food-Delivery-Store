import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createError, readMultipartFormData } from 'h3'
import { exigirAdmin } from '../../../utils/admin'

const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024
const EXTENSOES_POR_TIPO = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
} as const

function obterDiretorioPublico() {
  if (process.env.NODE_ENV === 'production') {
    return join(process.cwd(), '.output', 'public')
  }

  return join(process.cwd(), 'public')
}

export default defineEventHandler(async (event) => {
  exigirAdmin(event)

  const partes = await readMultipartFormData(event)
  const imagem = partes?.find((parte) => parte.name === 'imagem' && parte.data.length > 0)

  if (!imagem) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Envie uma imagem para o produto.'
    })
  }

  if (imagem.data.byteLength > TAMANHO_MAXIMO_IMAGEM) {
    throw createError({
      statusCode: 413,
      statusMessage: 'A imagem deve ter no maximo 5 MB.'
    })
  }

  const extensao = EXTENSOES_POR_TIPO[imagem.type as keyof typeof EXTENSOES_POR_TIPO]

  if (!extensao) {
    throw createError({
      statusCode: 415,
      statusMessage: 'Use uma imagem JPG, PNG, WEBP ou GIF.'
    })
  }

  const nomeArquivo = `produto-${Date.now()}-${randomUUID()}${extensao}`
  const diretorio = join(obterDiretorioPublico(), 'uploads', 'produtos')

  await mkdir(diretorio, { recursive: true })
  await writeFile(join(diretorio, nomeArquivo), imagem.data)

  return {
    url: `/uploads/produtos/${nomeArquivo}`
  }
})
