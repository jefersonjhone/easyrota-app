import { Button } from "@/components/ui/button"
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"

import { useLoginMutation } from "@/features/auth/hooks/useLogin"
import { Route as RecoveryRoute } from "@/pages/recovery"
import { Route as SignupRoute } from "@/pages/signup"
import ErrorHint from "@/features/auth/ui/ErrorHint"

export function LoginForm() {
	const loginMutation = useLoginMutation()

	const schema = z.object({
		email: z.string()
      .nonempty("Informe seu email institucional.")
      .email("Informe um email valido."),
		password: z.string()
      .nonempty("Informe sua senha."),
	})

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		 validators: {
      onSubmit: schema,
      onChange: schema,
    },
		onSubmit: async ({ value }) => {
			const v = await schema.parseAsync(value)
			await loginMutation.mutateAsync(v)
		},
	})



	if (loginMutation.isSuccess) {
		return (
			<div className="rounded-md bg-green-50 p-4 text-center text-green-600">
				Logado com sucesso! Um dia voce chega na pagina...
			</div>
		)
	}

	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle>Entrar</CardTitle>
				<CardDescription>Entre com seu email institucional.</CardDescription>
				<CardAction>
					<Link to={SignupRoute.to} className="w-full">
						<Button variant="link">Criar Conta</Button>
					</Link>
				</CardAction>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(event) => {
						event.preventDefault()
						void form.handleSubmit()
					}}
				>
					<div className="flex flex-col gap-6">
						<form.Field 
							name="email"
							children={(field) => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Email Institucional</Label>
									<Input
										id={field.name}
										name={field.name}
										type="email"
										value={field.state.value}
										onChange={(e) => field.handleChange((e.target as HTMLInputElement).value)}
										onBlur={field.handleBlur}
										placeholder="joao@uefs.br"
										required
									/>
								<div className="text-sm text-red-500">
									<ErrorHint field={field} showAlways />
								</div>
								</div>
							)}
						/>
						<form.Field
							name="password"
							children={(field) => (
								<div className="grid gap-2">
									<div className="flex items-center">
										<Label htmlFor={field.name}>Senha</Label>
										<Link
											to={RecoveryRoute.to}
											className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
										>
											Esqueceu sua senha?
										</Link>
									</div>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										value={field.state.value}
										onChange={(e) => field.handleChange((e.target as HTMLInputElement).value)}
										onBlur={field.handleBlur}
										required
									/>
									<div className="text-sm text-red-500">
										<ErrorHint field={field} showAlways />
									</div>
								</div>
							)}
						/>
					</div>
					<CardFooter className="flex-col gap-2 px-0 pb-0 pt-6">
						<Button type="submit" className="w-full" disabled={loginMutation.isPending}>
							{loginMutation.isPending ? "Entrando..." : "Entrar"}
						</Button>
					</CardFooter>

				</form>
			</CardContent>
		</Card>
	)
}
