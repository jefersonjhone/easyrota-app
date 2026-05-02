import type { FieldError } from 'react-hook-form'

type Props = {
  for: FieldError | undefined
}

const HintInvalid = ({ for: errors }: Props) => {
  return errors && (
    <div className="text-sm text-red-500">
      {errors.message || 'Campo inválido'}
    </div>
  )
}

export default HintInvalid
