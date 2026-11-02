import { currencyDecimals, currencySymbol } from './reference'

/** Formats a minor-unit amount with the store's currency settings, e.g. 249900 → "€2,499.00". */
export const formatPrice = (minor: number, settings: Record<string, any>): string => {
  const c = settings.currency ?? {}
  const code = c.code ?? 'EUR'
  const decimals = typeof c.decimals === 'number' ? c.decimals : currencyDecimals(code)
  const value = (minor / 10 ** currencyDecimals(code)).toFixed(decimals)
  const [whole, fraction] = value.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, c.thousandSeparator ?? ',')
  const number = fraction ? `${grouped}${c.decimalSeparator ?? '.'}${fraction}` : grouped
  const symbol = currencySymbol(code)
  switch (c.position) {
    case 'right':
      return `${number}${symbol}`
    case 'left_space':
      return `${symbol} ${number}`
    case 'right_space':
      return `${number} ${symbol}`
    default:
      return `${symbol}${number}`
  }
}
