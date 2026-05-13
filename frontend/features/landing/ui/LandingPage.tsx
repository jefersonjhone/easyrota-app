import easyLogo from '@assets/landing/easy.jpeg'
import './LandingPage.css'

const tickerItems = [
  'GESTAO DE QUORUM',
  'CONFIRMACAO DIGITAL',
  'NOTIFICACOES AUTOMATICAS',
  'FEIRA DE SANTANA -> SALVADOR',
  'PARCERIA UNINFRA',
  'TRANSPORTE UNIVERSITARIO',
]

export function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="landing-nav" aria-label="Navegacao principal">
        <div className="left">
          <img className="logo" src={easyLogo} alt="Logo EasyRota" />
          <a href="/">
            Easy<span className="destaque">Rota</span>
          </a>
        </div>

        <div className="right">
          <a href="/login">
            <span>ENTRAR</span>
          </a>
        </div>
      </nav>

      <main>
        <section className="hero-section">
          <div className="hero-container">
            <div className="text">
              <h1>
                De onde
                <br />
                voce <span className="destaque">esta,</span>
                <br />
                ate onde
                <br />
                precisa
                <br />
                chegar.
              </h1>
              <p>
                Plataforma de gestao de quorum para transporte intermunicipal
                universitario. Professores e servidores confirmam presenca, a rota
                sai quando o minimo e atingido.
              </p>

              <div className="links">
                <a href="/login">
                  <span>VIAJAR</span>
                </a>
                <a href="#como-funciona">
                  <span>COMO FUNCIONA -&gt;</span>
                </a>
              </div>
            </div>

            <div className="foto">
              <img src={easyLogo} alt="Logo EasyRota" />
            </div>
          </div>
        </section>

        <section className="roller" aria-label="Recursos da plataforma">
          <div className="ticker">
            <div className="track">
              {[...tickerItems, ...tickerItems].map((item, index) => (
                <span key={`${item}-${index}`}>
                  {item}
                  <span className="dot">•</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="how-section">
          <div className="how-container">
            <div className="section-intro">
              <div>
                <span className="eyebrow">Processo simples</span>
                <h2>Como funciona</h2>
              </div>

              <p>
                Sem WhatsApp, sem planilha. A EasyRota centraliza a confirmacao de
                presenca e libera a rota automaticamente quando o quorum minimo e
                atingido.
              </p>
            </div>

            <div className="steps-box">
              <article className="step-card">
                <span className="step-number">01</span>
                <div className="step-icon">🔐</div>
                <h3>Login</h3>
                <p>
                  Acesse a plataforma com seu vinculo institucional para liberar seu
                  servidor da universidade.
                </p>
              </article>

              <article className="step-card">
                <span className="step-number">02</span>
                <div className="step-icon">👥</div>
                <h3>Quorum</h3>
                <p>
                  Confirme sua presenca na rota. A viagem e liberada assim que o
                  numero minimo de passageiros for atingido.
                </p>
              </article>

              <article className="step-card">
                <span className="step-number">03</span>
                <div className="step-icon">✅</div>
                <h3>Check-in</h3>
                <p>
                  No dia da viagem, faca o check-in digital pela plataforma para
                  confirmar seu embarque.
                </p>
              </article>

              <article className="step-card">
                <span className="step-number">04</span>
                <div className="step-icon">🚌</div>
                <h3>Viaje!</h3>
                <p>
                  Embarque com tranquilidade. A rota sai pontualmente, com lista de
                  passageiros confirmados.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="rotas" className="route-section">
          <div className="route-container">
            <span className="route-eyebrow">Rota ativa</span>
            <h2>
              Uma rota. <em>Feita para voce.</em>
            </h2>

            <div className="route-grid">
              <article className="route-map-card">
                <span className="route-badge">Unica rota disponivel</span>
                <div className="route-map-pattern" />

                <div className="route-map-text">
                  <span>Rota diaria</span>
                  <strong>Feira de Santana -&gt; Salvador</strong>
                  <p>Bahia · 110 km · aprox. 1h30</p>
                </div>
              </article>

              <article className="route-info-card">
                <div className="route-warning">
                  Aviso: a parceria com a Uninfra e inteiramente ficticia e existe
                  apenas para fins academicos.
                </div>

                <span className="eyebrow">Parceria operacional</span>
                <h3>
                  Operado em parceria com a <em>Uninfra</em>
                </h3>

                <p>
                  A EasyRota atua em conjunto com a Uninfra para operar a rota
                  intermunicipal que atende professores e servidores da universidade.
                  Os custos da passagem sao cobertos pelo convenio institucional, o
                  passageiro so precisa confirmar presenca.
                </p>

                <ul>
                  <li>Sem custo para o passageiro</li>
                  <li>Rota confirmada via quorum digital</li>
                  <li>Exclusiva para professores e servidores universitarios</li>
                </ul>

                <a href="/login" className="route-button">
                  VIAJAR -&gt;
                </a>
              </article>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="stats-container">
            <article className="stat-item">
              <strong>
                1<span>rota</span>
              </strong>
              <p>Feira de Santana -&gt; Salvador</p>
            </article>

            <article className="stat-item">
              <strong>
                R$<span>0</span>
              </strong>
              <p>Sem custo para o passageiro</p>
            </article>

            <article className="stat-item">
              <strong>
                4<span>passos</span>
              </strong>
              <p>Para confirmar sua viagem</p>
            </article>

            <article className="stat-item">
              <strong>
                24<span>h</span>
              </strong>
              <p>Monitoramento de quorum</p>
            </article>
          </div>
        </section>

        <section id="depoimentos" className="reviews-section">
          <div className="reviews-container">
            <span className="eyebrow">O que dizem</span>
            <h2>Quem viajou, aprovou</h2>

            <div className="reviews-grid">
              <article className="review-card">
                <div className="stars">★★★★★</div>
                <p>
                  "Antes ficavamos no grupo de WhatsApp tentando organizar quem ia
                  ou nao ia. Com a EasyRota, confirmo minha presenca em segundos e
                  sei se a rota vai sair com antecedencia."
                </p>

                <div className="review-author">
                  <span>MA</span>
                  <div>
                    <strong>Prof. Maria Aparecida</strong>
                    <small>Feira de Santana -&gt; Salvador</small>
                  </div>
                </div>
              </article>

              <article className="review-card">
                <div className="stars">★★★★★</div>
                <p>
                  "A plataforma resolveu o problema de organizacao que a gente tinha
                  ha anos. Agora o quorum e monitorado em tempo real e o onibus sai
                  na hora certa."
                </p>

                <div className="review-author">
                  <span>JF</span>
                  <div>
                    <strong>Joao Ferreira</strong>
                    <small>Servidor universitario · UEFS</small>
                  </div>
                </div>
              </article>

              <article className="review-card">
                <div className="stars">★★★★★</div>
                <p>
                  "Simples, direto e sem burocracia. Login, confirmo presenca e
                  pronto. Recebo a notificacao quando o quorum e atingido. Exatamente
                  o que faltava para nossa rota."
                </p>

                <div className="review-author">
                  <span>CR</span>
                  <div>
                    <strong>Claudia Rodrigues</strong>
                    <small>Professora · Feira de Santana</small>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="app" className="cta-section">
          <div className="cta-bg-text">EASYROTA</div>

          <div className="cta-content">
            <h2>
              Pronto para confirmar
              <br />
              sua presenca?
            </h2>
            <p>
              Acesse o app, confirme presenca na rota e embarque sem preocupacao,
              sem custo, sem WhatsApp.
            </p>
            <a href="/login" className="cta-button">
              VAMOS LA -&gt;
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              Easy<span>Rota</span>
            </a>

            <p>
              Plataforma de gestao de quorum para transporte intermunicipal
              universitario. Em parceria com a Uninfra, conectando Feira de
              Santana a Salvador.
            </p>

            <strong className="footer-since">✦ Desde 2026</strong>

            <div className="footer-warning">
              ⚠ Projeto academico ficticio — EXA613 / PBL. A EasyRota nao existe
              como pessoa juridica. A parceria com a Uninfra e simulada.
            </div>
          </div>

          <div className="footer-column">
            <h3>Plataforma</h3>
            <a href="/">Inicio</a>
            <a href="/sobre-projeto">Sobre o projeto</a>
            <a href="/equipe">Equipe</a>
            <a href="#depoimentos">Depoimentos</a>
          </div>

          <div className="footer-column">
            <h3>Redes sociais</h3>
            <a
              href="https://www.instagram.com/uefsoficial/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
            <a
              href="https://www.facebook.com/PortalUEFS.br"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 EasyRota. Todos os direitos reservados. Projeto academico ficticio.</p>
        </div>
      </footer>
    </div>
  )
}
