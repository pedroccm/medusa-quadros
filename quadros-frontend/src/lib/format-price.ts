/**
 * Format a price amount in BRL (Brazilian Real).
 * Medusa stores prices in cents, so we divide by 100.
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100)
}
