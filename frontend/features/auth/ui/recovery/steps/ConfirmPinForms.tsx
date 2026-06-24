// Import Components
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
import { Field, FieldLabel } from "@ui/field"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@ui/input-otp"
import { ArrowClockwiseIcon } from "@phosphor-icons/react"

// Hooks
import { useEffect, useState } from "react"
import { useSteps } from "@ui/steps"
import { apiFetch } from "@/lib/api"


type Props = {
  email: string | null
  token?: string | null
  onSuccess?: (otp: string) => void
  onTokenUpdate?: (token: string) => void
}

type PasswordResetRequestResponse = {
  token?: string
} | null

export const ConfirmPinForms = ({ email, token, onSuccess, onTokenUpdate }: Props) => {
  const { next, prev } = useSteps()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  useEffect(() => {
    if (!email?.trim()) { prev() }
  }, [email, prev])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setVerifyError("Token de recuperação não encontrado. Tente novamente.")
      return
    }

    setLoading(true)
    setVerifyError(null)

    try {
      await apiFetch("/auth/verify-password-reset-otp/", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ token, code })
      })
      onSuccess?.(code)
      next()
    } catch (err) {
      console.error(err)
      setVerifyError("Código inválido ou expirado. Tente reenviar o código.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) return
    setResendLoading(true)
    setResendSuccess(false)
    setResendError(null)

    try {
      const data = await apiFetch<PasswordResetRequestResponse>("/auth/password-reset-request/", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email })
      })
      if (data?.token) {
        onTokenUpdate?.(data.token)
      }
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (err) {
      console.error(err)
      setResendError("Erro ao reenviar código.")
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recuperar Acesso</CardTitle>
          <CardDescription>
            Insira o código de confirmação enviado para seu email:{" "}
            <span className="font-medium">{email}</span>
          </CardDescription>
          <CardAction>
            <GoBackButton onClick={prev} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <PinField code={code} setCode={setCode} onResend={handleResend} resendLoading={resendLoading} resendSuccess={resendSuccess} />
          {verifyError && <p className="text-sm text-destructive mt-1">{verifyError}</p>}
          {resendError && <p className="text-sm text-destructive mt-1">{resendError}</p>}
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <SubmitPin disabled={code.length !== 6 || loading} loading={loading} />
        </CardFooter>
      </Card>
    </form>
  )
}

const GoBackButton = ({ onClick }: { onClick: () => void }) => (
  <Button className="w-full cursor-pointer" variant="link" 
    type="button" onClick={onClick}>
    Email errado?
  </Button>
)

const PinField = ({ code, setCode, onResend, resendLoading, resendSuccess }: { code: string, setCode: (c: string) => void, onResend: () => void, resendLoading: boolean, resendSuccess: boolean }) => (
  <Field>
    <PinLabel onResend={onResend} resendLoading={resendLoading} resendSuccess={resendSuccess} />
    <PinInput code={code} setCode={setCode} />
  </Field>
)

 const PinLabel = ({ onResend, resendLoading, resendSuccess }: { onResend: () => void, resendLoading: boolean, resendSuccess: boolean }) => (
  <div className="flex items-center justify-between">
    <FieldLabel htmlFor="otp-verification">
      Código de Confirmação
    </FieldLabel>
    <div className="flex flex-col items-end">
      <Button
        variant="ghost"
        size="sm"
        type="button"
        disabled={resendLoading || resendSuccess}
        onClick={onResend}
        className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        {resendLoading ? (
          <><ArrowClockwiseIcon className="mr-2 h-3 w-3 animate-spin" /> Enviando...</>
        ) : resendSuccess ? (
          <span className="text-emerald-500">Enviado!</span>
        ) : (
          "Reenviar código"
        )}
      </Button>
    </div>
  </div>
)

const PinInput = ({ code, setCode }: { code: string, setCode: (c: string) => void }) => {
  const groupClass = `
    *:data-[slot=input-otp-slot]:h-12 
    *:data-[slot=input-otp-slot]:w-11 
    *:data-[slot=input-otp-slot]:text-xl
  `

  return (
    <InputOTP maxLength={6} id="otp-verification" containerClassName="justify-center" required value={code} onChange={setCode}>
      <InputOTPGroup className={groupClass}>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        </InputOTPGroup>
      <InputOTPSeparator className="mx-2" />
      <InputOTPGroup className={groupClass}>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}
const SubmitPin = ({ disabled, loading }: { disabled: boolean, loading: boolean }) => (
  <Button type="submit" className="w-full cursor-pointer" disabled={disabled}>
    {loading ? "Verificando..." : "Confirmar"}
  </Button>
)
