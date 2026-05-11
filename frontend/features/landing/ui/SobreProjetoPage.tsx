import easyLogo from '@assets/landing/easy.jpeg'
import uefsImage from '@assets/landing/uefs.jpg'
import uninfraImage from '@assets/landing/uninfra.jpeg'
import './SobreProjetoPage.css'

export function SobreProjetoPage() {
  return (
    <div className="landing-subpage project-page">
      <nav className="landing-subnav" aria-label="Navegacao principal">
        <div className="left">
          <img className="logo" src={easyLogo} alt="Logo EasyRota" />
          <a href="/">
            Easy<span className="destaque">Rota</span>
          </a>
        </div>

        <div className="right">
          <a href="/">
            <span>Home</span>
          </a>
        </div>
      </nav>

      <main>
        <section className="project-hero">
          <div className="project-hero-content">
            <span className="eyebrow">Sobre o projeto</span>
            <h1>Mobilidade universitaria com organizacao digital</h1>
            <p>
              A EasyRota foi pensada como uma plataforma academica para facilitar a
              confirmacao de presenca, o controle de quorum e a gestao de rotas
              intermunicipais para a comunidade universitaria.
            </p>
          </div>
        </section>

        <section className="goal-section">
          <div className="project-container">
            <div className="goal-grid">
              <div>
                <span className="eyebrow">Objetivo</span>
                <h2>Reduzir incertezas antes da viagem</h2>
              </div>

              <div className="goal-text">
                <p>
                  O objetivo do projeto e centralizar a confirmacao de passageiros
                  em uma experiencia simples, substituindo combinados dispersos por
                  um sistema capaz de acompanhar o quorum em tempo real.
                </p>

                <p>
                  Com isso, professores e servidores sabem com antecedencia se a rota
                  sera realizada, enquanto a operacao ganha uma lista organizada de
                  usuarios confirmados para cada deslocamento.
                </p>
              </div>
            </div>

            <div className="goal-points">
              <article>
                <strong>01</strong>
                <h3>Confirmacao digital</h3>
                <p>
                  O usuario registra presenca direto na plataforma, sem depender de
                  grupos ou planilhas.
                </p>
              </article>

              <article>
                <strong>02</strong>
                <h3>Quorum minimo</h3>
                <p>
                  A rota so e liberada quando atinge o numero necessario de
                  passageiros confirmados.
                </p>
              </article>

              <article>
                <strong>03</strong>
                <h3>Operacao clara</h3>
                <p>
                  A equipe responsavel acompanha a demanda e organiza a viagem com
                  mais previsibilidade.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="institution-section">
          <div className="project-container institution-grid">
            <div className="institution-image">
              <img src={uefsImage} alt="Imagem da UEFS" />
            </div>

            <div className="institution-text">
              <span className="eyebrow">Instituicao</span>
              <h2>UEFS</h2>
              <p>
                A Universidade Estadual de Feira de Santana representa o contexto
                institucional do projeto. A proposta considera a rotina de
                professores e servidores que precisam se deslocar entre cidades para
                cumprir suas atividades academicas e administrativas.
              </p>

              <p>
                Dentro desse cenario, a EasyRota funciona como uma solucao de apoio:
                organiza a demanda, melhora a comunicacao da rota e oferece uma
                forma mais objetiva de confirmar a presenca dos passageiros.
              </p>
            </div>
          </div>
        </section>

        <section className="institution-section partner-section">
          <div className="project-container institution-grid partner-grid">
            <div className="institution-image">
              <img src={uninfraImage} alt="Imagem da Uninfra" />
            </div>

            <div className="institution-text">
              <span className="eyebrow">Parceria simulada</span>
              <h2>Uninfra</h2>
              <p>
                A Uninfra aparece no projeto como uma parceira operacional ficticia,
                responsavel por representar a estrutura que viabiliza a rota
                intermunicipal utilizada pela plataforma.
              </p>

              <p>
                Essa parceria e usada apenas para fins academicos, ajudando a simular
                como uma solucao real poderia conectar universidade, gestao de
                transporte e usuarios em um mesmo fluxo digital.
              </p>

              <div className="warning-box">
                Projeto academico ficticio. A EasyRota e a parceria com a Uninfra nao
                representam uma operacao real.
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="subpage-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              Easy<span>Rota</span>
            </a>
            <p>Plataforma de gestao de quorum para transporte intermunicipal universitario.</p>
          </div>

          <div className="footer-social-area">
            <h3>Redes sociais</h3>

            <div className="footer-social">
              <a
                href="https://www.instagram.com/uefsoficial/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                ig
              </a>
              <a
                href="https://www.facebook.com/PortalUEFS.br"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                fb
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
