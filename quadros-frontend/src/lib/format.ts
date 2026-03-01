export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount)
}

export function formatCEP(cep: string): string {
  return cep.replace(/(\d{5})(\d{3})/, "$1-$2")
}
