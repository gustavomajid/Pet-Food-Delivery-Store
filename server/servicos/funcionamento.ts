const FUSO_HORARIO_LOJA = 'America/Sao_Paulo'
const ABERTURA_PADRAO_MINUTOS = 8 * 60
const FECHAMENTO_SEMANA_MINUTOS = 18 * 60

export type ModoFuncionamentoOnline = 'automatico' | 'aberta' | 'fechada'
const MODOS_FUNCIONAMENTO: ModoFuncionamentoOnline[] = ['automatico', 'aberta', 'fechada']

export const HORARIO_FUNCIONAMENTO_LOJA =
  'Segunda a sabado, das 08h as 18h.'
export const MENSAGEM_LOJA_FECHADA =
  'Loja fechada. Volte das 08h as 18h.'

const formatadorHorarioLoja = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSO_HORARIO_LOJA,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
})

const diasSemana = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
} as const

export function normalizarModoFuncionamentoOnline(
  modo?: string | null
): ModoFuncionamentoOnline {
  return MODOS_FUNCIONAMENTO.includes(modo as ModoFuncionamentoOnline)
    ? modo as ModoFuncionamentoOnline
    : 'automatico'
}

function lojaEstaAbertaPeloHorario(data = new Date()) {
  const partes = Object.fromEntries(
    formatadorHorarioLoja
      .formatToParts(data)
      .map((parte) => [parte.type, parte.value])
  )
  const diaSemana = diasSemana[partes.weekday as keyof typeof diasSemana]
  const hora = Number(partes.hour)
  const minuto = Number(partes.minute)

  if (diaSemana === undefined || Number.isNaN(hora) || Number.isNaN(minuto)) {
    return false
  }

  if (diaSemana === 0) {
    return false
  }

  const minutosDoDia = hora * 60 + minuto

  return minutosDoDia >= ABERTURA_PADRAO_MINUTOS
    && minutosDoDia < FECHAMENTO_SEMANA_MINUTOS
}

export function lojaEstaAberta(data = new Date(), modo: ModoFuncionamentoOnline = 'automatico') {
  if (modo === 'aberta') {
    return true
  }

  if (modo === 'fechada') {
    return false
  }

  return lojaEstaAbertaPeloHorario(data)
}

export function obterFuncionamentoLoja(
  modo: ModoFuncionamentoOnline = 'automatico',
  data = new Date()
) {
  const aberta = lojaEstaAberta(data, modo)
  const manual = modo !== 'automatico'

  return {
    aberta,
    modo,
    manual,
    horario: HORARIO_FUNCIONAMENTO_LOJA,
    mensagem: aberta
      ? manual
        ? 'Loja aberta para testes.'
        : 'Loja aberta.'
      : manual
        ? 'Loja fechada.'
        : MENSAGEM_LOJA_FECHADA
  }
}
