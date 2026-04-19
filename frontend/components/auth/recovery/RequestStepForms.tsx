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
import { Link } from "@tanstack/react-router"
import { useSteps } from "../../ui/steps"

type Props = {
  paths: {
    login: string
  }
  onSuccess?: () => void
}

export function RequestStepForms({ paths, onSuccess }: Props) {
  const { next } = useSteps()
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
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Recuperar Acesso</CardTitle>
          <CardDescription>
            Insira seu email para recuperar seu acesso.
          </CardDescription>

          <CardAction>
            <Link to={paths.login} className="w-full">
              <Button variant="link" type="button">Cancelar</Button>
            </Link>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="joao@uefs.br" required />
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full cursor-pointer">
            Receber email
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}