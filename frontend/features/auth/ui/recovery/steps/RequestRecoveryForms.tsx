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
import { useState } from "react"
import { apiFetch } from "@/lib/api"

// Routes
import { Route as LoginRoute } from "@/pages/login"


type Props = {
  onSuccess?: (email: string, token: string) => void
}

type PasswordResetRequestResponse = {
  token?: string
} | null

export function RequestRecoveryForms({ onSuccess }: Props) {
  const { next } = useSteps()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string

    try {
      const data = await apiFetch<PasswordResetRequestResponse>("/auth/password-reset-request/", {
        method: "POST",
        body: JSON.stringify({ email })
      })
      onSuccess?.(email, data?.token || "")
      next()
    } catch (err) {
      console.error(err)
      setError("Ocorreu um erro ao processar sua solicitação.")
    } finally {
      setLoading(false)
    }
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
          {error && <p className="text-sm text-destructive text-center mt-2">{error}</p>}
        </CardContent>
        <CardFooter>
          <SubmitRequest loading={loading}/>
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
const SubmitRequest = ({ loading }: { loading: boolean }) => (
  <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
    {loading ? "Enviando..." : "Receber email"}
  </Button>
)
