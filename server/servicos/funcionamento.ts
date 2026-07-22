const FUSO_HORARIO_LOJA = 'America/Sao_Paulo'
const ABERTURA_PADRAO_MINUTOS = 8 * 60
const FECHAMENTO_SEMANA_MINUTOS = 18 * 60
const LIMITE_ENTREGA_SEMANA_MINUTOS = 17 * 60
const LIMITE_ENTREGA_SABADO_MINUTOS = 14 * 60

export type ModoFuncionamentoOnline = 'automatico' | 'aberta' | 'fechada'
const MODOS_FUNCIONAMENTO: ModoFuncionamentoOnline[] = ['automatico', 'aberta', 'fechada']

export const HORARIO_FUNCIONAMENTO_LOJA =
  'Todos os dias, das 08h as 18h. Domingo somente retirada.'
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

function obterHorarioLocal(data = new Date()) {
  const partes = Object.fromEntries(
    formatadorHorarioLoja
      .formatToParts(data)
      .map((parte) => [parte.type, parte.value])
  )
  const diaSemana = diasSemana[partes.weekday as keyof typeof diasSemana]
  const hora = Number(partes.hour)
  const minuto = Number(partes.minute)

  if (diaSemana === undefined || Number.isNaN(hora) || Number.isNaN(minuto)) {
    return null
  }

  return { diaSemana, minutosDoDia: hora * 60 + minuto }
}

function lojaEstaAbertaPeloHorario(data = new Date()) {
  const horario = obterHorarioLocal(data)

  if (!horario) {
    return false
  }

  return horario.minutosDoDia >= ABERTURA_PADRAO_MINUTOS
    && horario.minutosDoDia < FECHAMENTO_SEMANA_MINUTOS
}

export function obterDisponibilidadeEntrega(data = new Date()) {
  const horario = obterHorarioLocal(data)

  if (!horario || horario.diaSemana === 0) {
    return {
      disponivel: false,
      mensagem: 'Domingo: somente retirada na loja.'
    }
  }

  const limite = horario.diaSemana === 6
    ? LIMITE_ENTREGA_SABADO_MINUTOS
    : LIMITE_ENTREGA_SEMANA_MINUTOS
  const disponivel = horario.minutosDoDia < limite

  return {
    disponivel,
    mensagem: disponivel
      ? horario.diaSemana === 6
        ? 'Entregas disponiveis hoje ate as 14h.'
        : 'Entregas disponiveis hoje ate as 17h.'
      : horario.diaSemana === 6
        ? 'Apos as 14h: somente retirada na loja.'
        : 'Apos as 17h: somente retirada na loja.'
  }
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
  const entrega = obterDisponibilidadeEntrega(data)

  return {
    aberta,
    modo,
    manual,
    horario: HORARIO_FUNCIONAMENTO_LOJA,
    entregaDisponivel: entrega.disponivel,
    mensagemEntrega: entrega.mensagem,
    mensagem: aberta
      ? manual
        ? 'Loja aberta para testes.'
        : 'Loja aberta.'
      : manual
        ? 'Loja fechada.'
        : MENSAGEM_LOJA_FECHADA
  }
}
