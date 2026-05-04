import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useNavigate } from "@tanstack/react-router"
import { Route as LoginRoute } from "@/pages/login"

export function ChangePasswordForms() {
  const navigate = useNavigate()

  return (
    <form onSubmit={() => navigate({ to: LoginRoute.to, replace: true })}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recuperar Acesso</CardTitle>
          <CardDescription>Mude sua senha!</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordField />
        </CardContent>
        <CardFooter>
          <SubmitPassword />
        </CardFooter>
      </Card>
    </form>
  )
}

const PasswordField = () => (
  <FieldGroup>
    <Field>
      <FieldLabel htmlFor="password">Nova Senha</FieldLabel>
      <Input id="password" name="password" type="password" placeholder="••••••••" required />
      <FieldDescription>A senha deve ter ao menos 8 caracteres.</FieldDescription>
    </Field>
    <Field>
      <FieldLabel htmlFor="password-confirm">Confirmar Senha</FieldLabel>
      <Input id="password-confirm" name="password-confirm" type="password" placeholder="••••••••" required />
      <FieldDescription>Por favor, confirme sua senha.</FieldDescription>
    </Field>
  </FieldGroup>
)

const SubmitPassword = () => (
  <Button type="submit" className="w-full cursor-pointer">
    Confirmar
  </Button>
)