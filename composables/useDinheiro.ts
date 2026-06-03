export function useDinheiro() {
  const formatador = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })

  function formatarCentavos(valor: number) {
    return formatador.format(valor / 100)
  }

  function reaisParaCentavos(valor: string | number) {
    const texto = String(valor).replace(/\./g, '').replace(',', '.')
    return Math.round(Number(texto || 0) * 100)
  }

  function centavosParaReais(valor: number) {
    return (valor / 100).toFixed(2).replace('.', ',')
  }

  return { formatarCentavos, reaisParaCentavos, centavosParaReais }
}
