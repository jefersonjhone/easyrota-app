// Import Hooks
import { useSteps } from "@/components/ui/steps"

// Import Components
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  onSuccess?: () => void
}

export function ConfirmPinForms({ onSuccess }: Props) {
  const { next, prev } = useSteps()
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    
    // TODO: call your API here
    // const formData = new FormData(e.currentTarget)
    // const email = formData.get("email")
    // await api.requestRecovery(email)

    // move to next step
    onSuccess?.()
    next()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recuperar Acesso</CardTitle>
          <CardDescription>
            Insira o código de confirmação enviado para seu email.
          </CardDescription>

          <CardAction>
            <Button onClick={() => prev()} className="w-full" variant="link" type="button">
              Re-enviar
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <Label htmlFor="pin">Código de Confirmação</Label>
          <Input id="pin" name="pin" type="text" placeholder="123456" required />
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full cursor-pointer">
            Confirmar
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}