export default function ExchangesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl text-[#1a1a1a]">
        Trocas e Devoluções
      </h1>

      <div className="mt-10 space-y-10 text-[#1a1a1a]/80 leading-relaxed">
        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">Prazo</h2>
          <p className="mt-4">
            Você tem até <strong>7 dias corridos</strong> após o recebimento do
            produto para solicitar a troca ou devolução, conforme previsto no
            Código de Defesa do Consumidor (Art. 49).
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">Condições</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6">
            <li>O produto deve estar em sua embalagem original.</li>
            <li>
              O produto não pode apresentar sinais de uso, danos ou alterações.
            </li>
            <li>Deve acompanhar todos os acessórios e etiquetas originais.</li>
            <li>
              Produtos danificados no transporte devem ser fotografados e
              reportados em até 48 horas.
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
              <strong>contato@ariaquadros.com.br</strong> informando o número
              do pedido e o motivo da troca/devolução.
            </li>
            <li>
              Nossa equipe irá avaliar a solicitação e responder em até 2 dias
              úteis com as instruções para envio.
            </li>
            <li>
              Após o recebimento e análise do produto, realizaremos a troca ou
              o reembolso em até 10 dias úteis.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">Reembolso</h2>
          <p className="mt-4">
            O reembolso será realizado pela mesma forma de pagamento utilizada
            na compra. Para pagamentos via cartão de crédito, o estorno pode
            levar até 2 faturas para aparecer, dependendo da operadora.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">Frete</h2>
          <p className="mt-4">
            Em caso de defeito de fabricação ou erro no envio, o frete de
            devolução será por nossa conta. Em casos de arrependimento da
            compra, o frete de devolução será de responsabilidade do cliente.
          </p>
        </section>
      </div>
    </div>
  )
}
