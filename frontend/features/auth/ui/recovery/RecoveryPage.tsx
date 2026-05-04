// Hooks
import { useState } from "react"

// Components
import AuthLayout from '@features/auth/ui/AuthLayout'
import { StepsRoot, StepsList, StepIndex, Step } from "@ui/steps"

import { ChangePasswordForms } from "./steps/ChangePasswordForms"
import { ConfirmPinForms } from "./steps/ConfirmPinForms"
import { RequestRecoveryForms } from "./steps/RequestRecoveryForms"


export const RecoveryPage = () => {
  const [email, setEmail] = useState<string | null>(null)
  return (
    <AuthLayout>
      <StepsRoot stepsOrder={["request", "confirm", "reset"]}>
        <StepsList className="justify-start">
          <StepIndex value="request">1. Solicitar recuperação</StepIndex>
          <StepIndex value="confirm">2. Confirmar PIN</StepIndex>
          <StepIndex value="reset">3. Redefinir senha</StepIndex>
        </StepsList>

        <Step value="request">
          <RequestRecoveryForms 
            onSuccess={(form: FormData) => setEmail(form.get("email") as string)} 
          />
        </Step>
        <Step value="confirm">
          <ConfirmPinForms email={email} />
        </Step>
        <Step value="reset">
          <ChangePasswordForms/>
        </Step>
      </StepsRoot>
    </AuthLayout>
  )
}
