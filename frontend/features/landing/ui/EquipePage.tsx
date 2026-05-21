import easyLogo from '@assets/landing/easy.jpeg'
import adrieleImage from '@assets/landing/adriele.jpeg'
import daviImage from '@assets/landing/davi-fig.jpeg'
import guilhermeImage from '@assets/landing/guilherme.jpeg'
import jeffersonImage from '@assets/landing/jefferson-jhone.jpeg'
import joaoImage from '@assets/landing/joao-victor.jpeg'
import lucasImage from '@assets/landing/lucas-damasceno.jpeg'
import luizImage from '@assets/landing/luiz-sena.jpeg'
import matheusImage from '@assets/landing/matheus-c.jpeg'
import pauloImage from '@assets/landing/paulo.jpeg'
import tiagoImage from '@assets/landing/tiago.jpeg'
import viniciusImage from '@assets/landing/vinicius-everton.jpeg'
import './EquipePage.css'

const leadership = [
  {
    name: 'Luiz Sena - Gerente de projeto',
    href: 'https://github.com/Sena01Tech',
    image: luizImage,
  },
  {
    name: 'Lucas Damasceno - Lider tecnico',
    href: 'https://www.linkedin.com/in/lucas-damasceno-dev',
    image: lucasImage,
  },
  {
    name: 'Paulo Henrique - Lider tecnico',
    href: 'https://github.com/RickBarretto',
    image: pauloImage,
  },
]

const productTeam = [
  {
    name: 'Matheus Coelho - Designer UI',
    href: 'https://www.linkedin.com/in/matheus-coelho-3b1579345/',
    image: matheusImage,
  },
  {
    name: 'Davi Figueredo - Designer UX',
    href: 'https://github.com/Figueredo-D',
    image: daviImage,
  },
  {
    name: 'Jefferson Jhone - Desenvolvedor frontend',
    href: 'https://github.com/jefersonjhone',
    image: jeffersonImage,
  },
  {
    name: 'Everton Vinicius - Analista de requisitos',
    href: 'https://github.com/vini464',
    image: viniciusImage,
  },
]

const platformTeam = [
  {
    name: 'Tiago Moura - Desenvolvedor backend',
    href: 'https://www.linkedin.com/in/tiago-figueiredo-moura-2925701a3',
    image: tiagoImage,
  },
  {
    name: 'Guilherme Moreira - Banco de dados',
    href: 'https://github.com/GuiSantosHashDaSilva',
    image: guilhermeImage,
  },
  {
    name: 'Adriele Gimenes - Qualidade e testes',
    href: 'https://www.linkedin.com/in/gimenesz/',
    image: adrieleImage,
  },
  {
    name: 'Joao Victor - Documentacao',
    href: 'https://www.linkedin.com/in/jo%C3%A3o-victor-anuncia%C3%A7%C3%A3o-da-silva/',
    image: joaoImage,
  },
]

type TeamMember = {
  name: string
  href: string
  image: string
}

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <article className="team-card">
      <img src={member.image} alt={`Foto de ${member.name}`} />
      <a href={member.href} target="_blank" rel="noopener noreferrer" className="member-link">
        {member.name}
      </a>
    </article>
  )
}

export function EquipePage() {
  return (
    <div className="landing-subpage team-page">
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
        <section id="equipe" className="team-hero">
          <div className="team-hero-content">
            <span className="eyebrow">A equipe</span>
            <h1>As pessoas por trás da EasyRota</h1>
            <p>
              Organização, tecnologia e experiência trabalhando juntas para
              transformar o transporte em um processo simples, claro e confiável.
            </p>
          </div>
        </section>

        <section className="team-section team-section-featured">
          <div className="team-container">
            <div className="section-heading">
              <span className="eyebrow">Direção do projeto</span>
              <h2>Núcleo principal</h2>
            </div>

            <div className="team-grid team-grid-three">
              {leadership.map((member) => (
                <TeamCard key={member.name} member={member} />
              ))}
            </div>
          </div>
        </section>

        <section className="team-section">
          <div className="team-container">
            <div className="section-heading">
              <span className="eyebrow">Produto e interface</span>
              <h2>Experiência do usuário</h2>
            </div>

            <div className="team-grid team-grid-four">
              {productTeam.map((member) => (
                <TeamCard key={member.name} member={member} />
              ))}
            </div>
          </div>
        </section>

        <section className="team-section team-section-dark">
          <div className="team-container">
            <div className="section-heading">
              <span className="eyebrow">Operação e tecnologia</span>
              <h2>Base da plataforma</h2>
            </div>

            <div className="team-grid team-grid-four">
              {platformTeam.map((member) => (
                <TeamCard key={member.name} member={member} />
              ))}
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
            <p>Plataforma de gestão de quórum para transporte intermunicipal universitário.</p>
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
