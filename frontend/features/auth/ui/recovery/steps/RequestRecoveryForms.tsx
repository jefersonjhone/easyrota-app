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
import { Field, FieldLabel } from "@/components/ui/field"
import { Route as LoginRoute } from "@/pages/login"

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
        <Header/>
        <EmailField/>        
        <SubmitRequest/>
      </Card>
    </form>
  )
}

const Header = () => (
  <CardHeader>
    <CardTitle>Recuperar Acesso</CardTitle>
    <CardDescription>Insira seu email para recuperar seu acesso.</CardDescription>
    <CardAction>
      <CancelButton/>
    </CardAction>
  </CardHeader>
)

const CancelButton = () => (
  <LoginRoute.Link className="w-full">
    <Button variant="link" type="button">Cancelar</Button>
  </LoginRoute.Link>
)

const EmailField = () => (
  <CardContent>
    <Field>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input id="email" name="email" type="email" placeholder="joao@uefs.br" required />
    </Field>
  </CardContent>
)
const SubmitRequest = () => (
  <CardFooter>
    <Button type="submit" className="w-full cursor-pointer">
      Receber email
    </Button>
  </CardFooter>
)
