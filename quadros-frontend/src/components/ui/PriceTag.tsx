interface PriceTagProps {
  amount: number
  currencyCode?: string
  className?: string
}

export function PriceTag({
  amount,
  currencyCode = "BRL",
  className,
}: PriceTagProps) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currencyCode,
  }).format(amount)

  return <span className={className}>{formatted}</span>
}
