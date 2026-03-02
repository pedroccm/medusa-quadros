import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="font-serif text-6xl text-[#1a1a1a]">404</h1>
      <p className="mt-4 text-lg text-[#1a1a1a]/60">Pagina nao encontrada</p>
      <p className="mt-2 text-sm text-[#1a1a1a]/40">
        A pagina que voce procura nao existe ou foi removida.
      </p>
      <div className="mt-8 flex gap-4">
        <Button asChild variant="outline">
          <Link href="/">Voltar ao inicio</Link>
        </Button>
        <Button asChild className="bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90">
          <Link href="/loja">Explorar loja</Link>
        </Button>
      </div>
    </div>
  )
}
