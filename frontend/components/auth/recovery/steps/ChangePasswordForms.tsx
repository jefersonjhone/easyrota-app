import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useNavigate } from "@tanstack/react-router"

type Props = {
  paths: {
    login: string
  }
  onSuccess?: () => void
}

export function ChangePasswordForms({ paths, onSuccess }: Props) {
  const navigate = useNavigate()

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    
    // TODO: call your API here
    // const formData = new FormData(e.currentTarget)
    // const email = formData.get("email")
    // await api.requestRecovery(email)

    // move to next step
    onSuccess?.()
    navigate({
      to: paths.login,
      replace: true
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recuperar Acesso</CardTitle>
          <CardDescription>Mude sua senha!</CardDescription>
        </CardHeader>

        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">Nova Senha</FieldLabel>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="password-confirm">Confirmar Senha</FieldLabel>
              <Input id="password-confirm" name="password-confirm" type="password" placeholder="••••••••" required />
            </Field>
          </FieldGroup>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full cursor-pointer">
            Confirmar
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}