"use client"

import { Button } from "@/components/ui/button"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="font-serif text-4xl text-[#1a1a1a]">Algo deu errado</h1>
      <p className="mt-4 text-sm text-[#1a1a1a]/60">
        Ocorreu um erro inesperado. Por favor, tente novamente.
      </p>
      <Button
        onClick={reset}
        className="mt-8 bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90"
      >
        Tentar novamente
      </Button>
    </div>
  )
}
