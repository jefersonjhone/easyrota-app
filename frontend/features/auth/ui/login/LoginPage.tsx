import { LoginForm } from "@/features/auth/ui/login/LoginForm"
import AuthLayout from "@/features/auth/ui/AuthLayout"

export function LoginPage() {
	return (
		<AuthLayout>
			<LoginForm />
		</AuthLayout>
	)
}
