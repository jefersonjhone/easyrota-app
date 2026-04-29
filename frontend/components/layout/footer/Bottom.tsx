import type React from 'react'
import SocialIcon from "./SocialIcon"

const currentYear = () => new Date().getFullYear()

const CopyrightNotice = () => (
  <p className="max-w-2xl text-sm text-muted-foreground">
    © {currentYear()} EasyRota. Todos os direitos reservados. Projeto acadêmico fictício.
  </p>
)

type SocialLink = {
  href: string
  label: string
  icon: React.ReactNode
}

type BottomProps = {
  social: SocialLink[]
}

const Bottom: React.FC<BottomProps> = ({ social }) => {
  return (
    <div className="col-span-1 flex flex-col gap-6 border-t border-border pt-6 sm:col-span-2 lg:col-span-4 lg:flex-row lg:items-center lg:justify-between lg:pt-7">
      <CopyrightNotice/>
      <div className="flex gap-3">
        {social.map((link: SocialLink) => (
          <SocialIcon key={link.href} href={link.href} label={link.label}>
            {link.icon}
          </SocialIcon>
        ))}
      </div>
    </div>
  )
}

export default Bottom
