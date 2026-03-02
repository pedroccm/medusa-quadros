import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Quais sao as formas de pagamento?",
    answer:
      "Aceitamos pagamento via Mercado Pago, incluindo cartao de credito (parcelamento em ate 12x), cartao de debito, boleto bancario e Pix.",
  },
  {
    question: "Qual o prazo de entrega?",
    answer:
      "O prazo de entrega varia de acordo com a sua regiao. Para a capital de Sao Paulo, o prazo e de 3 a 5 dias uteis. Para demais regioes, de 7 a 15 dias uteis. O prazo exato sera calculado no checkout apos informar seu CEP.",
  },
  {
    question: "O frete e gratis?",
    answer:
      "Sim! Oferecemos frete gratis para compras acima de R$ 199,00. Para compras abaixo desse valor, o frete e calculado com base na regiao de entrega.",
  },
  {
    question: "Posso trocar ou devolver um produto?",
    answer:
      "Sim. Voce tem ate 7 dias corridos apos o recebimento para solicitar troca ou devolucao. O produto deve estar em sua embalagem original e sem sinais de uso. Consulte nossa pagina de Trocas e Devolucoes para mais detalhes.",
  },
  {
    question: "Os quadros ja vem com moldura?",
    answer:
      "Sim, todos os nossos quadros sao entregues com moldura e prontos para pendurar. A descricao de cada produto informa o tipo de moldura e acabamento.",
  },
  {
    question: "Como penduro o quadro na parede?",
    answer:
      "Cada quadro acompanha um kit de fixacao com instrucoes simples de instalacao. Voce vai precisar apenas de um prego ou parafuso, dependendo do peso do quadro.",
  },
  {
    question: "Posso personalizar um quadro?",
    answer:
      "No momento nao oferecemos personalizacao de quadros. Estamos sempre ampliando nossa colecao, entao fique de olho nas novidades!",
  },
  {
    question: "Como acompanho meu pedido?",
    answer:
      "Apos a confirmacao do pagamento, voce recebera um email com o codigo de rastreamento. Voce tambem pode acompanhar seus pedidos na area Minha Conta.",
  },
]

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl text-[#1a1a1a]">
        Perguntas Frequentes
      </h1>
      <p className="mt-4 text-[#1a1a1a]/60">
        Encontre respostas para as duvidas mais comuns sobre nossos produtos e
        servicos.
      </p>

      <Accordion type="single" collapsible className="mt-10">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-[#1a1a1a]">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-[#1a1a1a]/70 leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
