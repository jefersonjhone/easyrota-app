import logo from "@/assets/logo-light-mode.svg"
import type React from 'react'

type Props = {
  description: string
}

const Brand: React.FC<Props> = ({ description }) => {
  return (
    <div className="lg:pr-8">
      <a href="/" className="mb-4 inline-flex items-center gap-3 text-foreground transition-colors hover:text-primary">
        <img src={logo} alt="EasyRota" className="h-10 w-10" />
        <span className="font-heading text-2xl font-semibold tracking-tight">
          <span className="text-primary">Easy</span>
          <span>Rota</span>
        </span>
      </a>

      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      <strong className="mt-5 block text-xs font-semibold uppercase tracking-[0.35em] text-primary">
        Desde 2026
      </strong>

      <div className="mt-5 max-w-md rounded-lg border border-border bg-background/70 px-4 py-3 text-xs leading-6 text-muted-foreground">
        Projeto acadêmico fictício — EXA613 / PBL. A EasyRota não existe como pessoa
        jurídica; a parceria com a Uninfra é simulada.
      </div>
    </div>
  )
}

export default Brand
