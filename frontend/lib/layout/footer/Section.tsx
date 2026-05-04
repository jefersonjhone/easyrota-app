import type { FC, ReactNode } from 'react'

type SectionProps = {
  title: string
  children?: ReactNode
}

type LinkProps = {
  href: string
  children?: ReactNode
}

const Link: FC<LinkProps> = ({ href, children }) => {
  return (
    <a className="w-fit transition-colors hover:text-primary" href={href}>
      {children}
    </a>
  )
}

const SectionBase: FC<SectionProps> = ({ title, children }) => {
  return (
    <div>
      <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-foreground">
        {title}
      </h3>
      <div className="flex flex-col gap-3 text-sm text-muted-foreground">
        {children}
      </div>
    </div>
  )
}

const Section = Object.assign(SectionBase, { Link }) as FC<SectionProps> & {
  Link: typeof Link
}

export default Section
