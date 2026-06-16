import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'

import iguanaImage from '@/assets/iguana-404.png'
import './NotFoundPage.css'

const REDIRECT_DELAY_SECONDS = 7

export function NotFoundPage() {
  const navigate = useNavigate()
  const [secondsLeft, setSecondsLeft] = React.useState(REDIRECT_DELAY_SECONDS)

  React.useEffect(() => {
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

  const redirectProgress =
    ((REDIRECT_DELAY_SECONDS - secondsLeft) / REDIRECT_DELAY_SECONDS) * 100

  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <section className="not-found-copy">
        <p className="not-found-kicker">Erro 404</p>
        <h1 id="not-found-title">Página não encontrada</h1>
        <p className="not-found-description">
          A iguana encontrou um galho sem saída. Você será redirecionado para o app
          em <strong>{secondsLeft}</strong> segundos.
        </p>

        <div className="not-found-countdown" aria-live="polite">
          <div className="not-found-countdown-label">
            <span>Redirecionando</span>
            <strong>{secondsLeft}s</strong>
          </div>
          <div
            className="not-found-progress"
            role="progressbar"
            aria-label="Progresso do redirecionamento"
            aria-valuemin={0}
            aria-valuemax={REDIRECT_DELAY_SECONDS}
            aria-valuenow={REDIRECT_DELAY_SECONDS - secondsLeft}
          >
            <span style={{ width: `${redirectProgress}%` }} />
          </div>
        </div>

        <div className="not-found-actions">
          <button
            className="not-found-primary-action"
            type="button"
            onClick={() => void navigate({ to: '/app', replace: true })}
          >
            Ir para o app agora
          </button>
          <a className="not-found-secondary-action" href="/">
            Voltar ao início
          </a>
        </div>
      </section>

      <section className="not-found-visual" aria-label="Iguana da página 404">
        <div className="not-found-number" aria-hidden="true">
          404
        </div>
        <img src={iguanaImage} alt="Iguana apoiada em um tronco" />
      </section>
    </main>
  )
}
