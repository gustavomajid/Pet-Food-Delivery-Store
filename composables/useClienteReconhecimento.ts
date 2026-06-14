import type { ClienteReconhecido, TipoEntrega } from '~/types/loja'

const CHAVE_CLIENTES = 'fazendinha-clientes-v1'
const CHAVE_CLIENTE_ATUAL = 'fazendinha-cliente-atual-v1'

type DadosCliente = {
  telefoneCliente: string
  nomeCliente?: string
  cep?: string
  enderecoEntrega?: string
  tipoEntrega?: TipoEntrega
  atualizadoEm?: string
}

type OpcoesBuscaCliente = {
  atualizarRemoto?: boolean
}

export function normalizarTelefone(telefone: string) {
  return telefone.replace(/\D/g, '').slice(0, 14)
}

export function formatarTelefone(telefone: string) {
  const digitos = normalizarTelefone(telefone)
  const semPais = digitos.startsWith('55') && digitos.length > 11 ? digitos.slice(2) : digitos

  if (semPais.length === 11) {
    return `(${semPais.slice(0, 2)}) ${semPais.slice(2, 7)}-${semPais.slice(7)}`
  }

  if (semPais.length === 10) {
    return `(${semPais.slice(0, 2)}) ${semPais.slice(2, 6)}-${semPais.slice(6)}`
  }

  return telefone
}

function ordenarClientes(clientes: ClienteReconhecido[]) {
  return [...clientes].sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
}

export function useClienteReconhecimento() {
  const clientes = useState<ClienteReconhecido[]>('clientes-reconhecidos', () => [])
  const clienteAtual = useState<ClienteReconhecido | null>('cliente-atual', () => null)
  const clientesCarregados = useState('clientes-reconhecidos-carregados', () => false)
  const modalIdentificacaoAberto = useState('modal-identificacao-aberto', () => false)

  function persistir() {
    if (!process.client) {
      return
    }

    window.localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(clientes.value))

    if (clienteAtual.value) {
      window.localStorage.setItem(CHAVE_CLIENTE_ATUAL, clienteAtual.value.telefoneNormalizado)
    }
  }

  function carregarClientes() {
    if (!process.client || clientesCarregados.value) {
      return
    }

    try {
      const salvos = window.localStorage.getItem(CHAVE_CLIENTES)
      clientes.value = salvos ? ordenarClientes(JSON.parse(salvos)) : []
    } catch {
      clientes.value = []
    }

    const telefoneAtual = window.localStorage.getItem(CHAVE_CLIENTE_ATUAL)
    clienteAtual.value = clientes.value.find((cliente) => cliente.telefoneNormalizado === telefoneAtual) ?? null
    clientesCarregados.value = true
  }

  function salvarCliente(dados: DadosCliente) {
    const telefoneNormalizado = normalizarTelefone(dados.telefoneCliente)

    if (telefoneNormalizado.length < 8) {
      return null
    }

    carregarClientes()

    const existente = clientes.value.find(
      (cliente) => cliente.telefoneNormalizado === telefoneNormalizado
    )

    const cliente: ClienteReconhecido = {
      telefoneCliente: dados.telefoneCliente || existente?.telefoneCliente || telefoneNormalizado,
      telefoneNormalizado,
      nomeCliente: dados.nomeCliente || existente?.nomeCliente,
      cep: dados.cep || existente?.cep,
      enderecoEntrega: dados.enderecoEntrega || existente?.enderecoEntrega,
      tipoEntrega: dados.tipoEntrega || existente?.tipoEntrega,
      atualizadoEm: dados.atualizadoEm || new Date().toISOString()
    }

    clientes.value = ordenarClientes([
      cliente,
      ...clientes.value.filter((item) => item.telefoneNormalizado !== telefoneNormalizado)
    ]).slice(0, 20)

    clienteAtual.value = cliente
    persistir()

    return cliente
  }

  async function buscarClientePorTelefone(telefone: string, opcoes: OpcoesBuscaCliente = {}) {
    const telefoneNormalizado = normalizarTelefone(telefone)

    if (telefoneNormalizado.length < 8) {
      return null
    }

    carregarClientes()

    const local = clientes.value.find(
      (cliente) => cliente.telefoneNormalizado === telefoneNormalizado
    )

    if (!opcoes.atualizarRemoto && (local?.nomeCliente || local?.enderecoEntrega)) {
      clienteAtual.value = local
      persistir()
      return local
    }

    try {
      const resposta = await $fetch<{ cliente: ClienteReconhecido | null }>(
        `/api/clientes/${telefoneNormalizado}`
      )

      if (resposta.cliente) {
        return salvarCliente({
          ...resposta.cliente,
          telefoneCliente: resposta.cliente.telefoneCliente || telefone
        })
      }
    } catch {
      return local ?? null
    }

    return local ?? null
  }

  function identificarCliente(dados: DadosCliente) {
    return salvarCliente(dados)
  }

  function abrirModalIdentificacao() {
    carregarClientes()

    if (!process.client) {
      return
    }

    modalIdentificacaoAberto.value = true
  }

  function fecharModalIdentificacao() {
    modalIdentificacaoAberto.value = false
  }

  return {
    clientes,
    clienteAtual,
    modalIdentificacaoAberto,
    carregarClientes,
    salvarCliente,
    buscarClientePorTelefone,
    identificarCliente,
    abrirModalIdentificacao,
    fecharModalIdentificacao,
    normalizarTelefone,
    formatarTelefone
  }
}
