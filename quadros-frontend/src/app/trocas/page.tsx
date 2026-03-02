export default function ExchangesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl text-[#1a1a1a]">
        Trocas e Devolucoes
      </h1>

      <div className="mt-10 space-y-10 text-[#1a1a1a]/80 leading-relaxed">
        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">Prazo</h2>
          <p className="mt-4">
            Voce tem ate <strong>7 dias corridos</strong> apos o recebimento do
            produto para solicitar a troca ou devolucao, conforme previsto no
            Codigo de Defesa do Consumidor (Art. 49).
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">Condicoes</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>O produto deve estar em sua embalagem original.</li>
            <li>
              O produto nao pode apresentar sinais de uso, danos ou alteracoes.
            </li>
            <li>Deve acompanhar todos os acessorios e etiquetas originais.</li>
            <li>
              Produtos danificados no transporte devem ser fotografados e
              reportados em ate 48 horas.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">
            Como Solicitar
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-6">
            <li>
              Entre em contato pelo email{" "}
              <strong>contato@quadrosstore.com.br</strong> informando o numero
              do pedido e o motivo da troca/devolucao.
            </li>
            <li>
              Nossa equipe ira avaliar a solicitacao e responder em ate 2 dias
              uteis com as instrucoes para envio.
            </li>
            <li>
              Apos o recebimento e analise do produto, realizaremos a troca ou
              o reembolso em ate 10 dias uteis.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">Reembolso</h2>
          <p className="mt-4">
            O reembolso sera realizado pela mesma forma de pagamento utilizada
            na compra. Para pagamentos via cartao de credito, o estorno pode
            levar ate 2 faturas para aparecer, dependendo da operadora.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">Frete</h2>
          <p className="mt-4">
            Em caso de defeito de fabricacao ou erro no envio, o frete de
            devolucao sera por nossa conta. Em casos de arrependimento da
            compra, o frete de devolucao sera de responsabilidade do cliente.
          </p>
        </section>
      </div>
    </div>
  )
}
