// Components
import { Button } from "@ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@ui/field"
import { Input } from "@ui/input"

// Hooks
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { apiFetch } from "@/lib/api"

// Routes
import { Route as LoginRoute } from "@/pages/login"

type Props = {
  token: string | null
  otp: string | null
}

export function ChangePasswordForms({ token, otp }: Props) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!token || !otp) {
      setError("Token ou código ausente. Retorne ao primeiro passo.")
      return
    }

    const formData = new FormData(event.currentTarget)
    const password = formData.get("password") as string
    const passwordConfirm = formData.get("password-confirm") as string

    if (password !== passwordConfirm) {
      setError("As senhas não coincidem.")
      return
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await apiFetch("/auth/password-reset-confirm/", {
        method: "POST",
        body: JSON.stringify({
          token,
          code: otp,
          password,
          password_confirmation: passwordConfirm
        })
      })
      
      setSuccess(true)
      setTimeout(() => {
        navigate({ to: LoginRoute.to, replace: true })
      }, 2000)
    } catch (err: unknown) {
      console.error(err)
      const errData = err as { data?: { detail?: string | string[] } }
      const msg = errData.data?.detail
      setError(Array.isArray(msg) ? msg[0] : (msg || "Erro ao redefinir a senha."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recuperar Acesso</CardTitle>
          <CardDescription>Mude sua senha!</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="rounded-lg bg-emerald-500/10 p-4 text-center text-sm text-emerald-500 border border-emerald-500/20 font-medium">
              Senha redefinida com sucesso! Redirecionando para o login...
            </div>
          ) : (
            <>
              <PasswordField disabled={loading} />
              {error && <p className="text-sm text-destructive text-center mt-3">{error}</p>}
            </>
          )}
        </CardContent>
        {!success && (
          <CardFooter>
            <SubmitPassword loading={loading} />
          </CardFooter>
        )}
      </Card>
    </form>
  )
}

const PasswordField = ({ disabled }: { disabled: boolean }) => (
  <FieldGroup>
    <Field>
      <FieldLabel htmlFor="password">Nova Senha</FieldLabel>
      <Input id="password" name="password" type="password" placeholder="••••••••" required disabled={disabled} />
      <FieldDescription>A senha deve ter ao menos 8 caracteres.</FieldDescription>
    </Field>
    <Field>
      <FieldLabel htmlFor="password-confirm">Confirmar Senha</FieldLabel>
      <Input id="password-confirm" name="password-confirm" type="password" placeholder="••••••••" required disabled={disabled} />
      <FieldDescription>Por favor, confirme sua senha.</FieldDescription>
    </Field>
  </FieldGroup>
)

const SubmitPassword = ({ loading }: { loading: boolean }) => (
  <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
    {loading ? "Redefinindo..." : "Confirmar"}
  </Button>
)