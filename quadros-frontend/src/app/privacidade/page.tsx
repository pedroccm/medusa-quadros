export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl text-[#1a1a1a]">
        Politica de Privacidade
      </h1>
      <p className="mt-4 text-sm text-[#1a1a1a]/60">
        Ultima atualizacao: Março de 2026
      </p>

      <div className="mt-10 space-y-8 text-[#1a1a1a]/80 leading-relaxed">
        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">
            1. Coleta de Dados
          </h2>
          <p className="mt-4">
            Coletamos informacoes pessoais que voce nos fornece diretamente,
            como nome, email, endereco, telefone e dados de pagamento ao
            realizar uma compra. Tambem coletamos dados de navegacao
            automaticamente, como endereco IP, tipo de navegador e paginas
            visitadas.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">
            2. Uso dos Dados
          </h2>
          <p className="mt-4">Utilizamos seus dados para:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Processar e entregar seus pedidos</li>
            <li>Enviar atualizacoes sobre o status do pedido</li>
            <li>Fornecer suporte ao cliente</li>
            <li>Melhorar nosso site e servicos</li>
            <li>Enviar comunicacoes de marketing (com seu consentimento)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">3. Cookies</h2>
          <p className="mt-4">
            Utilizamos cookies para melhorar sua experiencia de navegacao,
            lembrar suas preferencias e analisar o trafego do site. Voce pode
            gerenciar suas preferencias de cookies nas configuracoes do seu
            navegador.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">
            4. Compartilhamento de Dados
          </h2>
          <p className="mt-4">
            Nao vendemos seus dados pessoais. Compartilhamos informacoes
            apenas com parceiros necessarios para a operacao do e-commerce,
            como processadores de pagamento e transportadoras, e quando
            exigido por lei.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">
            5. Direitos do Titular (LGPD)
          </h2>
          <p className="mt-4">
            De acordo com a Lei Geral de Protecao de Dados (Lei 13.709/2018),
            voce tem direito a:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Confirmar a existencia de tratamento de seus dados</li>
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a anonimizacao ou eliminacao de dados desnecessarios</li>
            <li>Revogar o consentimento a qualquer momento</li>
            <li>Solicitar a portabilidade dos dados</li>
          </ul>
          <p className="mt-4">
            Para exercer qualquer um desses direitos, entre em contato pelo
            email <strong>contato@quadrosstore.com.br</strong>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">
            6. Seguranca
          </h2>
          <p className="mt-4">
            Adotamos medidas tecnicas e organizacionais para proteger seus
            dados pessoais contra acesso nao autorizado, perda ou destruicao.
            Utilizamos criptografia SSL em todas as transacoes.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl text-[#1a1a1a]">7. Contato</h2>
          <p className="mt-4">
            Duvidas sobre esta politica? Entre em contato pelo email{" "}
            <strong>contato@quadrosstore.com.br</strong>.
          </p>
        </section>
      </div>
    </div>
  )
}
