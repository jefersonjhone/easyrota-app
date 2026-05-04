import InnerHeader from "@layout/footer/InnerHeader"
import Section from "@layout/footer/Section"
import InnerFooter from "@layout/footer/InnerFooter"

import { InstagramLogoIcon, FacebookLogoIcon, GithubLogoIcon } from "@phosphor-icons/react"

type SectionData = {
  title: string
  links: { href: string, label: string}[]
}

const sections: SectionData[] = [
  {
    title: "Plataforma",
    links: [
      { href: "#", label: "Sobre o projeto" },
      { href: "#", label: "Como funciona" },
      { href: "#", label: "A rota" },
      { href: "#", label: "Equipe" },
    ]
  },
  {
    title: "Viagem",
    links: [
      { href: "#", label: "Confirmar presença" },
      { href: "#", label: "Histórico" },
      { href: "#", label: "Notificações" },
      { href: "#", label: "Check-in" },
    ]
  },
  {
    title: "Acadêmico",
    links: [
      { href: "#", label: "EXA613 / PBL" },
      { href: "#", label: "Repositório GitHub" },
      { href: "#", label: "Documentação" },
      { href: "#", label: "Aviso legal" },
    ]
  }
]

const socialLinks = [
  { href: "#", label: "Instagram", icon: <InstagramLogoIcon /> },
  { href: "#", label: "Facebook", icon: <FacebookLogoIcon /> },
  { href: "https://github.com/EasyRota", label: "GitHub", icon: <GithubLogoIcon /> }
]

const Footer = () => {
  return (
    <footer className="
      grid grid-cols-1 gap-x-6 gap-y-8 
        sm:grid-cols-2 sm:px-6 
        lg:grid-cols-[1.6fr_1fr_1fr_1fr] 
      w-full max-w-6xl mx-auto px-4 py-8 
        lg:gap-x-12 lg:gap-y-10 lg:px-8 lg:py-10
      border-t border-border/70 bg-muted/30
    ">
      <InnerHeader>
        <InnerHeader.Description>
          Plataforma acadêmica fictícia para gestão de quórum e presença no transporte
        </InnerHeader.Description>
        <InnerHeader.Callout>
          Projeto acadêmico fictício — EXA613 / PBL. 
          A EasyRota não existe como pessoa jurídica; 
          a parceria com a Uninfra é simulada.
        </InnerHeader.Callout>
      </InnerHeader>

      {sections.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.links.map((link) => (
            <Section.Link key={link.href} href={link.href}>
              {link.label}
            </Section.Link>
          ))}
        </Section>
      ))}

      <InnerFooter social={socialLinks} />
    </footer>
  )
}

export default Footer