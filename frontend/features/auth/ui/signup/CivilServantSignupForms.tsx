import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type Props = {
  paths: {
    login: string
  }
}

export default function CivilServantSignupForms(props: Props) {
  const paths = props.paths
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    civilServantId: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    const key = id === "full-name" ? "fullName" : id === "civil-servant-id" ? "civilServantId" : id === "confirm-password" ? "confirmPassword" : id
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch("/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.fullName,
          civil_servant_id: formData.civilServantId,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
          profile_type: "civil-servant",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          window.location.href = paths.login
        }, 2000)
      } else {
        setErrors(data)
      }
    } catch (error) {
      console.error("Registration error:", error)
      setErrors({ non_field_errors: ["Ocorreu um erro inesperado. Tente novamente."] })
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-4 text-center text-green-600 bg-green-50 rounded-md">
        Conta criada com sucesso! Redirecionando...
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email Institucional</FieldLabel>
          <Input 
            id="email" 
            type="email" 
            placeholder="joão@uefs.br" 
            value={formData.email}
            onChange={handleChange}
            required 
          />
          {errors.email && <FieldDescription className="text-red-500">{errors.email[0]}</FieldDescription>}
        </Field>
        <Field>
          <FieldLabel htmlFor="full-name">Nome Completo</FieldLabel>
          <Input 
            id="full-name" 
            type="text" 
            placeholder="João da Silva" 
            value={formData.fullName}
            onChange={handleChange}
            required
          />
          {errors.full_name && <FieldDescription className="text-red-500">{errors.full_name[0]}</FieldDescription>}
        </Field>
        <Field>
          <FieldLabel htmlFor="civil-servant-id">Matrícula</FieldLabel>
          <Input 
            id="civil-servant-id" 
            type="text" 
            placeholder="12345678" 
            value={formData.civilServantId}
            onChange={handleChange}
            required
          />
          {errors.civil_servant_id && <FieldDescription className="text-red-500">{errors.civil_servant_id[0]}</FieldDescription>}
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <Input 
            id="password" 
            type="password" 
            value={formData.password}
            onChange={handleChange}
            required 
          />
          {errors.password ? (
            <FieldDescription className="text-red-500">{errors.password[0]}</FieldDescription>
          ) : (
            <FieldDescription>A senha deve ter ao menos 8 caracteres.</FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm-password">Confirmar Senha</FieldLabel>
          <Input 
            id="confirm-password" 
            type="password" 
            value={formData.confirmPassword}
            onChange={handleChange}
            required 
          />
          {errors.password_confirmation ? (
            <FieldDescription className="text-red-500">{errors.password_confirmation[0]}</FieldDescription>
          ) : (
            <FieldDescription>Por favor, confirme sua senha.</FieldDescription>
          )}
        </Field>
        {errors.non_field_errors && (
          <div className="text-red-500 text-sm mt-2">{errors.non_field_errors[0]}</div>
        )}
        <FieldGroup>
          <Field>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando Conta..." : "Criar Conta"}
            </Button>
            <FieldDescription className="px-6 text-center">
                Já tem uma conta? <a href={paths.login}>Entrar</a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </FieldGroup>
    </form>
  )
}