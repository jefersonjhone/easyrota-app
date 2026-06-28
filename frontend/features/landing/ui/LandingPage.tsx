import { motion } from "motion/react"
import {
  Lock,
  Users,
  CheckCircle,
  Bus,
  Star,
  InstagramLogo,
  FacebookLogo,
} from "@phosphor-icons/react"
import easyLogo from "@assets/landing/easy.jpeg"

const tickerItems = [
  "GESTAO DE QUORUM",
  "CONFIRMACAO DIGITAL",
  "NOTIFICACOES AUTOMATICAS",
  "FEIRA DE SANTANA -> SALVADOR",
  "PARCERIA UNINFRA",
  "TRANSPORTE UNIVERSITARIO",
]

const steps = [
  { icon: Lock, title: "Login", desc: "Acesse a plataforma com seu vinculo institucional para liberar seu servidor da universidade." },
  { icon: Users, title: "Quorum", desc: "Confirme sua presenca na rota. A viagem e liberada assim que o numero minimo de passageiros for atingido." },
  { icon: CheckCircle, title: "Check-in", desc: "No dia da viagem, faca o check-in digital pela plataforma para confirmar seu embarque." },
  { icon: Bus, title: "Viaje!", desc: "Embarque com tranquilidade. A rota sai pontualmente, com lista de passageiros confirmados." },
]

const stats = [
  { value: "1", unit: "rota", label: "Feira de Santana - Salvador" },
  { value: "R$", unit: "0", label: "Sem custo para o passageiro" },
  { value: "4", unit: "passos", label: "Para confirmar sua viagem" },
  { value: "24", unit: "h", label: "Monitoramento de quorum" },
]

const reviews = [
  {
    name: "Maria Aparecida",
    role: "Feira de Santana - Salvador",
    initials: "MA",
    quote: "Antes ficavamos no grupo de WhatsApp tentando organizar quem ia ou nao ia. Com a EasyRota, confirmo minha presenca em segundos e sei se a rota vai sair com antecedencia.",
  },
  {
    name: "Joao Ferreira",
    role: "Servidor universitario - UEFS",
    initials: "JF",
    quote: "A plataforma resolveu o problema de organizacao que a gente tinha ha anos. Agora o quorum e monitorado em tempo real e o onibus sai na hora certa.",
  },
  {
    name: "Claudia Rodrigues",
    role: "Professora - Feira de Santana",
    initials: "CR",
    quote: "Simples, direto e sem burocracia. Login, confirmo presenca e pronto. Recebo a notificacao quando o quorum e atingido. Exatamente o que faltava para nossa rota.",
  },
]

const revealProps = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
} as const

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">

      {/* ─── Nav ─── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src={easyLogo} alt="" className="h-7 w-7 rounded-full object-cover" />
            <a href="/" className="whitespace-nowrap text-xl font-bold leading-none text-foreground sm:text-2xl">
              Easy<span className="text-primary">Rota</span>
            </a>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <a
              href="/login"
              className="inline-flex min-h-[36px] items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
            >
              ENTRAR
            </a>
          </div>
        </div>
      </header>

      <main>

        {/* ─── Hero ─── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="bg-muted px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-center gap-3 text-center">
              <img
                src={easyLogo}
                alt=""
                className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20"
              />
              <span className="mt-2 inline-block text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Plataforma institucional de gestao de quorum
              </span>
            </div>
            <div className="mx-auto mt-6 max-w-4xl text-center">
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                De onde voce esta ate onde precisa chegar.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Plataforma de gestao de quorum para transporte intermunicipal
                universitario. Professores e servidores confirmam presenca, a rota
                sai quando o minimo e atingido.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:opacity-90"
              >
                ACESSAR PLATAFORMA
              </a>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-1.5 rounded-md border bg-background px-6 py-3 font-semibold text-foreground transition-colors hover:bg-muted"
              >
                COMO FUNCIONA
              </a>
            </div>
          </div>
        </motion.section>

        {/* ─── Recursos bar ─── */}
        <section className="border-y bg-background px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-2 text-sm font-medium text-muted-foreground">
            {tickerItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>

        {/* ─── Como funciona ─── */}
        <section id="como-funciona" className="bg-muted px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Como funciona
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Sem WhatsApp, sem planilha. A EasyRota centraliza a confirmacao de
                presenca e libera a rota automaticamente quando o quorum minimo e
                atingido.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => {
                const Icon = step.icon
                return (
                  <motion.article
                    key={step.title}
                    {...revealProps}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="rounded-xl border bg-card p-6"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon size={20} weight="duotone" />
                    </div>
                    <h3 className="mt-4 text-base font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── Rota ─── */}
        <section id="rotas" className="bg-background px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Uma rota. Feita para voce.
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <motion.article
                {...revealProps}
                className="relative flex min-h-[380px] flex-col overflow-hidden rounded-xl border bg-card"
              >
                <div
                  className="absolute inset-0 opacity-[0.06]"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 22% 28%, var(--primary) 0 9px, transparent 10px),
                      radial-gradient(circle at 74% 68%, var(--foreground) 0 9px, transparent 10px),
                      linear-gradient(135deg, transparent 48%, var(--border) 49% 51%, transparent 52%),
                      repeating-linear-gradient(45deg, var(--foreground) 0 1px, transparent 1px 18px)
                    `,
                  }}
                />
                <div className="relative z-10 flex flex-1 flex-col justify-end p-6">
                  <span className="mb-3 inline-flex self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Unica rota disponivel
                  </span>
                  <div className="rounded-lg border bg-background/95 p-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Rota diaria
                    </span>
                    <strong className="mt-1 block text-xl leading-tight sm:text-2xl">
                      Feira de Santana - Salvador
                    </strong>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Bahia - 110 km - aprox. 1h30
                    </p>
                  </div>
                </div>
              </motion.article>

              <motion.article
                {...revealProps}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl border bg-card p-6 sm:p-8"
              >
                <div className="mb-5 rounded-md border-l-4 border-primary bg-primary/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  Aviso: a parceria com a Uninfra e inteiramente ficticia e existe
                  apenas para fins academicos.
                </div>

                <h3 className="text-xl font-bold leading-tight sm:text-2xl">
                  Operado em parceria com a{" "}
                  <span className="text-primary">Uninfra</span>
                </h3>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  A EasyRota atua em conjunto com a Uninfra para operar a rota
                  intermunicipal que atende professores e servidores da universidade.
                  Os custos da passagem sao cobertos pelo convenio institucional, o
                  passageiro so precisa confirmar presenca.
                </p>

                <ul className="mt-5 grid gap-2 text-sm leading-relaxed text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground" />
                    Sem custo para o passageiro
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground" />
                    Rota confirmada via quorum digital
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-muted-foreground" />
                    Exclusiva para professores e servidores universitarios
                  </li>
                </ul>

                <a
                  href="/login"
                  className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
                >
                  ACESSAR PLATAFORMA
                </a>
              </motion.article>
            </div>
          </div>
        </section>

        {/* ─── Stats ─── */}
        <section className="bg-muted px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
              {stats.map((stat) => (
                <motion.article
                  key={stat.label}
                  {...revealProps}
                  className="bg-card p-6 sm:p-8"
                >
                  <strong className="flex items-end gap-1.5 text-3xl font-bold tracking-tight leading-none sm:text-4xl">
                    {stat.value}
                    <span className="text-base font-semibold leading-tight text-primary sm:text-lg">
                      {stat.unit}
                    </span>
                  </strong>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {stat.label}
                  </p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Depoimentos ─── */}
        <section id="depoimentos" className="bg-background px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Depoimentos
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <motion.article
                  key={review.name}
                  {...revealProps}
                  className="flex min-h-[280px] flex-col justify-between rounded-xl border bg-card p-6 sm:p-8"
                >
                  <div>
                    <div className="flex gap-0.5 text-primary/70">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} weight="fill" />
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      {review.quote}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-3 border-t pt-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {review.initials}
                    </span>
                    <div>
                      <strong className="block text-sm font-semibold">
                        {review.name}
                      </strong>
                      <small className="text-xs text-muted-foreground">{review.role}</small>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="bg-muted px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Acesso a plataforma
            </span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pronto para confirmar sua presenca?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Acesse o app, confirme presenca na rota e embarque sem preocupacao,
              sem custo, sem WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:opacity-90"
              >
                ACESSAR PLATAFORMA
              </a>
              <a
                href="/sobre-projeto"
                className="inline-flex items-center justify-center rounded-md border bg-background px-6 py-3 font-semibold text-foreground transition-colors hover:bg-muted"
              >
                SOBRE O PROJETO
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_0.7fr_0.7fr]">
          <div>
            <a href="/" className="text-xl font-bold">
              Easy<span className="text-primary">Rota</span>
            </a>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Plataforma de gestao de quorum para transporte intermunicipal
              universitario. Em parceria com a Uninfra, conectando Feira de
              Santana a Salvador.
            </p>
            <p className="mt-4 text-xs font-semibold text-primary">
              Desde 2026
            </p>
            <div className="mt-4 rounded-md border bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              Projeto academico ficticio — EXA613 / PBL. A EasyRota nao existe
              como pessoa juridica. A parceria com a Uninfra e simulada.
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Plataforma
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <a href="/" className="text-foreground transition-colors hover:text-primary">Inicio</a>
              <a href="/sobre-projeto" className="text-foreground transition-colors hover:text-primary">Sobre o projeto</a>
              <a href="/equipe" className="text-foreground transition-colors hover:text-primary">Equipe</a>
              <a href="#depoimentos" className="text-foreground transition-colors hover:text-primary">Depoimentos</a>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Redes sociais
            </h3>
            <div className="flex gap-2">
              <a
                href="https://www.instagram.com/uefsoficial/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <InstagramLogo size={14} weight="fill" />
              </a>
              <a
                href="https://www.facebook.com/PortalUEFS.br"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <FacebookLogo size={14} weight="fill" />
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-6xl border-t pt-4 text-xs text-muted-foreground/60">
          <p>&copy; 2026 EasyRota. Projeto academico ficticio. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
