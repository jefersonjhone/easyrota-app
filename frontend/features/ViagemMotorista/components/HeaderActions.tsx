import { Button } from '@ui/button'
import {
  SignOutIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'

type Props = {
  onBack: () => void
  onStart: () => void
  onFinish: () => void
  whatsappAlertUrl: string
  isConfirmationLoading: boolean
  isStartDisabled: boolean
  isFinishDisabled: boolean
}

export function HeaderActions({
  onBack,
  onStart,
  onFinish,
  whatsappAlertUrl,
  isConfirmationLoading,
  isStartDisabled,
  isFinishDisabled,
}: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/90 p-2 md:p-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2 w-full">
        <Button
          type="button"
          variant="outline"
          className="rounded-lg" 
          onClick={onBack}
          disabled={isConfirmationLoading}
        >
          <SignOutIcon aria-hidden="true" weight="bold" />
          Voltar
        </Button>

        <Button
          type="button"
          className="rounded-lg border-green-600 bg-green-600  text-white hover:bg-green-700"
          onClick={onStart}
          hidden={isStartDisabled}
        >
          <PlayCircleIcon aria-hidden="true" weight="bold" />
          Iniciar viagem
        </Button>

        <Button
          type="button"
          className="rounded-lg "
          onClick={onFinish}
          hidden={isFinishDisabled}
        >
          <CheckCircleIcon aria-hidden="true" weight="bold" />
          Finalizar viagem
        </Button>
      </div>
      <div className='w-full flex sm:justify-end'>
        
      <Button asChild className="rounded-lg sm:max-w-64 w-full  bg-primary/5 text-sidebar-primary ring-primary hover:bg-primary/10 hover:border hover:border-sidebar-primary">
        <a href={whatsappAlertUrl}
          target="_blank"
          rel="noreferrer" 
          aria-label="Reportar problema pelo WhatsApp">
          <WarningCircleIcon aria-hidden="true" weight="bold" />
          Reportar Problema
        </a>
      </Button>
      </div>
    </header>
  )
}
