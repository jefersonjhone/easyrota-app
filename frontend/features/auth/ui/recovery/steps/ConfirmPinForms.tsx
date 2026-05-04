// Import Hooks
import { useEffect } from "react"
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
import { Field, FieldLabel } from "@/components/ui/field"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"

// Import Icons
import { ArrowsClockwiseIcon } from "@phosphor-icons/react"

type Props = {
  email: string | null
}

export const ConfirmPinForms = ({ email }: Props) => {
  const { next, prev } = useSteps()

  useEffect(() => {
    if (!email?.trim()) { prev() }
  }, [email, prev])

  return (
    <form onSubmit={next}>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recuperar Acesso</CardTitle>
          <CardDescription>
            Insira o código de confirmação enviado para seu email:{" "}
            <span className="font-medium">{email}</span>
          </CardDescription>
          <GoBackButton onClick={prev} />
        </CardHeader>
        <PinField />
        <SubmitPin />
      </Card>
    </form>
  )
}

const GoBackButton = ({ onClick }: { onClick: () => void }) => (
  <CardAction>
    <Button className="w-full cursor-pointer" variant="link" 
      type="button" onClick={onClick}
    >
      Email errado?
    </Button>
  </CardAction>
)

const PinField = () => (
  <CardContent className="flex flex-col gap-2">
    <Field>
      <PinLabel />
      <PinInput />
    </Field>
  </CardContent>
)

 const PinLabel = () => (
  <div className="flex items-center justify-between">
    <FieldLabel htmlFor="otp-verification">
      Código de Confirmação
    </FieldLabel>
    <Button variant="outline" size="xs">
      <ArrowsClockwiseIcon size={32} />
      Re-enviar código
    </Button>
  </div>
)

const PinInput = () => {
  const groupClass = `
    *:data-[slot=input-otp-slot]:h-12 
    *:data-[slot=input-otp-slot]:w-11 
    *:data-[slot=input-otp-slot]:text-xl
  `

  return (
    <InputOTP maxLength={6} id="otp-verification" containerClassName="justify-center" required>
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
const SubmitPin = () => (
  <CardFooter className="flex-col gap-2">
    <Button type="submit" className="w-full cursor-pointer">
      Confirmar
    </Button>
  </CardFooter>
)

