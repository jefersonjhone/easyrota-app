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
          <Section.Link href="/sobre">Sobre o projeto</Section.Link>
          <Section.Link href="/contatos">Como funciona</Section.Link>
          <Section.Link href="/rotas">A rota</Section.Link>
          <Section.Link href="/equipe">Equipe</Section.Link>
        </Section>

        <Section title="Viagem">
          <Section.Link href="/#app">Confirmar presença</Section.Link>
          <Section.Link href="/#historico">Histórico</Section.Link>
          <Section.Link href="/#notificacoes">Notificações</Section.Link>
          <Section.Link href="/#checkin">Check-in</Section.Link>
        </Section>

        <Section title="Acadêmico">
          <Section.Link href="#exa613">EXA613 / PBL</Section.Link>
          <Section.Link href="#github">Repositório GitHub</Section.Link>
          <Section.Link href="#documentacao">Documentação</Section.Link>
          <Section.Link href="#aviso-legal">Aviso legal</Section.Link>
        </Section>

        <Bottom />
      </div>
    </footer>
  )
}

export default Footer