import { Button } from '@ui/button'
import { WarningCircleIcon } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@ui/dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  confirmation: 'back' | 'start' | 'finish' | null
  title: string
  description: string
  actionError: string | null
  isConfirmationLoading: boolean
  onConfirmBack: () => void
  onConfirmStart: () => void
  onConfirmFinish: () => void
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  confirmation,
  title,
  description,
  actionError,
  isConfirmationLoading,
  onConfirmBack,
  onConfirmStart,
  onConfirmFinish,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <WarningCircleIcon aria-hidden="true" weight="fill" className="size-8 text-primary" />
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {actionError ? (
          <p role="alert" className="text-sm font-bold text-red-700">{actionError}</p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-lg" onClick={() => onOpenChange(false)} disabled={isConfirmationLoading}>Cancelar</Button>

          {confirmation === 'back' ? (
            <Button type="button" className="rounded-lg" onClick={onConfirmBack} disabled={isConfirmationLoading}>OK</Button>
          ) : confirmation === 'start' ? (
            <Button type="button" className="rounded-lg border-green-600 bg-green-600 text-white hover:bg-green-700" onClick={onConfirmStart} disabled={isConfirmationLoading}>OK</Button>
          ) : (
            <Button type="button" className="rounded-lg" onClick={onConfirmFinish} disabled={isConfirmationLoading}>OK</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
