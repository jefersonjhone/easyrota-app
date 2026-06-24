import InnerFooter from "@layout/footer/InnerFooter"
import Section from "@layout/footer/Section"

import { GithubLogoIcon } from "@phosphor-icons/react"



const socialLinks = [
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
      <Section title="Documentos">
        <Section.Link href="/termos-de-uso">Termos de Uso</Section.Link>
        <Section.Link href="/politica-de-privacidade">Política de Privacidade</Section.Link>
      </Section>

      <InnerFooter social={socialLinks} />
    </footer>
  )
}

export default Footer
