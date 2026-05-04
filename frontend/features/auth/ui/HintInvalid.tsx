import type { FieldError as HookError } from 'react-hook-form'
import { FieldError } from '@ui/field'

type Props = {
  for: HookError | undefined
}

const HintInvalid = ({ for: errors }: Props) => {
  return errors && (
    <FieldError className="text-sm text-red-500">
      {errors.message || 'Campo inválido'}
    </FieldError>
  )
}

export default HintInvalid
