import type { AnyFieldApi } from '@tanstack/react-form'

type Props = {
  field: AnyFieldApi
  showAlways?: boolean
}

const FieldInfo = ({ field, showAlways = false }: Props) => {
  const meta = field.state.meta
  const shouldShowError = showAlways ? !meta.isValid : meta.isTouched && !meta.isValid
  const isValidating = meta.isValidating

  return (
    <>
      {shouldShowError ? <em>{meta.errors.join(',')}</em> : null}
      {isValidating ? 'Validating...' : null}
    </>
  )
}

export default FieldInfo
