import InnerHeader from "./footer/InnerHeader"
import Section from "./footer/Section"
import InnerFooter from "./footer/InnerFooter"

import { InstagramLogoIcon, FacebookLogoIcon, GithubLogoIcon } from "@phosphor-icons/react"
import { routes, externalRoutes } from '@/routes'

type SectionData = {
  title: string
  links: { href: string, label: string}[]
}

const sections: SectionData[] = [
  {
    title: "Plataforma",
    links: [
      { href: routes.public.about(), label: "Sobre o projeto" },
      { href: routes.public.contacts(), label: "Como funciona" },
      { href: routes.public.routes(), label: "A rota" },
      { href: routes.public.team(), label: "Equipe" },
    ]
  },
  {
    title: "Viagem",
    links: [
      { href: routes.public.features.confirm(), label: "Confirmar presença" },
      { href: routes.public.features.history(), label: "Histórico" },
      { href: routes.public.features.notifications(), label: "Notificações" },
      { href: routes.public.features.checkin(), label: "Check-in" },
    ]
  },
  {
    title: "Acadêmico",
    links: [
      { href: externalRoutes.academic.exa613(), label: "EXA613 / PBL" },
      { href: externalRoutes.github.repo(), label: "Repositório GitHub" },
      { href: externalRoutes.github.docs(), label: "Documentação" },
      { href: routes.public.legal(), label: "Aviso legal" },
    ]
  }
]

const socialLinks = [
  { href: externalRoutes.instagram(), label: "Instagram", icon: <InstagramLogoIcon /> },
  { href: externalRoutes.facebook(), label: "Facebook", icon: <FacebookLogoIcon /> },
  { href: externalRoutes.github.repo(), label: "GitHub", icon: <GithubLogoIcon /> }
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