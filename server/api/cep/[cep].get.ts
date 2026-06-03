import { z } from 'zod'

const cepRespostaSchema = z
  .object({
    erro: z.union([z.literal(true), z.literal('true')]).optional(),
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    complemento: z.string().optional(),
    unidade: z.string().optional(),
    bairro: z.string().optional(),
    localidade: z.string().optional(),
    uf: z.string().optional(),
    estado: z.string().optional(),
    regiao: z.string().optional(),
    ibge: z.string().optional(),
    gia: z.string().optional(),
    ddd: z.string().optional(),
    siafi: z.string().optional()
  })
  .passthrough()

function limparTexto(valor?: string) {
  return valor?.trim() || ''
}

export default defineEventHandler(async (event) => {
  const cepParametro = getRouterParam(event, 'cep') || ''
  const cep = cepParametro.replace(/\D/g, '')

  if (cep.length !== 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'CEP deve conter 8 digitos.'
    })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json'
      }
    })

    if (resposta.status === 400) {
      throw createError({
        statusCode: 400,
        statusMessage: 'CEP invalido.'
      })
    }

    if (!resposta.ok) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Nao foi possivel consultar o CEP agora.'
      })
    }

    const dados: unknown = await resposta.json()
    const resultado = cepRespostaSchema.safeParse(dados)

    if (!resultado.success) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Resposta invalida do servico de CEP.'
      })
    }

    if (resultado.data.erro) {
      throw createError({
        statusCode: 404,
        statusMessage: 'CEP nao encontrado.'
      })
    }

    const uf = limparTexto(resultado.data.uf).toUpperCase()

    if (!/^[A-Z]{2}$/.test(uf)) {
      throw createError({
        statusCode: 502,
        statusMessage: 'Resposta incompleta do servico de CEP.'
      })
    }

    return {
      cep: limparTexto(resultado.data.cep),
      logradouro: limparTexto(resultado.data.logradouro),
      complemento: limparTexto(resultado.data.complemento),
      bairro: limparTexto(resultado.data.bairro),
      localidade: limparTexto(resultado.data.localidade),
      uf,
      estado: limparTexto(resultado.data.estado),
      regiao: limparTexto(resultado.data.regiao),
      ibge: limparTexto(resultado.data.ibge),
      ddd: limparTexto(resultado.data.ddd)
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Nao foi possivel consultar o CEP agora.'
    })
  } finally {
    clearTimeout(timeout)
  }
})
