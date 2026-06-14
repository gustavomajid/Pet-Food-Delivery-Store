<script setup lang="ts">
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ClipboardList,
  LocateFixed,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Route,
  Store,
  Truck,
  X
} from '@lucide/vue'
import type { ItemPedidoResumo, PedidoResumo, StatusPedido } from '~/types/loja'

type Coordenadas = {
  latitude: number
  longitude: number
}

type LocalizacaoEntregador = Coordenadas & {
  precisao: number
  capturadaEm: number
}

type LojaEstoque = {
  id: string
  nome: string
  regiao: string
  endereco: string
  coordenadas: Coordenadas
}

type ParadaRota = {
  id: string
  tipo: 'estoque' | 'entrega'
  titulo: string
  subtitulo: string
  endereco: string
  pedidoId?: string
}

const { formatarCentavos } = useDinheiro()

useHead({
  title: 'Entregador | Fazendinha'
})

// Ajuste estes pontos com os enderecos/coordenadas reais das lojas Fazendinha.
const estoquePadrao: LojaEstoque = {
  id: 'centro',
  nome: 'Fazendinha Centro',
  regiao: 'Centro',
  endereco: 'Centro, Catanduva - SP',
  coordenadas: {
    latitude: -21.1378,
    longitude: -48.9728
  }
}

const estoquesFazendinha: LojaEstoque[] = [
  estoquePadrao,
  {
    id: 'norte',
    nome: 'Fazendinha Norte',
    regiao: 'Norte',
    endereco: 'Zona norte, Catanduva - SP',
    coordenadas: {
      latitude: -21.1189,
      longitude: -48.9737
    }
  },
  {
    id: 'sul',
    nome: 'Fazendinha Sul',
    regiao: 'Sul',
    endereco: 'Zona sul, Catanduva - SP',
    coordenadas: {
      latitude: -21.1557,
      longitude: -48.9815
    }
  }
]

const statusEntregaveis: StatusPedido[] = [
  'novo',
  'confirmado',
  'em_separacao',
  'saiu_para_entrega'
]

const textoStatusPedido: Record<StatusPedido, string> = {
  novo: 'Novo',
  confirmado: 'Confirmado',
  em_separacao: 'Em separacao',
  saiu_para_entrega: 'Saiu para entrega',
  pronto_para_retirada: 'Pronto para retirada',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado'
}

const erroPagina = ref('')
const atualizandoPedidos = ref(false)
const idsSelecionados = ref<string[]>([])
const origensEstoque = ref<Record<string, string>>({})
const localizacao = ref<LocalizacaoEntregador | null>(null)
const statusLocalizacao = ref<'aguardando' | 'capturando' | 'ativa' | 'erro' | 'indisponivel'>(
  'aguardando'
)
const erroLocalizacao = ref('')
let monitorLocalizacao: number | null = null

const {
  data: dadosPedidos,
  refresh: recarregarPedidos
} = await useFetch<{ pedidos: PedidoResumo[] }>('/api/admin/pedidos', {
  default: () => ({ pedidos: [] }),
  immediate: false,
  credentials: 'include'
})

const pedidos = computed(() => dadosPedidos.value?.pedidos ?? [])
const pedidosParaEntrega = computed(() =>
  pedidos.value.filter((pedido) =>
    pedido.tipoEntrega !== 'retirada' && statusEntregaveis.includes(pedido.status)
  )
)
const pedidosSelecionados = computed(() =>
  idsSelecionados.value
    .map((id) => pedidosParaEntrega.value.find((pedido) => pedido.id === id))
    .filter((pedido): pedido is PedidoResumo => Boolean(pedido))
)
const pedidosEmRota = computed(() =>
  pedidosParaEntrega.value.filter((pedido) => pedido.status === 'saiu_para_entrega')
)
const totalItensSelecionados = computed(() =>
  pedidosSelecionados.value.reduce(
    (total, pedido) =>
      total + (pedido.itens ?? []).reduce((subtotal, item) => subtotal + item.quantidade, 0),
    0
  )
)
const totalSelecionadoCentavos = computed(() =>
  pedidosSelecionados.value.reduce((total, pedido) => total + pedido.totalCentavos, 0)
)
const estoqueMaisProximo = computed(() => encontrarEstoqueMaisProximo())
const estoquesUsados = computed(() => {
  const ids = new Set<string>()

  for (const pedido of pedidosSelecionados.value) {
    for (const item of pedido.itens ?? []) {
      ids.add(origemEstoqueItem(pedido, item).id)
    }
  }

  return [...ids].map((id) => obterEstoque(id))
})
const paradasRetirada = computed(() =>
  [...estoquesUsados.value].sort((lojaA, lojaB) => distanciaLoja(lojaA) - distanciaLoja(lojaB))
)
const paradasRota = computed<ParadaRota[]>(() => [
  ...paradasRetirada.value.map((loja) => ({
    id: `estoque-${loja.id}`,
    tipo: 'estoque' as const,
    titulo: loja.nome,
    subtitulo: `Retirada de produtos - ${loja.regiao}`,
    endereco: loja.endereco
  })),
  ...pedidosSelecionados.value.map((pedido) => ({
    id: `entrega-${pedido.id}`,
    tipo: 'entrega' as const,
    titulo: pedido.nomeCliente,
    subtitulo: `${textoStatusPedido[pedido.status]} - ${formatarCentavos(pedido.totalCentavos)}`,
    endereco: pedido.enderecoEntrega,
    pedidoId: pedido.id
  }))
])
const googleMapsUrl = computed(() => montarUrlGoogleMaps())
const textoLocalizacao = computed(() => {
  if (statusLocalizacao.value === 'ativa' && localizacao.value) {
    return `${formatarCoordenada(localizacao.value.latitude)}, ${formatarCoordenada(
      localizacao.value.longitude
    )}`
  }

  if (statusLocalizacao.value === 'capturando') {
    return 'Capturando...'
  }

  if (statusLocalizacao.value === 'erro') {
    return 'Sem permissao'
  }

  if (statusLocalizacao.value === 'indisponivel') {
    return 'Indisponivel'
  }

  return 'Aguardando'
})

onMounted(() => {
  if (!import.meta.client) {
    return
  }

  const estoquesSalvos = localStorage.getItem('fazendinha_entregador_estoques')

  if (!estoquesSalvos) {
    return
  }

  try {
    origensEstoque.value = JSON.parse(estoquesSalvos) as Record<string, string>
  } catch {
    origensEstoque.value = {}
  }
})

watch(
  origensEstoque,
  (valor) => {
    if (import.meta.client) {
      localStorage.setItem('fazendinha_entregador_estoques', JSON.stringify(valor))
    }
  },
  { deep: true }
)

onUnmounted(() => {
  if (import.meta.client && monitorLocalizacao !== null) {
    navigator.geolocation.clearWatch(monitorLocalizacao)
  }
})

async function carregarEntregador() {
  erroPagina.value = ''

  try {
    await recarregarPedidos()
    iniciarMonitoramentoLocalizacao()
  } catch {
    erroPagina.value = 'Nao foi possivel carregar os pedidos do entregador.'
  }
}

function iniciarMonitoramentoLocalizacao() {
  if (!import.meta.client) {
    return
  }

  if (!navigator.geolocation) {
    statusLocalizacao.value = 'indisponivel'
    erroLocalizacao.value = 'Localizacao indisponivel neste navegador.'
    return
  }

  if (monitorLocalizacao !== null) {
    return
  }

  statusLocalizacao.value = 'capturando'
  erroLocalizacao.value = ''
  monitorLocalizacao = navigator.geolocation.watchPosition(
    (posicao) => {
      localizacao.value = {
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude,
        precisao: posicao.coords.accuracy,
        capturadaEm: posicao.timestamp
      }
      statusLocalizacao.value = 'ativa'
      erroLocalizacao.value = ''
    },
    () => {
      statusLocalizacao.value = 'erro'
      erroLocalizacao.value = 'Permita o acesso a localizacao para sugerir a rota a partir do entregador.'
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000
    }
  )
}

function pedidoEstaSelecionado(id: string) {
  return idsSelecionados.value.includes(id)
}

function alternarPedido(pedido: PedidoResumo) {
  if (pedidoEstaSelecionado(pedido.id)) {
    idsSelecionados.value = idsSelecionados.value.filter((id) => id !== pedido.id)
    return
  }

  garantirOrigensPedido(pedido)
  idsSelecionados.value = [...idsSelecionados.value, pedido.id]
}

function garantirOrigensPedido(pedido: PedidoResumo) {
  const proximasOrigens = { ...origensEstoque.value }

  for (const item of pedido.itens ?? []) {
    const chave = chaveOrigemEstoque(pedido.id, item.id)

    if (!proximasOrigens[chave]) {
      proximasOrigens[chave] = estoqueMaisProximo.value.id
    }
  }

  origensEstoque.value = proximasOrigens
}

function limparSelecao() {
  idsSelecionados.value = []
}

function aplicarSugestaoRota() {
  idsSelecionados.value = [...pedidosSelecionados.value]
    .sort((pedidoA, pedidoB) => {
      const distanciaA = distanciaLoja(estoquePrincipalPedido(pedidoA))
      const distanciaB = distanciaLoja(estoquePrincipalPedido(pedidoB))

      if (distanciaA !== distanciaB) {
        return distanciaA - distanciaB
      }

      return new Date(pedidoA.criadoEm).getTime() - new Date(pedidoB.criadoEm).getTime()
    })
    .map((pedido) => pedido.id)
}

function moverPedidoSelecionado(id: string, direcao: -1 | 1) {
  const indiceAtual = idsSelecionados.value.indexOf(id)
  const indiceNovo = indiceAtual + direcao

  if (indiceAtual < 0 || indiceNovo < 0 || indiceNovo >= idsSelecionados.value.length) {
    return
  }

  const novaOrdem = [...idsSelecionados.value]
  const [pedido] = novaOrdem.splice(indiceAtual, 1)

  if (!pedido) {
    return
  }

  novaOrdem.splice(indiceNovo, 0, pedido)
  idsSelecionados.value = novaOrdem
}

function podeMoverPedido(id: string | undefined, direcao: -1 | 1) {
  if (!id) {
    return false
  }

  const indiceAtual = idsSelecionados.value.indexOf(id)
  const indiceNovo = indiceAtual + direcao

  return indiceAtual >= 0 && indiceNovo >= 0 && indiceNovo < idsSelecionados.value.length
}

async function alterarStatusSelecionados(status: StatusPedido) {
  if (idsSelecionados.value.length === 0) {
    return
  }

  atualizandoPedidos.value = true
  erroPagina.value = ''

  try {
    await Promise.all(
      pedidosSelecionados.value.map((pedido) =>
        $fetch(`/api/admin/pedidos/${pedido.id}`, {
          method: 'PATCH',
          credentials: 'include',
          body: { status }
        })
      )
    )
    await recarregarPedidos()

    if (status === 'finalizado') {
      idsSelecionados.value = []
    }
  } catch {
    erroPagina.value = 'Nao foi possivel atualizar os pedidos selecionados.'
  } finally {
    atualizandoPedidos.value = false
  }
}

function chaveOrigemEstoque(pedidoId: string, itemId: number) {
  return `${pedidoId}:${itemId}`
}

function origemEstoqueItem(pedido: PedidoResumo, item: ItemPedidoResumo) {
  const idEstoque = origensEstoque.value[chaveOrigemEstoque(pedido.id, item.id)]

  return obterEstoque(idEstoque) ?? estoqueMaisProximo.value
}

function definirOrigemEstoque(pedido: PedidoResumo, item: ItemPedidoResumo, evento: Event) {
  const alvo = evento.target as HTMLSelectElement

  origensEstoque.value = {
    ...origensEstoque.value,
    [chaveOrigemEstoque(pedido.id, item.id)]: alvo.value
  }
}

function obterEstoque(id?: string) {
  return estoquesFazendinha.find((loja) => loja.id === id) ?? estoquePadrao
}

function estoquePrincipalPedido(pedido: PedidoResumo) {
  const totais = new Map<string, number>()

  for (const item of pedido.itens ?? []) {
    const loja = origemEstoqueItem(pedido, item)
    totais.set(loja.id, (totais.get(loja.id) ?? 0) + item.quantidade)
  }

  const [primeiroEstoque] = [...totais.entries()].sort((a, b) => b[1] - a[1])

  return obterEstoque(primeiroEstoque?.[0])
}

function resumoEstoquesPedido(pedido: PedidoResumo) {
  const ids = new Set((pedido.itens ?? []).map((item) => origemEstoqueItem(pedido, item).id))

  if (ids.size === 0) {
    return 'Sem itens'
  }

  if (ids.size === 1) {
    const [idEstoque] = [...ids]

    return `Baixar em ${obterEstoque(idEstoque).nome}`
  }

  return `${ids.size} estoques selecionados`
}

function encontrarEstoqueMaisProximo() {
  if (!localizacao.value) {
    return estoquePadrao
  }

  return (
    [...estoquesFazendinha].sort((lojaA, lojaB) => distanciaLoja(lojaA) - distanciaLoja(lojaB))[0] ??
    estoquePadrao
  )
}

function distanciaLoja(loja: LojaEstoque) {
  const origem = localizacao.value ?? {
    latitude: -21.1378,
    longitude: -48.9728
  }

  return distanciaEntre(origem, loja.coordenadas)
}

function distanciaEntre(origem: Coordenadas, destino: Coordenadas) {
  const raioTerraKm = 6371
  const diferencaLatitude = paraRadianos(destino.latitude - origem.latitude)
  const diferencaLongitude = paraRadianos(destino.longitude - origem.longitude)
  const latitudeOrigem = paraRadianos(origem.latitude)
  const latitudeDestino = paraRadianos(destino.latitude)
  const calculo =
    Math.sin(diferencaLatitude / 2) * Math.sin(diferencaLatitude / 2) +
    Math.cos(latitudeOrigem) *
      Math.cos(latitudeDestino) *
      Math.sin(diferencaLongitude / 2) *
      Math.sin(diferencaLongitude / 2)

  return raioTerraKm * 2 * Math.atan2(Math.sqrt(calculo), Math.sqrt(1 - calculo))
}

function paraRadianos(valor: number) {
  return (valor * Math.PI) / 180
}

function montarUrlGoogleMaps() {
  if (pedidosSelecionados.value.length === 0) {
    return ''
  }

  const origem = localizacao.value
    ? `${localizacao.value.latitude},${localizacao.value.longitude}`
    : 'Catanduva - SP'
  const pontos = [
    ...paradasRetirada.value.map((loja) => `${loja.coordenadas.latitude},${loja.coordenadas.longitude}`),
    ...pedidosSelecionados.value.map((pedido) => `${pedido.enderecoEntrega}, Catanduva - SP`)
  ]
  const destino = pontos.at(-1)

  if (!destino) {
    return ''
  }

  const parametros = new URLSearchParams({
    api: '1',
    origin: origem,
    destination: destino,
    travelmode: 'driving'
  })
  const waypoints = pontos.slice(0, -1)

  if (waypoints.length > 0) {
    parametros.set('waypoints', waypoints.join('|'))
  }

  return `https://www.google.com/maps/dir/?${parametros.toString()}`
}

function textoEntrega(pedido: PedidoResumo) {
  return pedido.tipoEntrega === 'agendada' ? 'Entrega agendada' : 'Entrega local'
}

function listarItensPedido(pedido: PedidoResumo) {
  return pedido.itens ?? []
}

function formatarData(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(valor))
}

function formatarCoordenada(valor: number) {
  return valor.toFixed(5)
}

function formatarDistancia(valor: number) {
  if (valor < 1) {
    return `${Math.round(valor * 1000)} m`
  }

  return `${valor.toFixed(1)} km`
}

function formatarHorarioLocalizacao(valor: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(valor))
}

function telefoneLink(telefone: string) {
  const numero = telefone.replace(/\D/g, '')

  return numero ? `tel:${numero}` : '#'
}

function enderecoMaps(endereco: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${endereco}, Catanduva - SP`
  )}`
}
</script>

<template>
  <AdminArea
    titulo="Entregador"
    subtitulo="Rotas da Fazendinha em Catanduva"
    @autenticado="carregarEntregador"
    @recarregar="carregarEntregador"
  >
    <p v-if="erroPagina" class="erro-formulario">{{ erroPagina }}</p>

    <section class="metricas-admin entregador-metricas" aria-label="Resumo do entregador">
      <article class="metrica-admin metrica-admin--alerta">
        <ClipboardList :size="22" aria-hidden="true" />
        <span>Pedidos disponiveis</span>
        <strong>{{ pedidosParaEntrega.length }}</strong>
      </article>

      <article class="metrica-admin">
        <Truck :size="22" aria-hidden="true" />
        <span>Em rota</span>
        <strong>{{ pedidosEmRota.length }}</strong>
      </article>

      <article class="metrica-admin">
        <PackageCheck :size="22" aria-hidden="true" />
        <span>Selecionados</span>
        <strong>{{ idsSelecionados.length }}</strong>
      </article>

      <article class="metrica-admin">
        <LocateFixed :size="22" aria-hidden="true" />
        <span>Localizacao</span>
        <strong>{{ statusLocalizacao === 'ativa' ? 'Ativa' : textoLocalizacao }}</strong>
      </article>
    </section>

    <section class="entregador-layout">
      <aside class="painel-admin painel-rota">
        <div class="titulo-secao titulo-secao--compacto">
          <h1>Rota selecionada</h1>
          <span>{{ paradasRota.length }} parada(s)</span>
        </div>

        <div class="localizacao-entregador">
          <span class="icone-localizacao">
            <LocateFixed :size="20" aria-hidden="true" />
          </span>
          <div>
            <strong>{{ textoLocalizacao }}</strong>
            <span v-if="localizacao">
              {{ formatarDistancia(distanciaLoja(estoqueMaisProximo)) }} do {{ estoqueMaisProximo.nome }}
            </span>
            <span v-else>{{ erroLocalizacao || 'Base: Catanduva - SP' }}</span>
          </div>
          <button class="botao-icone" type="button" aria-label="Atualizar localizacao" @click="iniciarMonitoramentoLocalizacao">
            <Navigation :size="18" aria-hidden="true" />
          </button>
        </div>

        <div v-if="localizacao" class="linha-localizacao">
          <span>Precisao: {{ Math.round(localizacao.precisao) }} m</span>
          <span>{{ formatarHorarioLocalizacao(localizacao.capturadaEm) }}</span>
        </div>

        <div v-if="idsSelecionados.length === 0" class="painel-estado painel-estado--compacto">
          <strong>Nenhum pedido selecionado</strong>
          <span>Selecione pedidos para montar o roteiro de entrega.</span>
        </div>

        <template v-else>
          <ol class="lista-rota">
            <li v-for="(parada, indice) in paradasRota" :key="parada.id">
              <span class="numero-parada">{{ indice + 1 }}</span>
              <span class="icone-parada">
                <Store v-if="parada.tipo === 'estoque'" :size="18" aria-hidden="true" />
                <MapPin v-else :size="18" aria-hidden="true" />
              </span>
              <div>
                <strong>{{ parada.titulo }}</strong>
                <span>{{ parada.subtitulo }}</span>
                <small>{{ parada.endereco }}</small>
              </div>
              <div v-if="parada.tipo === 'entrega'" class="acoes-ordem-rota">
                <button
                  class="botao-icone botao-icone--mini"
                  type="button"
                  aria-label="Subir pedido na rota"
                  :disabled="!podeMoverPedido(parada.pedidoId, -1)"
                  @click="parada.pedidoId && moverPedidoSelecionado(parada.pedidoId, -1)"
                >
                  <ArrowUp :size="15" aria-hidden="true" />
                </button>
                <button
                  class="botao-icone botao-icone--mini"
                  type="button"
                  aria-label="Descer pedido na rota"
                  :disabled="!podeMoverPedido(parada.pedidoId, 1)"
                  @click="parada.pedidoId && moverPedidoSelecionado(parada.pedidoId, 1)"
                >
                  <ArrowDown :size="15" aria-hidden="true" />
                </button>
              </div>
            </li>
          </ol>

          <div class="resumo-rota">
            <div>
              <span>Itens</span>
              <strong>{{ totalItensSelecionados }}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{{ formatarCentavos(totalSelecionadoCentavos) }}</strong>
            </div>
          </div>

          <div class="acoes-rota">
            <button class="botao-admin botao-admin--secundario" type="button" @click="aplicarSugestaoRota">
              <Route :size="18" aria-hidden="true" />
              Sugerir ordem
            </button>
            <a v-if="googleMapsUrl" class="botao-admin" :href="googleMapsUrl" target="_blank" rel="noreferrer">
              <Navigation :size="18" aria-hidden="true" />
              Abrir rota
            </a>
            <button v-else class="botao-admin" type="button" disabled>
              <Navigation :size="18" aria-hidden="true" />
              Abrir rota
            </button>
            <button class="botao-admin botao-admin--secundario" type="button" @click="limparSelecao">
              <X :size="18" aria-hidden="true" />
              Limpar
            </button>
          </div>

          <div class="acoes-status-rota">
            <button
              class="botao-admin"
              type="button"
              :disabled="atualizandoPedidos"
              @click="alterarStatusSelecionados('saiu_para_entrega')"
            >
              <Truck :size="18" aria-hidden="true" />
              Saiu para entrega
            </button>
            <button
              class="botao-admin botao-admin--finalizar"
              type="button"
              :disabled="atualizandoPedidos"
              @click="alterarStatusSelecionados('finalizado')"
            >
              <CheckCircle2 :size="18" aria-hidden="true" />
              Finalizar
            </button>
          </div>
        </template>
      </aside>

      <section class="painel-admin painel-pedidos-entrega">
        <div class="titulo-secao titulo-secao--compacto">
          <h1>Pedidos para entregar</h1>
          <span>{{ pedidosParaEntrega.length }} pedido(s)</span>
        </div>

        <div v-if="pedidosParaEntrega.length === 0" class="painel-estado painel-estado--compacto">
          <strong>Nenhum pedido de entrega</strong>
          <span>Pedidos locais e agendados aparecem aqui quando chegarem.</span>
        </div>

        <div v-else class="lista-entregas">
          <article
            v-for="pedido in pedidosParaEntrega"
            :key="pedido.id"
            class="pedido-entrega"
            :class="{ 'pedido-entrega--selecionado': pedidoEstaSelecionado(pedido.id) }"
          >
            <header class="pedido-entrega__topo">
              <label class="seletor-entrega">
                <input
                  type="checkbox"
                  :checked="pedidoEstaSelecionado(pedido.id)"
                  @change="alternarPedido(pedido)"
                >
                <span>{{ pedidoEstaSelecionado(pedido.id) ? 'Selecionado' : 'Selecionar' }}</span>
              </label>

              <div>
                <strong>{{ pedido.nomeCliente }}</strong>
                <span>#{{ pedido.id.slice(0, 8) }} - {{ formatarData(pedido.criadoEm) }}</span>
              </div>

              <strong class="valor-pedido">{{ formatarCentavos(pedido.totalCentavos) }}</strong>
            </header>

            <div class="pedido-entrega__grid">
              <section class="bloco-entrega">
                <strong>{{ textoEntrega(pedido) }}</strong>
                <span>{{ pedido.enderecoEntrega }}</span>
                <div class="acoes-contato-entrega">
                  <a :href="telefoneLink(pedido.telefoneCliente)">
                    <Phone :size="16" aria-hidden="true" />
                    {{ pedido.telefoneCliente }}
                  </a>
                  <a :href="enderecoMaps(pedido.enderecoEntrega)" target="_blank" rel="noreferrer">
                    <MapPin :size="16" aria-hidden="true" />
                    Mapa
                  </a>
                </div>
              </section>

              <section class="bloco-entrega">
                <strong>Status</strong>
                <span class="status-admin">{{ textoStatusPedido[pedido.status] }}</span>
                <span>{{ resumoEstoquesPedido(pedido) }}</span>
              </section>

              <section class="bloco-entrega bloco-entrega--itens">
                <strong>Itens e estoque</strong>
                <div v-for="item in listarItensPedido(pedido)" :key="item.id" class="linha-estoque-item">
                  <div>
                    <span>{{ item.quantidade }}x {{ item.nomeProduto }}</span>
                    <small>{{ formatarCentavos(item.subtotalCentavos) }}</small>
                  </div>
                  <select :value="origemEstoqueItem(pedido, item).id" @change="definirOrigemEstoque(pedido, item, $event)">
                    <option v-for="estoque in estoquesFazendinha" :key="estoque.id" :value="estoque.id">
                      {{ estoque.nome }}
                    </option>
                  </select>
                </div>
              </section>
            </div>

            <p v-if="pedido.observacoes" class="pedido-entrega__observacao">
              {{ pedido.observacoes }}
            </p>
          </article>
        </div>
      </section>
    </section>
  </AdminArea>
</template>

<style scoped>
.entregador-metricas .metrica-admin strong {
  font-size: 1.2rem;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.entregador-layout {
  display: grid;
  gap: 16px;
}

.painel-rota {
  align-content: start;
  gap: 14px;
}

.titulo-secao--compacto {
  margin: 0;
}

.localizacao-entregador {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--linha);
  border-radius: 8px;
  background: #fbfaf6;
}

.icone-localizacao,
.icone-parada {
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #eef8ee;
  color: var(--verde);
}

.icone-localizacao {
  width: 42px;
  height: 42px;
}

.localizacao-entregador strong,
.localizacao-entregador span,
.linha-localizacao span,
.lista-rota strong,
.lista-rota span,
.lista-rota small {
  display: block;
}

.localizacao-entregador span,
.linha-localizacao span,
.lista-rota span,
.lista-rota small {
  color: var(--muted);
  font-size: 0.86rem;
  line-height: 1.35;
}

.linha-localizacao {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  padding: 0 2px;
}

.lista-rota {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.lista-rota li {
  display: grid;
  grid-template-columns: 30px 36px minmax(0, 1fr) auto;
  align-items: start;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--linha);
  border-radius: 8px;
  background: #fff;
}

.numero-parada {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 8px;
  background: var(--verde-escuro);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 900;
}

.icone-parada {
  width: 36px;
  height: 36px;
}

.acoes-ordem-rota {
  display: grid;
  gap: 6px;
}

.botao-icone--mini {
  width: 32px;
  height: 32px;
}

.resumo-rota {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.resumo-rota div {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid rgba(47, 111, 69, 0.22);
  border-radius: 8px;
  background: #eef8ee;
}

.resumo-rota span {
  color: var(--verde-escuro);
  font-size: 0.78rem;
  font-weight: 900;
  text-transform: uppercase;
}

.resumo-rota strong {
  color: var(--verde-escuro);
  font-size: 1.1rem;
}

.acoes-rota,
.acoes-status-rota {
  display: grid;
  gap: 8px;
}

.acoes-rota .botao-admin,
.acoes-status-rota .botao-admin {
  width: 100%;
}

.botao-admin--finalizar {
  border-color: var(--azul);
  background: var(--azul);
}

.painel-pedidos-entrega {
  align-content: start;
}

.lista-entregas {
  display: grid;
  gap: 12px;
}

.pedido-entrega {
  display: grid;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--linha);
  border-radius: 8px;
  background: #fff;
}

.pedido-entrega--selecionado {
  border-color: rgba(40, 114, 75, 0.5);
  box-shadow: 0 0 0 3px rgba(40, 114, 75, 0.1);
}

.pedido-entrega__topo {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.pedido-entrega__topo strong,
.pedido-entrega__topo span {
  display: block;
}

.pedido-entrega__topo span,
.bloco-entrega span,
.linha-estoque-item small,
.pedido-entrega__observacao {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.35;
}

.valor-pedido {
  color: var(--verde-escuro);
}

.seletor-entrega {
  display: inline-flex;
  width: fit-content;
  min-height: 40px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--linha);
  border-radius: 8px;
  background: #fbfaf6;
  color: var(--texto);
  font-weight: 900;
}

.seletor-entrega input {
  width: 18px;
  height: 18px;
  accent-color: var(--verde);
}

.pedido-entrega__grid {
  display: grid;
  gap: 10px;
}

.bloco-entrega {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--linha);
  border-radius: 8px;
  background: #fbfaf6;
}

.bloco-entrega > strong {
  color: var(--texto);
  font-size: 0.84rem;
  text-transform: uppercase;
}

.bloco-entrega--itens {
  grid-column: 1 / -1;
}

.acoes-contato-entrega {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.acoes-contato-entrega a {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid var(--linha);
  border-radius: 8px;
  background: #fff;
  color: var(--verde-escuro);
  font-size: 0.88rem;
  font-weight: 900;
}

.linha-estoque-item {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e6ece7;
  border-radius: 8px;
  background: #fff;
}

.linha-estoque-item span,
.linha-estoque-item small {
  display: block;
}

.linha-estoque-item span {
  color: var(--texto);
  font-weight: 850;
  overflow-wrap: anywhere;
}

.linha-estoque-item select {
  width: 100%;
  height: 40px;
  border: 1px solid var(--linha);
  border-radius: 8px;
  background: #fff;
  color: var(--texto);
  padding: 0 10px;
}

.pedido-entrega__observacao {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff7df;
}

@media (min-width: 760px) {
  .entregador-layout {
    grid-template-columns: minmax(330px, 0.42fr) minmax(0, 1fr);
    align-items: start;
  }

  .painel-rota {
    position: sticky;
    top: 16px;
  }

  .acoes-rota {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .acoes-status-rota {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pedido-entrega__topo {
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
  }

  .pedido-entrega__grid {
    grid-template-columns: minmax(0, 1.2fr) minmax(190px, 0.8fr);
  }

  .linha-estoque-item {
    grid-template-columns: minmax(0, 1fr) minmax(210px, 0.42fr);
    align-items: center;
  }
}
</style>
