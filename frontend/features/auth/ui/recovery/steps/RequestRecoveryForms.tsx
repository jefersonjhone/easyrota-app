// Components
import { Button } from "@ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@ui/card"
import { Input } from "@ui/input"
import { Field, FieldLabel } from "@ui/field"

// Hooks
import { useSteps } from "@ui/steps"

// Routes
import { Route as LoginRoute } from "@pages/login"


type Props = {
  onSuccess?: (form: FormData) => void
}

export function RequestRecoveryForms({ onSuccess }: Props) {
  const { next } = useSteps()
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    onSuccess?.(formData)
    next()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recuperar Acesso</CardTitle>
          <CardDescription>Insira seu email para recuperar seu acesso.</CardDescription>
          <CardAction>
            <CancelButton/>
          </CardAction>
        </CardHeader>
        <CardContent>
          <EmailField/>
        </CardContent>
        <CardFooter>
          <SubmitRequest/>
        </CardFooter>
      </Card>
    </form>
  )
}

const CancelButton = () => (
  <LoginRoute.Link className="w-full">
    <Button variant="link" type="button">Cancelar</Button>
  </LoginRoute.Link>
)

const EmailField = () => (
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" name="email" type="email" placeholder="joao@uefs.br" required />
  </Field>
)
const SubmitRequest = () => (
  <Button type="submit" className="w-full cursor-pointer">
    Receber email
  </Button>
)
