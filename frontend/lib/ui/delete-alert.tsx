import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { Button } from "@ui/button"
import { Card, CardFooter, CardDescription, CardHeader, CardTitle } from '@ui/card'

interface Props {
  onConfirm: () => void
}

export const ConfirmDeleteDialog = ({
  onConfirm,
}: Props) => {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10"
        >
          Excluir
        </Button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/40" />

        <AlertDialog.Content
          className="
            fixed left-1/2 top-1/2
            w-[90vw] max-w-md
            -translate-x-1/2 -translate-y-1/2
            outline-none
          "
        >
          <Card>
            <CardHeader>
              <CardTitle>
                <AlertDialog.Title>
                  Tem certeza que deseja excluir?
                </AlertDialog.Title>
              </CardTitle>
              <CardDescription>
                <AlertDialog.Description>
                  Essa ação não poderá ser desfeita.
                </AlertDialog.Description>
              </CardDescription>
            </CardHeader>


            <CardFooter className="justify-end gap-2">
              <div className="mt-6 flex justify-end gap-2">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline">
                    Cancelar
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button
                    variant="destructive"
                    onClick={onConfirm}
                  >
                    Excluir
                  </Button>
                </AlertDialog.Action>
              </div>
            </CardFooter>
          </Card>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}