export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl text-[#1a1a1a]">Termos de Uso</h1>
      <p className="mt-4 text-sm text-[#1a1a1a]/60">
        Ultima atualizacao: Março de 2026
      </p>

      <div className="mt-10 space-y-8 text-[#1a1a1a]/80 leading-relaxed">
        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">
            1. Condicoes Gerais
          </h2>
          <p className="mt-4">
            Ao acessar e utilizar o site Quadros Store, voce concorda com
            estes Termos de Uso. Caso nao concorde com alguma condicao, por
            favor, nao utilize nosso site.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">2. Compras</h2>
          <p className="mt-4">
            Ao realizar uma compra, voce declara que as informacoes fornecidas
            sao verdadeiras e que esta autorizado a utilizar o meio de
            pagamento selecionado. Os precos e disponibilidade dos produtos
            estao sujeitos a alteracao sem aviso previo.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">3. Entregas</h2>
          <p className="mt-4">
            Os prazos de entrega sao estimados e podem variar conforme a
            regiao. A Quadros Store nao se responsabiliza por atrasos causados
            por transportadoras ou eventos de forca maior.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">
            4. Propriedade Intelectual
          </h2>
          <p className="mt-4">
            Todo o conteudo do site, incluindo imagens, textos, logotipos e
            design, e propriedade da Quadros Store e protegido por leis de
            direitos autorais. E proibida a reproducao sem autorizacao previa.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">
            5. Responsabilidades
          </h2>
          <p className="mt-4">
            A Quadros Store se empenha em manter as informacoes do site
            atualizadas e precisas, mas nao garante que o conteudo esteja
            livre de erros. O uso do site e por sua conta e risco.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">
            6. Cancelamento
          </h2>
          <p className="mt-4">
            Pedidos podem ser cancelados antes do envio entrando em contato
            com nosso atendimento. Apos o envio, aplicam-se as regras de
            trocas e devolucoes.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">
            7. Foro
          </h2>
          <p className="mt-4">
            Estes termos sao regidos pelas leis brasileiras. Quaisquer
            disputas serao resolvidas no foro da comarca da sede da empresa.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">8. Contato</h2>
          <p className="mt-4">
            Duvidas sobre estes termos? Entre em contato pelo email{" "}
            <strong>contato@quadrosstore.com.br</strong>.
          </p>
        </section>
      </div>
    </div>
  )
}
