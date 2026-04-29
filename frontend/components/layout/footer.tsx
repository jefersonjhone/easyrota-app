import Brand from "./footer/Brand"
import FooterColumn from "./footer/Column"
import FooterBottom from "./footer/Bottom"

const description = 'Plataforma acadêmica fictícia para gestão de quórum e presença no transporte'
const warning = 'Projeto acadêmico fictício — EXA613 / PBL. A EasyRota não existe como pessoa jurídica; a parceria com a Uninfra é simulada.'

const Footer = () => {
  return (
    <footer className="border-t border-border/70 bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-12 lg:px-8 lg:py-10">
        <Brand 
          description={description}
          warning={warning}
        />

        <FooterColumn title="Plataforma">
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
        </FooterColumn>

        <FooterColumn title="Viagem">
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
        </FooterColumn>

        <FooterColumn title="Acadêmico">
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
        </FooterColumn>

        <FooterBottom />
      </div>
    </footer>
  )
}

export default Footer