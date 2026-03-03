import Link from "next/link"

const linkColumns = [
  {
    title: "Links",
    links: [
      { label: "Loja", href: "/loja" },
      { label: "Categorias", href: "/categorias" },
      { label: "Sobre", href: "/sobre" },
    ],
  },
  {
    title: "Atendimento",
    links: [
      { label: "Contato", href: "/contato" },
      { label: "FAQ", href: "/faq" },
      { label: "Trocas e Devoluções", href: "/trocas" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Politica de Privacidade", href: "/privacidade" },
      { label: "Termos de Uso", href: "/termos" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-4">
            <span className="font-serif text-xl uppercase tracking-widest">
              QUADROS
            </span>
            <p className="text-sm leading-relaxed text-white/60">
              Quadros decorativos para transformar seus ambientes.
            </p>
          </div>

          {/* Link columns */}
          {linkColumns.map((column) => (
            <div key={column.title} className="space-y-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-white/40">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-white/40">
            {new Date().getFullYear()} Quadros Store. Todos os direitos reservados. v0.0.9
          </p>
        </div>
      </div>
    </footer>
  )
}
