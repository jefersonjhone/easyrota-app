import { StepsRoot, StepsList, StepIndex, Step } from "@/components/ui/steps"
import { RequestRecoveryForms } from "./steps/RequestRecoveryForms"
import { PinConfirmationStepForms } from "./steps/PinConfirmationStepForms"
import { ChangePasswordStepForms } from "./steps/ChangePasswordStepForms"

type Props = {
  paths: {
    login: string
  }
}

export function RecoveryForms({ paths }: Props) {
  return (
    <StepsRoot stepsOrder={["request", "confirm", "reset"]}>
      <StepsList className="justify-start">
        <StepIndex value="request">1. Solicitar recuperação</StepIndex>
        <StepIndex value="confirm">2. Confirmar PIN</StepIndex>
        <StepIndex value="reset">3. Redefinir senha</StepIndex>
      </StepsList>

      <Step value="request">
        <RequestRecoveryForms paths={paths} />
      </Step>
      <Step value="confirm">
        <PinConfirmationStepForms />
      </Step>
      <Step value="reset">
        <ChangePasswordStepForms paths={paths} />
      </Step>
    </StepsRoot>
  )
}
