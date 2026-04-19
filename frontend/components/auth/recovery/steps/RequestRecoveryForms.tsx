// Import Hooks
import { useSteps } from "@/components/ui/steps"

// Import Components
import { Link } from "@tanstack/react-router"
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
import { Field, FieldLabel } from "@/components/ui/field"

type Props = {
  paths: {
    login: string
  }
  onSuccess?: () => void
}

export function RequestRecoveryForms({ paths, onSuccess }: Props) {
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
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recuperar Acesso</CardTitle>
          <CardDescription>Insira seu email para recuperar seu acesso.</CardDescription>
          <CardAction>
            <Link to={paths.login} className="w-full">
              <Button variant="link" type="button">Cancelar</Button>
            </Link>
          </CardAction>
        </CardHeader>

        <CardContent>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" name="email" type="email" placeholder="joao@uefs.br" required />
          </Field>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full cursor-pointer">
            Receber email
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}