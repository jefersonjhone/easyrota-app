import { useState } from "react"

import { StepsRoot, StepsList, StepIndex, Step } from "@/components/ui/steps"

import { RequestRecoveryForms } from "./steps/RequestRecoveryForms"
import { ConfirmPinForms } from "./steps/ConfirmPinForms"
import { ChangePasswordForms } from "./steps/ChangePasswordForms"

type Props = {
  paths: {
    login: string
  }
}

export function RecoveryForms({ paths }: Props) {
  const [email, setEmail] = useState<string | null>(null)
  return (
    <StepsRoot stepsOrder={["request", "confirm", "reset"]}>
      <StepsList className="justify-start">
        <StepIndex value="request">1. Solicitar recuperação</StepIndex>
        <StepIndex value="confirm">2. Confirmar PIN</StepIndex>
        <StepIndex value="reset">3. Redefinir senha</StepIndex>
      </StepsList>

      <Step value="request">
        <RequestRecoveryForms 
          paths={paths} 
          onSuccess={(form: FormData) => setEmail(form.get("email") as string)} 
        />
      </Step>
      <Step value="confirm">
        <ConfirmPinForms email={email} onSuccess={() => {}} />
      </Step>
      <Step value="reset">
        <ChangePasswordForms paths={paths} />
      </Step>
    </StepsRoot>
  )
}
