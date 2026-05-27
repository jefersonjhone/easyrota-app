// Library
import { Link, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// Hooks
import { useLoginMutation } from "@features/auth/hooks/useLogin"

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

  const error = loginMutation.error as {
	detail?: string[]
  } | null

	const onSubmit = async (data: Schema) => {
		const response = await loginMutation.mutateAsync(data)
		const isAdmin = response.user?.admin_profile
		if (isAdmin) {
		navigate({ to: AdminRoute.to, replace: true })
		} else {
		navigate({ to: AppRoute.to, replace: true })
		}
	}

	const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleSubmit(onSubmit)()
		}
	}

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle>Entrar</CardTitle>
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
							<Input id="email" type="email" placeholder="joao@uefs.br" required {...register("email")}/>
              <HintInvalid for={state.errors.email} />
						</Field>

						<Field className="grid gap-2">
							<div className="flex items-center">
								<FieldLabel htmlFor="password">Senha</FieldLabel>
								<Link to={RecoveryRoute.to} className="ml-auto">
									<Button variant="link" className="text-black/50 cursor-pointer">
                    Esqueceu sua senha?
                  </Button>
								</Link>
							</div>
							<Input id="password" type="password" required onKeyDown={handlePasswordKeyDown} {...register("password")}/>
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
        <Button form="login" type="submit" className="w-full cursor-pointer" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </CardFooter>
		</Card>
	)
}
