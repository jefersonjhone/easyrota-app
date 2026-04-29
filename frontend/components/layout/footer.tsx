import Brand from "./footer/Brand"
import Section from "./footer/Section"
import Bottom from "./footer/Bottom"


type SectionData = {
  title: string
  links: { href: string, label: string}[]
}

const sections: SectionData[] = [
  {
    title: "Plataforma",
    links: [
      { href: "/sobre", label: "Sobre o projeto" },
      { href: "/contatos", label: "Como funciona" },
      { href: "/rotas", label: "A rota" },
      { href: "/equipe", label: "Equipe" },
    ]
  },
  {
    title: "Viagem",
    links: [
      { href: "/#app", label: "Confirmar presença" },
      { href: "/#historico", label: "Histórico" },
      { href: "/#notificacoes", label: "Notificações" },
      { href: "/#checkin", label: "Check-in" },
    ]
  },
  {
    title: "Acadêmico",
    links: [
      { href: "#exa613", label: "EXA613 / PBL" },
      { href: "#github", label: "Repositório GitHub" },
      { href: "#documentacao", label: "Documentação" },
      { href: "#aviso-legal", label: "Aviso legal" },
    ]
  }
]

const Footer = () => {
  return (
    <footer className="border-t border-border/70 bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-x-6 gap-y-8 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-x-12 lg:gap-y-10 lg:px-8 lg:py-10">
        <Brand>
          <Brand.Description>
            Plataforma acadêmica fictícia para gestão de quórum e presença no transporte
          </Brand.Description>
          <Brand.Callout>
            Projeto acadêmico fictício — EXA613 / PBL. 
            A EasyRota não existe como pessoa jurídica; 
            a parceria com a Uninfra é simulada.
          </Brand.Callout>
        </Brand>

        {sections.map((section) => (
          <Section key={section.title} title={section.title}>
            {section.links.map((link) => (
              <Section.Link key={link.href} href={link.href}>
                {link.label}
              </Section.Link>
            ))}
          </Section>
        ))}

        <Bottom />
      </div>
    </footer>
  )
}

export default Footer