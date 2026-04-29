import logo from "@/assets/logo-light-mode.svg"

const Footer = () => {
  return (
    <footer className="border-t border-border/70 bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-12 lg:px-8 lg:py-10">
        <div className="lg:pr-8">
          <a href="/" className="mb-4 inline-flex items-center gap-3 text-foreground transition-colors hover:text-primary">
            <img src={logo} alt="EasyRota" className="h-10 w-10" />
            <span className="font-heading text-2xl font-semibold tracking-tight">
              Easy<span className="text-primary">Rota</span>
            </span>
          </a>

          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Plataforma acadêmica fictícia para gestão de quórum e presença no transporte
            intermunicipal universitário.
          </p>

          <strong className="mt-5 block text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Desde 2026
          </strong>

          <div className="mt-5 max-w-md rounded-lg border border-border bg-background/70 px-4 py-3 text-xs leading-6 text-muted-foreground">
            Projeto acadêmico fictício — EXA613 / PBL. A EasyRota não existe como pessoa
            jurídica; a parceria com a Uninfra é simulada.
          </div>
        </div>

        <div>
          <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-foreground">
            Plataforma
          </h3>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <a className="w-fit transition-colors hover:text-primary" href="#sobre">
              Sobre o projeto
            </a>
            <a className="w-fit transition-colors hover:text-primary" href="#contatos">
              Como funciona
            </a>
            <a className="w-fit transition-colors hover:text-primary" href="#rotas">
              A rota
            </a>
            <a className="w-fit transition-colors hover:text-primary" href="#equipe">
              Equipe
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-foreground">
            Viagem
          </h3>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <a className="w-fit transition-colors hover:text-primary" href="#app">
              Confirmar presença
            </a>
            <a className="w-fit transition-colors hover:text-primary" href="#historico">
              Histórico
            </a>
            <a className="w-fit transition-colors hover:text-primary" href="#notificacoes">
              Notificações
            </a>
            <a className="w-fit transition-colors hover:text-primary" href="#checkin">
              Check-in
            </a>
          </div>
        </div>

        <div>
          <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-foreground">
            Acadêmico
          </h3>
          <div className="flex flex-col gap-3 text-sm text-muted-foreground">
            <a className="w-fit transition-colors hover:text-primary" href="#exa613">
              EXA613 / PBL
            </a>
            <a className="w-fit transition-colors hover:text-primary" href="#github">
              Repositório GitHub
            </a>
            <a className="w-fit transition-colors hover:text-primary" href="#documentacao">
              Documentação
            </a>
            <a className="w-fit transition-colors hover:text-primary" href="#aviso-legal">
              Aviso legal
            </a>
          </div>
        </div>

        <div className="col-span-1 flex flex-col gap-6 border-t border-border pt-6 md:col-span-2 lg:col-span-4 lg:flex-row lg:items-center lg:justify-between lg:pt-7">
          <p className="max-w-2xl text-sm text-muted-foreground">
            © 2026 EasyRota. Todos os direitos reservados. Projeto acadêmico fictício.
          </p>

          <div className="flex gap-3">
            <a
              href="#"
              aria-label="Instagram"
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              ig
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              fb
            </a>
            <a
              href="#"
              aria-label="GitHub"
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-background text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              gh
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer