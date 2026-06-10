export const currency = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const qty = (n) =>
  Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })
