import Brand from "./footer/Brand"
import Section from "./footer/Section"
import Bottom from "./footer/Bottom"

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

        <Section title="Plataforma">
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
        </Section>

        <Section title="Viagem">
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
        </Section>

        <Section title="Acadêmico">
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
        </Section>

        <Bottom />
      </div>
    </footer>
  )
}

export default Footer