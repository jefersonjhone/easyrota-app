import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import iguanaImage from '@/assets/iguana-404.png'
import { Button } from '@ui/button'

const REDIRECT_DELAY_SECONDS = 7

export function NotFoundPage() {
  const navigate = useNavigate()
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_DELAY_SECONDS)

  useEffect(() => {
    const countdownId = window.setInterval(() => {
      setSecondsLeft((currentSeconds) => Math.max(currentSeconds - 1, 0))
    }, 1000)

    const redirectId = window.setTimeout(() => {
      void navigate({ to: '/app', replace: true })
    }, REDIRECT_DELAY_SECONDS * 1000)

    return () => {
      window.clearInterval(countdownId)
      window.clearTimeout(redirectId)
    }
  }, [navigate])

  const redirectProgress = ((REDIRECT_DELAY_SECONDS - secondsLeft) / REDIRECT_DELAY_SECONDS) * 100

  return (
    <main className="grid min-h-svh items-center gap-8 overflow-hidden bg-muted px-6 py-10 md:grid-cols-[0.86fr_1.14fr] md:px-14" aria-labelledby="not-found-title">
      <section className="z-10 w-full max-w-lg">
        <p className="mb-4 border-l-4 border-primary pl-3 text-xs font-bold tracking-widest text-primary uppercase">Erro 404</p>

        <h1 id="not-found-title" className="text-5xl font-extrabold leading-none tracking-tight md:text-7xl">
          Pagina nao encontrada
        </h1>

        <p className="mt-5 max-w-md text-muted-foreground leading-relaxed">
          A iguana encontrou um galho sem saida. Voce sera redirecionado para o app
          em <strong className="text-foreground font-black">{secondsLeft}</strong> segundos.
        </p>

        <div className="mt-7 w-full max-w-sm">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Redirecionando</span>
            <strong className="text-foreground">{secondsLeft}s</strong>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full border bg-white/70"
            role="progressbar"
            aria-label="Progresso do redirecionamento"
            aria-valuemin={0}
            aria-valuemax={REDIRECT_DELAY_SECONDS}
            aria-valuenow={REDIRECT_DELAY_SECONDS - secondsLeft}
          >
            <span
              className="block h-full rounded-full bg-gradient-to-r from-primary to-chart-2 transition-[width] duration-250 ease-in-out"
              style={{ width: `${redirectProgress}%` }}
            />
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button onClick={() => void navigate({ to: '/app', replace: true })}>
            Ir para o app agora
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Voltar ao inicio</a>
          </Button>
        </div>
      </section>

      <section className="relative flex min-h-[280px] items-end justify-center md:min-h-[72vh]" aria-label="Iguana da pagina 404">
        <span className="pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 text-[clamp(8rem,20vw,18rem)] font-black leading-none text-primary/20 select-none md:text-[clamp(8rem,20vw,18rem)]">
          404
        </span>
        <div className="pointer-events-none absolute -right-40 bottom-1/3 aspect-square w-[clamp(280px,40vw,520px)] rounded-full border bg-primary mix-blend-multiply opacity-15" />
        <img
          src={iguanaImage}
          alt="Iguana apoiada em um tronco"
          className="relative z-10 w-[clamp(300px,90vw,680px)] max-w-none rounded-xl border object-cover shadow-lg mix-blend-multiply"
        />
      </section>
    </main>
  )
}
