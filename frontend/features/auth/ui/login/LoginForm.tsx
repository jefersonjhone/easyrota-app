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
import { Link } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { useLoginMutation } from "@/features/auth/hooks/useLogin"
import { Route as RecoveryRoute } from "@/pages/recovery"
import { Route as SignupRoute } from "@/pages/signup"
import HintInvalid from '@/features/auth/ui/HintInvalid'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'

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
	const loginMutation = useLoginMutation()
	const form = useForm<Schema>({
		resolver: zodResolver(schema),
		defaultValues: {
			email: "",
			password: "",
		},
	})

  const { register, handleSubmit, formState: state } = form
  const isSubmitting = state.isSubmitting || loginMutation.isPending

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
							<Input id="password" type="password" required {...register("password")}/>
              <HintInvalid for={state.errors.password} />
						</Field>
					</FieldGroup>
				</form>
			</CardContent>
      <CardFooter className="flex-col">
        <Button form="login" type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
      </CardFooter>
		</Card>
	)
}
