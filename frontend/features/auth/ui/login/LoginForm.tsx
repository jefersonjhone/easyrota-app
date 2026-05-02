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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { useLoginMutation } from "@/features/auth/hooks/useLogin"
import { Route as RecoveryRoute } from "@/pages/recovery"
import { Route as SignupRoute } from "@/pages/signup"
import HintInvalid from '@/features/auth/ui/HintInvalid'

const schema = z.object({
	email: z.string()
		.nonempty("Informe seu email institucional.")
		.email("Informe um email valido."),
	password: z.string()
		.nonempty("Informe sua senha.")
		.min(8, "A senha deve ter pelo menos 8 caracteres."),
})

type Schema = z.infer<typeof schema>

export function LoginForm() {
	const loginMutation = useLoginMutation()
	const {
		register,
		handleSubmit,
		formState: state,
	} = useForm<Schema>({
		resolver: zodResolver(schema),
		defaultValues: {
			email: "",
			password: "",
		},
	})

	const onSubmit = async (data: Schema) => {
		await loginMutation.mutateAsync(data)
	}

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
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="flex flex-col gap-6">
						<div className="grid gap-2">
							<Label htmlFor="email">Email Institucional</Label>
							<Input id="email" type="email" placeholder="joao@uefs.br" required {...register("email")}/>
              <HintInvalid for={state.errors.email} />
						</div>
						<div className="grid gap-2">
							<div className="flex items-center">
								<Label htmlFor="password">Senha</Label>
								<Link to={RecoveryRoute.to} className="ml-auto text-sm underline-offset-4 hover:underline">
									Esqueceu sua senha?
								</Link>
							</div>
							<Input id="password" type="password" required {...register("password")}/>
              <HintInvalid for={state.errors.password} />
						</div>
					</div>
					<CardFooter className="flex-col gap-2 px-0 pb-0 pt-6">
						<Button type="submit" className="w-full" disabled={state.isSubmitting}>
							{state.isSubmitting ? "Entrando..." : "Entrar"}
						</Button>
					</CardFooter>
				</form>
			</CardContent>
		</Card>
	)
}
