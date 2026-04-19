import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "@tanstack/react-router"

type Props = {
  paths: {
    login: string
  }
  onSuccess?: () => void
}

export function ChangePasswordForms({ paths, onSuccess }: Props) {
  const navigate = useNavigate()

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    
    // TODO: call your API here
    // const formData = new FormData(e.currentTarget)
    // const email = formData.get("email")
    // await api.requestRecovery(email)

    // move to next step
    onSuccess?.()
    navigate({
      to: paths.login,
      replace: true
    })
  }

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Recuperar Acesso</CardTitle>
          <CardDescription>
            Mude sua senha!
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-2">
          <Label htmlFor="password">Nova Senha</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
          <Label htmlFor="password-confirm">Confirmar Senha</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" required />
        </CardContent>

        <CardFooter className="flex-col gap-2">
          <Button type="submit" className="w-full cursor-pointer">
            Confirmar
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}