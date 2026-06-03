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
  const [token, setToken] = useState<string | null>(null)
  const [otp, setOtp] = useState<string | null>(null)

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
            onSuccess={(emailValue: string, tokenValue: string) => {
              setEmail(emailValue)
              setToken(tokenValue)
            }} 
          />
        </Step>
        <Step value="confirm">
          <ConfirmPinForms 
            email={email} 
            token={token}
            onSuccess={(otpValue: string) => setOtp(otpValue)} 
            onTokenUpdate={(newToken: string) => setToken(newToken)}
          />
        </Step>
        <Step value="reset">
          <ChangePasswordForms token={token} otp={otp} />
        </Step>
      </StepsRoot>
    </AuthLayout>
  )
}
