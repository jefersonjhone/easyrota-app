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
import { Field, FieldLabel } from "@/components/ui/field"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"

// Import Icons
// import { RefreshCwIcon } from "lucide-react"

type Props = {
  email: string
  onSuccess?: () => void
}

export function ConfirmPinForms({ email, onSuccess }: Props) {
  const { next, prev } = useSteps()
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
          <CardDescription>
            Insira o código de confirmação enviado para seu email:{" "}
            <span className="font-medium">{email}</span>
          </CardDescription>

          <CardAction>
            <Button className="w-full cursor-pointer" variant="link" 
              type="button" onClick={() => prev()}
            >
              Email errado?
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="otp-verification">
                Código de Confirmação
              </FieldLabel>
              <Button variant="outline" size="xs">
                {/* <RefreshCwIcon /> */}
                Re-enviar código
              </Button>
            </div>
            <InputOTP maxLength={6} id="otp-verification" 
              containerClassName="justify-center" required
            >
              <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator className="mx-2" />
              <InputOTPGroup className="*:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:w-11 *:data-[slot=input-otp-slot]:text-xl">
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </Field>
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full cursor-pointer">
            Confirmar
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}