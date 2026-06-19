// Library
import { Link, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import easyRotaLogo from "@assets/logo-light-mode.svg"

// Hooks
import { useLoginMutation } from "@features/auth/hooks/useLogin"
import { useReactivateAccountMutation } from "@features/auth/hooks/useDeleteAccount"

// Routes
import { Route as RecoveryRoute } from "@/pages/recuperar"
import { Route as SignupRoute } from "@/pages/signup"
import { Route as AppRoute } from "@/pages/app"
import { Route as AdminRoute } from "@/pages/admin"

// Components
import HintInvalid from '@features/auth/ui/HintInvalid'
import { Button } from "@ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@ui/card"
import { Field, FieldGroup, FieldLabel } from '@ui/field'
import { Input } from "@ui/input"

const schema = z.object({
    email: z
    .string()
        .nonempty("Informe seu email institucional.")
        .email("Informe um email valido."),
    password: z
    .string()
        .nonempty("Informe sua senha.")
        .min(8, "A senha deve ter pelo menos 8 caracteres."),
})

type Schema = z.infer<typeof schema>

export function LoginForm() {
    const navigate = useNavigate()
    const loginMutation = useLoginMutation()
    const reactivateAccountMutation = useReactivateAccountMutation()
    const form = useForm<Schema>({
    mode: 'onChange',
        resolver: zodResolver(schema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

  const { register, handleSubmit, formState: state } = form
  const isSubmitting = state.isSubmitting || loginMutation.isPending

  const [verificationModal, setVerificationModal] = useState(false)
  const [type, setType] = useState<"reactivation" | "register">();

  const error = loginMutation.error as {
    detail?: string | string[]
  } | null

    const onSubmit = async (data: Schema) => {
        try {
            const response = await loginMutation.mutateAsync(data)
            const user = response.user
            const isAdmin = user?.admin_profile || user?.profile_type === 'ADMIN'

            if (isAdmin) {
                navigate({ to: AdminRoute.to, replace: true })
            } else if (user?.profile_type === 'DRIVER') {
                navigate({ to: '/app/motorista' as never, replace: true })
            } else {
                navigate({ to: AppRoute.to, replace: true })
            }
        } catch (err: unknown) {
            const errorData = err as { detail?: string | string[] }
            const message = Array.isArray(errorData.detail) ? errorData.detail[0] : errorData.detail
            console.log(errorData)
            
            if (message?.includes("ainda não foi ativada")) {
                setType("register")
                setVerificationModal(true)
            }
            else if (message?.includes("desativada após uma solicitação de exclusão")){
                setType("reactivation")
                setVerificationModal(true)
            }
        }
    }

    const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit(onSubmit)()
        }
    }

    const handleReactivateAccount = async () => {
        const email = form.getValues("email")
        const response = await reactivateAccountMutation.mutateAsync(email)
        const token = (response as { token?: string }).token
        navigate({ to: `/verificar?token=${token}&email=${email}&mode=reactivate` as never, replace: true })
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <img src={easyRotaLogo} alt="Logo EasyRota" className="h-8 w-8 shrink-0 object-contain" />
                    Entrar
                </CardTitle>
                <CardDescription>Entre com seu email institucional.</CardDescription>
                <CardAction>
                    <Link to={SignupRoute.to} className="w-full">
                        <Button variant="link" className="cursor-pointer">Criar Conta</Button>
                    </Link>
                </CardAction>
            </CardHeader>
            <CardContent>

                <form id="login" onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <Field className="grid gap-2">
                            <FieldLabel htmlFor="email">Email Institucional</FieldLabel>
                        <Input id="email" type="email" placeholder="joao@uefs.br" required tabIndex={1} {...register("email")}/>
              <HintInvalid for={state.errors.email} />
                        </Field>

                        <Field className="grid gap-2">
                            <div className="flex items-center">
                                <FieldLabel htmlFor="password">Senha</FieldLabel>
                            <Link to={RecoveryRoute.to} className="ml-auto" tabIndex={3}>
                                <Button variant="link" className="text-black/50 cursor-pointer">
                                    Esqueceu sua senha?
                                  </Button>
                            </Link>
                        </div>
                        <Input id="password" type="password" required tabIndex={2} onKeyDown={handlePasswordKeyDown} {...register("password")}/>
              <HintInvalid for={state.errors.password} />
                        </Field>
                    </FieldGroup>
                </form>

                {error?.detail?.[0] && (
                <p className="mt-3 text-red-700">
                    {error.detail[0]}
                </p>
                )}
            </CardContent>
      <CardFooter className="flex-col">
        <Button form="login" type="submit" className="w-full cursor-pointer" disabled={isSubmitting} tabIndex={4}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </CardFooter>

                {verificationModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
                            <CardTitle> Conta desativada </CardTitle>

                            <CardDescription>
                                {type === "register" ? 
                                "Este e-mail já está cadastrado, mas a conta ainda não foi ativada. Deseja ir para tela de verificação agora?"
                                : "Esta conta foi desativada após uma solicitação de exclusão. Caso deseje continuar utilizando a plataforma, você pode reativar sua conta."}
                            </CardDescription>

                            <div className="mt-6 flex justify-end gap-2">
                                <Button variant="outline"
                                    onClick={() => setVerificationModal(false)}>
                                        {type === "register" ? "Não" : "Cancelar"}
                                </Button>
                                <Button
                                    disabled={reactivateAccountMutation.isPending}
                                    onClick={() => {
                                        const email = form.getValues("email")
                                        if (type === "register"){
                                            navigate({ to: `/verificar?email=${email}&mode=register` as never, replace: true })
                                        } else {
                                            handleReactivateAccount()
                                        }
                                    }}>
                                        {type === "register" ? "Sim" : "Reativar Conta"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
        </Card>
    )
}
