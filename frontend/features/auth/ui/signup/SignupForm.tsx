// Library
import { useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

// Hooks
import { useForm } from "react-hook-form"
import { useState } from "react"
import { useSignupMutation } from "@features/auth/hooks/useSignup"

// Types
import { type SignupVariant } from "@features/auth/hooks/useSignup"

// Components
import HintInvalid from "@features/auth/ui/HintInvalid"
import { Button } from "@ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@ui/field"
import { Input } from "@ui/input"


const signupSchema = z.object({
  email: z
    .string()
    .nonempty("Informe seu email institucional.")
    .email("Informe um email válido."),
  fullName: z
    .string()
    .nonempty("Informe seu nome completo.")
    .min(3, "O nome deve ter pelo menos 3 caracteres."),
  id: z
    .string()
    .nonempty("Informe sua matrícula.")
    .min(6, "A matrícula deve ter pelo menos 6 caracteres."),
  password: z
    .string()
    .nonempty("Informe sua senha.")
    .min(8, "A senha deve ter ao menos 8 caracteres."),
  confirmPassword: z
    .string()
    .nonempty("Confirme sua senha."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não correspondem.",
  path: ["confirmPassword"],
})

type SignupSchema = z.infer<typeof signupSchema>

type Props = {
  variant: SignupVariant
  paths: {
    login: string
  }
}

const variantConfig: Record<SignupVariant, {
  emailPlaceholder: string
  namePlaceholder: string
}> = {
  "civil-servant": {
    emailPlaceholder: "joão@uefs.br",
    namePlaceholder: "João da Silva",
  },
  "student": {
    emailPlaceholder: "12345678@discente.uefs.br",
    namePlaceholder: "Carla Santos",
  },
}

export default function SignupForm(props: Props) {
  const { variant, paths } = props
  const config = variantConfig[variant]

  const navigate = useNavigate()

  const signupMutation = useSignupMutation(variant)
  const form = useForm<SignupSchema>({
    mode: "onChange",
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      fullName: "",
      id: "",
      password: "",
      confirmPassword: "",
    },
  })

  const { register, handleSubmit, formState: state, setError } = form
  const isSubmitting = state.isSubmitting || signupMutation.isPending

  const [verificationModal, setVerificationModal] = useState(false)
  const [type, setType] = useState<"reactivation" | "register">();

  const onSubmit = async (data: SignupSchema) => {
    try {
      const response = await signupMutation.mutateAsync(data)
      
      // O backend retorna um token no registro para vincular ao desafio OTP
      const token = (response as { token?: string }).token
      const email = data.email
      const targetPath = `/verificar?token=${encodeURIComponent(String(token ?? ""))}&email=${encodeURIComponent(email)}`

      await navigate({ to: targetPath as never, replace: true })
    } catch (error: unknown) {
      const errors = error as Record<string, string | string[]>
      
      Object.entries(errors).forEach(([field, messages]) => {
        const errorMessage: string = Array.isArray(messages) ? String(messages) : String(messages)
        
        if (errorMessage.includes("ainda não foi ativada")) {
          setType("register")
          setVerificationModal(true)
        }
        if (errorMessage?.includes("desativada após uma solicitação de exclusão")){
          setType("reactivation")
          setVerificationModal(true)
        }

        if (field === "non_field_errors" || field === "root") {
          setError("root", { message: errorMessage })
        } else {
          setError(field as keyof SignupSchema, { message: errorMessage })
        }
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email Institucional</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder={config.emailPlaceholder}
            required
            {...register("email")}
          />
          <HintInvalid for={state.errors.email} />
        </Field>
        <Field>
          <FieldLabel htmlFor="fullName">Nome Completo</FieldLabel>
          <Input
            id="fullName"
            type="text"
            placeholder={config.namePlaceholder}
            required
            {...register("fullName")}
          />
          <HintInvalid for={state.errors.fullName} />
        </Field>
        <Field>
          <FieldLabel htmlFor="id">Matrícula</FieldLabel>
          <Input
            id="id"
            type="text"
            placeholder="12345678"
            required
            {...register("id")}
          />
          <HintInvalid for={state.errors.id} />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <Input
            id="password"
            type="password"
            required
            {...register("password")}
          />
          {state.errors.password ? (
            <HintInvalid for={state.errors.password} />
          ) : (
            <FieldDescription>A senha deve ter ao menos 8 caracteres.</FieldDescription>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirmar Senha</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            required
            {...register("confirmPassword")}
          />
          <HintInvalid for={state.errors.confirmPassword} />
        </Field>
        {state.errors.root && (
          <div className="text-red-500 text-sm mt-2">{state.errors.root.message}</div>
        )}
        <FieldGroup>
          <Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando Conta..." : "Criar Conta"}
            </Button>
            <FieldDescription className="px-6 text-center">
              Já tem uma conta? <a href={paths.login}>Entrar</a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </FieldGroup>

      {verificationModal && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
						<div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
							<FieldLabel> Conta desativada </FieldLabel>

							<FieldLabel>
								{type === "register" ? 
                "Este e-mail já está cadastrado, mas a conta ainda não foi ativada. Deseja ir para tela de verificação agora?"
                : "Esta conta foi desativada após uma solicitação de exclusão. Caso deseje continuar utilizando a plataforma, você pode reativar sua conta."}
							</FieldLabel>

							<div className="mt-6 flex justify-end gap-2">
								<Button variant="outline"
									onClick={() => setVerificationModal(false)}>
										{type === "register" ? "Não" : "Cancelar"}
								</Button>
								<Button
									onClick={() => {
                    const email = form.getValues("email")
                    if (type === "register"){
                      navigate({ to: `/verificar?email=${email}&mode=register` as never, replace: true })
                    } else {
                      navigate({ to: `/verificar?email=${email}&mode=reactivate` as never, replace: true })
                    }
                  }}>
										{type === "register" ? "Sim" : "Reativar Conta"}
								</Button>
							</div>
						</div>
					</div>
				)}
    </form>
  )
}
