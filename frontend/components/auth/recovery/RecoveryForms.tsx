"use client"

import { StepsRoot, StepsList, StepIndex, Step, useSteps } from "@/components/ui/steps"
import { RequestStepForms } from "./RequestStepForms"

type Props = {
  paths: {
    login: string
  }
}

function ConfirmStep() {
  const { markComplete, goTo } = useSteps()

  return (
    <div>
      {/* Replace with your real form */}
      <button
        onClick={() => {
          markComplete("confirm")
          goTo("reset")
        }}
      >
        Confirm PIN
      </button>
    </div>
  )
}

function ResetStep() {
  return <div>Reset password form</div>
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
        <RequestStepForms paths={paths} />
      </Step>
      <Step value="confirm">
        <ConfirmStep />
      </Step>
      <Step value="reset">
        <ResetStep />
      </Step>
    </StepsRoot>
  )
}
