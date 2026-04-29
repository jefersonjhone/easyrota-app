import type React from 'react'
import SocialIcon from "./SocialIcon"

import type { SocialLink } from './types'

const currentYear = () => new Date().getFullYear()

const CopyrightNotice = () => (
  <p className="max-w-2xl text-sm text-muted-foreground">
    © {currentYear()} EasyRota. Todos os direitos reservados. Projeto acadêmico fictício.
  </p>
)

type InnerFooterProps = {
  social: SocialLink[]
}

const InnerFooter: React.FC<InnerFooterProps> = ({ social }) => {
  return (
    <footer className="
      col-span-1 flex flex-col gap-6 
        sm:col-span-2 
        lg:col-span-4 lg:flex-row lg:items-center lg:justify-between 
      pt-6 lg:pt-7
      border-t border-border 
      ">
      <CopyrightNotice/>
      <section id="social" className="flex gap-3">
        {social.map((link: SocialLink) => (
          <SocialIcon key={link.href} href={link.href} label={link.label}>
            {link.icon}
          </SocialIcon>
        ))}
      </section>
    </footer>
  )
}

export default InnerFooter
